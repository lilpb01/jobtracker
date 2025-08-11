from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, schemas, crud, auth
from .database import SessionLocal, engine, Base
from fastapi.middleware.cors import CORSMiddleware
from .auth_utils import get_current_user, hash_password, create_access_token, verify_password
from .analyze_resume import router as resume_router
from sqlalchemy import func
from collections import defaultdict
from fastapi.responses import JSONResponse




# Create DB tables
Base.metadata.create_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

ALLOWED_ORIGINS = ["http://localhost:5178",
    "http://127.0.0.1:5178",

    "http://localhost:5173",
    "http://127.0.0.1:5173",]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Backend is working!"}

@app.post("/applications/", response_model=schemas.JobApplicationOut)
def create_application(app_data: schemas.JobApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_app = models.JobApplication(**app_data.dict(), user_id=current_user.id)
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@app.get("/applications/", response_model=list[schemas.JobApplicationOut])
def get_all_applications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.JobApplication).filter(models.JobApplication.user_id == current_user.id).all()


@app.get("/applications/{app_id}", response_model=schemas.JobApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app = db.query(models.JobApplication).filter(models.JobApplication.id == app_id, models.JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    return app


@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app = db.query(models.JobApplication).filter(models.JobApplication.id == app_id, models.JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(app)
    db.commit()
    return {"detail": "Deleted"}


@app.put("/applications/{app_id}", response_model=schemas.JobApplicationOut)
def update_application(app_id: int, app_data: schemas.JobApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app = db.query(models.JobApplication).filter(models.JobApplication.id == app_id, models.JobApplication.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in app_data.dict().items():
        setattr(app, key, value)
    db.commit()
    db.refresh(app)
    return app

@app.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    hashed_pw = hash_password(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/dashboard/")
def dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total = db.query(models.JobApplication).filter(models.JobApplication.user_id == current_user.id).count()

    status_counts = db.query(
        models.JobApplication.status,
        func.count(models.JobApplication.id)
    ).filter(models.JobApplication.user_id == current_user.id).group_by(models.JobApplication.status).all()

    date_counts = db.query(
        func.date(models.JobApplication.applied_date),
        func.count(models.JobApplication.id)
    ).filter(models.JobApplication.user_id == current_user.id).group_by(func.date(models.JobApplication.applied_date)).all()

    return JSONResponse(content={
        "total_applications": total,
        "status_distribution": dict(status_counts),
        "applications_over_time": [{"date": str(date), "count": count} for date, count in date_counts]
    })





app.include_router(auth.router)
app.include_router(resume_router)