from sqlalchemy.orm import Session
from . import models, schemas
from fastapi import HTTPException

def create_job_application(db: Session, app_data: schemas.JobApplicationCreate):
    job = models.JobApplication(**app_data.dict())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def get_all_applications(db: Session):
    return db.query(models.JobApplication).all()

def update_application(db: Session, app_id: int, app_data: schemas.JobApplicationCreate):
    app = db.query(models.JobApplication).filter(models.JobApplication.id == app_id).first()
    if not app:
        return None
    for key, value in app_data.dict().items():
        setattr(app, key, value)
    db.commit()
    db.refresh(app)
    return app


def delete_application(db: Session, app_id: int):
    app = db.query(models.JobApplication).filter(models.JobApplication.id == app_id).first()
    if not app:
        return False
    db.delete(app)
    db.commit()
    return True


def get_user_by_username(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

