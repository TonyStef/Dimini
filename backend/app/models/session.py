from pydantic import Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

from app.models.base import DiminiBaseModel

class SessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class SessionCreate(DiminiBaseModel):
    patient_id: str
    therapist_id: Optional[str] = None

class SessionResponse(DiminiBaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    therapist_id: str = Field(alias="therapistId")
    started_at: datetime = Field(alias="startedAt")
    ended_at: Optional[datetime] = Field(default=None, alias="endedAt")
    status: SessionStatus
    transcript: str = Field(default="")
    summary: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        from_attributes = True
        populate_by_name = True

class TranscriptUpdate(DiminiBaseModel):
    text: str

class SessionSummary(DiminiBaseModel):
    key_topics: List[str]
    emotional_themes: List[str]
    insights: str
    recommendations: List[str]
    progress_notes: Optional[str] = None

class ProcessingResult(DiminiBaseModel):
    nodes_added: List[Dict[str, Any]]
    edges_added: List[Dict[str, Any]]
    status: str
    error: Optional[str] = None
