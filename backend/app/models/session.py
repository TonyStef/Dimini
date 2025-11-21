from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

class SessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class SessionCreate(BaseModel):
    patient_id: str
    therapist_id: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    patient_id: str
    therapist_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: SessionStatus
    transcript: str
    summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TranscriptUpdate(BaseModel):
    text: str

class SessionSummary(BaseModel):
    key_topics: List[str]
    emotional_themes: List[str]
    insights: str
    recommendations: List[str]
    progress_notes: Optional[str] = None

class ProcessingResult(BaseModel):
    nodes_added: List[Dict[str, Any]]
    edges_added: List[Dict[str, Any]]
    status: str
    error: Optional[str] = None
