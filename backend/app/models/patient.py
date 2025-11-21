from pydantic import BaseModel, EmailStr, Field, field_validator, AliasChoices
from datetime import datetime
from typing import Optional, List
from enum import Enum

# ============================================================================
# Enums
# ============================================================================

class Gender(str, Enum):
    """Patient gender options"""
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
    OTHER = "other"


# ============================================================================
# Demographics
# ============================================================================

class Demographics(BaseModel):
    """Structured patient demographics"""
    age: Optional[int] = Field(None, ge=0, le=150, description="Patient age in years")
    gender: Optional[Gender] = Field(None, description="Patient gender identity")
    occupation: Optional[str] = Field(None, max_length=200, description="Patient occupation")
    referral_source: Optional[str] = Field(None, max_length=200, description="How patient was referred")
    initial_concerns: Optional[List[str]] = Field(default_factory=list, description="Initial presenting concerns")

    @field_validator('initial_concerns')
    @classmethod
    def validate_initial_concerns(cls, v):
        if v and len(v) > 10:
            raise ValueError("Maximum 10 initial concerns allowed")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "age": 32,
                "gender": "female",
                "occupation": "Software Engineer",
                "referral_source": "Primary Care Physician",
                "initial_concerns": ["anxiety", "work stress", "sleep issues"]
            }
        }


# ============================================================================
# Base Models
# ============================================================================

class PatientBase(BaseModel):
    """Base patient model with common fields"""
    name: str = Field(..., min_length=1, max_length=200, description="Patient full name")
    email: Optional[EmailStr] = Field(None, description="Patient email address")
    phone: Optional[str] = Field(None, max_length=50, description="Patient phone number")
    demographics: Optional[Demographics] = Field(None, description="Patient demographics")


class PatientCreate(PatientBase):
    """Model for creating a new patient"""

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "phone": "+1-555-0123",
                "demographics": {
                    "age": 32,
                    "gender": "female",
                    "occupation": "Software Engineer",
                    "referral_source": "Primary Care Physician",
                    "initial_concerns": ["anxiety", "work stress"]
                }
            }
        }


class PatientUpdate(BaseModel):
    """Model for updating patient information"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    demographics: Optional[Demographics] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Smith-Johnson",
                "phone": "+1-555-9999"
            }
        }


# ============================================================================
# Response Models
# ============================================================================

class PatientResponse(PatientBase):
    """Basic patient response model"""
    id: str
    therapist_id: str = Field(..., validation_alias=AliasChoices("therapistId", "therapist_id"))
    created_at: datetime = Field(..., validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: datetime = Field(..., validation_alias=AliasChoices("updatedAt", "updated_at"))

    class Config:
        from_attributes = True
        populate_by_name = True


class PatientStats(BaseModel):
    """Patient statistics"""
    total_sessions: int = Field(..., description="Total number of sessions")
    active_sessions: int = Field(..., description="Number of active/ongoing sessions")
    last_session_date: Optional[datetime] = Field(None, description="Date of most recent session")

    class Config:
        json_schema_extra = {
            "example": {
                "total_sessions": 12,
                "active_sessions": 0,
                "last_session_date": "2024-01-15T14:30:00Z"
            }
        }


class PatientDetailResponse(PatientResponse):
    """Detailed patient response with stats"""
    stats: PatientStats = Field(..., description="Patient session statistics")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "cljk1234567890",
                "therapist_id": "clth9876543210",
                "name": "Jane Smith",
                "email": "jane.smith@example.com",
                "phone": "+1-555-0123",
                "demographics": {
                    "age": 32,
                    "gender": "female",
                    "occupation": "Software Engineer",
                    "referral_source": "Primary Care Physician",
                    "initial_concerns": ["anxiety", "work stress"]
                },
                "created_at": "2024-01-01T10:00:00Z",
                "updated_at": "2024-01-15T14:30:00Z",
                "stats": {
                    "total_sessions": 12,
                    "active_sessions": 0,
                    "last_session_date": "2024-01-15T14:30:00Z"
                }
            }
        }


class PatientListResponse(BaseModel):
    """Response model for patient list with pagination"""
    patients: List[PatientResponse] = Field(..., description="List of patients")
    total: int = Field(..., description="Total number of patients matching query")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Number of items per page")

    class Config:
        json_schema_extra = {
            "example": {
                "patients": [
                    {
                        "id": "cljk1234567890",
                        "therapist_id": "clth9876543210",
                        "name": "Jane Smith",
                        "email": "jane.smith@example.com",
                        "phone": "+1-555-0123",
                        "demographics": {
                            "age": 32,
                            "gender": "female"
                        },
                        "created_at": "2024-01-01T10:00:00Z",
                        "updated_at": "2024-01-15T14:30:00Z"
                    }
                ],
                "total": 1,
                "page": 1,
                "page_size": 20
            }
        }
