from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobApplicationCreate(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    status: Optional[str] = "Applied"
    notes: Optional[str] = None

class JobApplicationOut(JobApplicationCreate):
    id: int
    applied_date: datetime

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True  # Needed for Pydantic v2
