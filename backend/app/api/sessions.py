from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import logging

from app.database import db
from app.models.session import (
    SessionCreate, SessionResponse, TranscriptUpdate, 
    ProcessingResult, SessionSummary
)
from app.models.graph import FrontendGraphData
from app.models.auth import UserResponse
from app.api.auth import get_current_user
from app.services.graph_builder import GraphBuilder, get_session_graph_data
from app.services.session_analyzer import SessionAnalyzer
from app.services.realtime import RealtimeService

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services (in production, use dependency injection)
graph_builder = None
session_analyzer = SessionAnalyzer()

def get_graph_builder():
    """Get graph builder with realtime service"""
    global graph_builder
    if graph_builder is None:
        from app.main import realtime_service
        graph_builder = GraphBuilder(realtime_service)
    return graph_builder

@router.get("/", response_model=List[SessionResponse])
async def get_sessions(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get sessions for the current therapist"""
    where_clause = {"therapistId": current_user.id}
    
    if patient_id:
        # Verify patient belongs to therapist
        patient = await db.patient.find_first(
            where={
                "id": patient_id,
                "therapistId": current_user.id
            }
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        where_clause["patientId"] = patient_id
    
    if status:
        where_clause["status"] = status.upper()
    
    sessions = await db.session.find_many(
        where=where_clause,
        skip=skip,
        take=limit,
        order_by={"startedAt": "desc"},
        include={"patient": True}
    )
    
    return [SessionResponse.model_validate(s) for s in sessions]

@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    session_data: SessionCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Start a new therapy session"""
    # Verify patient belongs to therapist
    patient = await db.patient.find_first(
        where={
            "id": session_data.patient_id,
            "therapistId": current_user.id
        }
    )
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check for existing active sessions
    active_session = await db.session.find_first(
        where={
            "patientId": session_data.patient_id,
            "status": "ACTIVE"
        }
    )
    
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient already has an active session"
        )
    
    # Create session
    session = await db.session.create(
        data={
            "patientId": session_data.patient_id,
            "therapistId": session_data.therapist_id or current_user.id,
            "status": "ACTIVE"
        }
    )
    
    logger.info(f"Started session {session.id} for patient {patient.id}")
    
    # Notify via websocket
    if get_graph_builder().realtime_service:
        await get_graph_builder().realtime_service.broadcast_session_status(
            session.id, "ACTIVE"
        )
    
    return SessionResponse.model_validate(session)

@router.post("/{session_id}/transcript", response_model=ProcessingResult)
async def update_transcript(
    session_id: str,
    transcript_data: TranscriptUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Voice agent calls this endpoint every 30 seconds.
    Process transcript chunk and update graph.
    """
    # Verify session exists and belongs to therapist
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        },
        include={"patient": True}
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    # Update transcript
    current_transcript = session.transcript or ""
    updated_transcript = current_transcript + "\n" + transcript_data.text if current_transcript else transcript_data.text
    
    await db.session.update(
        where={"id": session_id},
        data={"transcript": updated_transcript}
    )
    
    logger.info(f"Updated transcript for session {session_id}, processing chunk...")
    
    # Process the chunk
    result = await get_graph_builder().process_transcript_chunk(
        session_id=session_id,
        transcript_chunk=transcript_data.text
    )
    
    return result

@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user)
):
    """End a therapy session and trigger summary generation"""
    # Verify session exists and belongs to therapist
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        }
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    # Update session status
    updated_session = await db.session.update(
        where={"id": session_id},
        data={
            "status": "COMPLETED",
            "endedAt": datetime.utcnow()
        }
    )
    
    logger.info(f"Ended session {session_id}")
    
    # Generate summary in background
    background_tasks.add_task(
        generate_session_summary_task,
        session_id
    )
    
    # Notify via websocket
    if get_graph_builder().realtime_service:
        await get_graph_builder().realtime_service.broadcast_session_status(
            session_id, "COMPLETED"
        )
    
    return SessionResponse.model_validate(updated_session)

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific session"""
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        },
        include={"patient": True}
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return SessionResponse.model_validate(session)

@router.get("/{session_id}/graph", response_model=FrontendGraphData)
async def get_session_graph(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get the complete graph data for a session"""
    # Verify session exists and belongs to therapist
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        }
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    graph_data = await get_session_graph_data(session_id)
    return graph_data

@router.get("/{session_id}/insights")
async def get_session_insights(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get quick insights about a session"""
    # Verify session exists and belongs to therapist
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        }
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    insights = await session_analyzer.get_session_insights(session_id)
    return insights

@router.post("/{session_id}/cancel", response_model=SessionResponse)
async def cancel_session(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Cancel an active session"""
    # Verify session exists and belongs to therapist
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": current_user.id
        }
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active sessions can be cancelled"
        )
    
    # Update session status
    updated_session = await db.session.update(
        where={"id": session_id},
        data={
            "status": "CANCELLED",
            "endedAt": datetime.utcnow()
        }
    )
    
    logger.info(f"Cancelled session {session_id}")
    
    # Notify via websocket
    if get_graph_builder().realtime_service:
        await get_graph_builder().realtime_service.broadcast_session_status(
            session_id, "CANCELLED"
        )
    
    return SessionResponse.model_validate(updated_session)

# Background task for summary generation
async def generate_session_summary_task(session_id: str):
    """Generate session summary in background"""
    try:
        logger.info(f"Generating summary for session {session_id}")
        summary = await session_analyzer.analyze_session(session_id)
        if summary:
            logger.info(f"Summary generated for session {session_id}")
        else:
            logger.error(f"Failed to generate summary for session {session_id}")
    except Exception as e:
        logger.error(f"Error in background summary generation: {e}")
