from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any

class PatientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    demographics: Optional[Dict[str, Any]] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    demographics: Optional[Dict[str, Any]] = None

class PatientResponse(PatientBase):
    id: str
    therapist_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PatientListResponse(BaseModel):
    patients: list[PatientResponse]
    total: int
