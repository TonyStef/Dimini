from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from typing import List, Optional
from datetime import datetime
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

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
from app.voice_agent.services.patient_service import PatientService
from app.graph.algorithms import graph_algorithms
from app.graph.neo4j_client import neo4j_client
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

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
        order={"startedAt": "desc"},
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
        # Auto-close stale sessions (for debugging/recovery)
        logger.warning(f"Found existing active session {active_session.id}, auto-closing")
        await db.session.update(
            where={"id": active_session.id},
            data={
                "status": "COMPLETED",
                "endedAt": datetime.utcnow()
            }
        )
        # Stop background algorithms for the old session
        graph_algorithms.stop_background_algorithms(active_session.id)
        logger.info(f"Auto-closed session {active_session.id} to allow new session")
    
    # Create session
    session = await db.session.create(
        data={
            "patientId": session_data.patient_id,
            "therapistId": session_data.therapist_id or current_user.id,
            "status": "ACTIVE"
        }
    )

    logger.info(f"Started session {session.id} for patient {patient.id}")

    # Start background graph algorithms (Tier 2 & 3)
    graph_algorithms.start_background_algorithms(session.id)
    logger.info(f"Started background algorithms for session {session.id}")

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

    # IDEMPOTENT: If already completed, just return it
    if session.status == "COMPLETED":
        logger.info(f"Session {session_id} already completed, returning existing")
        return SessionResponse.model_validate(session)

    if session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is not active"
        )
    
    # Stop background graph algorithms
    graph_algorithms.stop_background_algorithms(session_id)
    logger.info(f"Stopped background algorithms for session {session_id}")

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
@limiter.limit("30/minute")
async def get_session_insights(
    request: Request,
    session_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get multi-tier graph insights for a session.

    Returns:
    - real_time: Weighted degree (instant, <5ms old)
    - core_issues: PageRank (accurate, ~10s old)
    - emotional_triggers: Betweenness (deep, ~60s old)

    Rate limit: 30 requests per minute per IP
    """
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

    try:
        # Get all entities with metrics from Neo4j
        entities = neo4j_client.get_session_entities(session_id)

        # Sort by different metrics
        by_weighted_degree = sorted(
            entities,
            key=lambda e: e.get('weighted_degree', 0),
            reverse=True
        )[:10]

        by_pagerank = sorted(
            entities,
            key=lambda e: e.get('pagerank', 0),
            reverse=True
        )[:10]

        by_betweenness = sorted(
            entities,
            key=lambda e: e.get('betweenness', 0),
            reverse=True
        )[:5]

        # Get metrics freshness
        freshness_query = """
        MATCH (e:Entity {session_id: $session_id})
        RETURN max(e.metrics_updated_at) AS last_updated
        """
        freshness_result = neo4j_client.execute_query(
            freshness_query,
            {"session_id": session_id}
        )

        last_updated = freshness_result[0]['last_updated'] if freshness_result else None

        return {
            "real_time": {
                "description": "Instant mention frequency + connectivity",
                "top_entities": [
                    {
                        "label": e['label'],
                        "type": e['node_type'],
                        "weighted_degree": e.get('weighted_degree', 0),
                        "mention_count": e.get('mention_count', 0)
                    }
                    for e in by_weighted_degree
                ],
                "latency": "instant (<5ms)"
            },
            "core_issues": {
                "description": "Most important topics via graph structure",
                "top_entities": [
                    {
                        "label": e['label'],
                        "type": e['node_type'],
                        "pagerank": e.get('pagerank', 0),
                        "mention_count": e.get('mention_count', 0)
                    }
                    for e in by_pagerank
                ],
                "last_updated": str(last_updated),
                "update_frequency": "every 10s"
            },
            "emotional_triggers": {
                "description": "Topics bridging multiple emotions",
                "top_entities": [
                    {
                        "label": e['label'],
                        "type": e['node_type'],
                        "betweenness": e.get('betweenness', 0)
                    }
                    for e in by_betweenness
                ],
                "last_updated": str(last_updated),
                "update_frequency": "every 60s"
            }
        }

    except Exception as e:
        logger.error(f"Error getting insights for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

    # Stop background graph algorithms
    graph_algorithms.stop_background_algorithms(session_id)
    logger.info(f"Stopped background algorithms for cancelled session {session_id}")

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

@router.get("/patients/{patient_id}/context")
async def get_patient_context(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get formatted patient context text for Hume AI injection.
    Frontend sends this directly to Hume as initial context.

    Returns:
        {
            "context_text": "...",
            "patient_name": "..."
        }
    """
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

    try:
        # Initialize PatientService with required parameters
        api_url = f"http://{settings.HOST}:{settings.PORT}/api"
        patient_service = PatientService(api_url=api_url, therapist_id=current_user.id)
        patient_history = await patient_service.fetch_patient_history(patient_id)
        context_text = patient_service.format_history_for_context(patient_history)

        logger.info(f"Generated context for patient {patient_id}, length: {len(context_text)}")

        return {
            "context_text": context_text,
            "patient_name": patient_history.get("name", "Unknown")
        }
    except Exception as e:
        logger.error(f"Failed to generate patient context: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate context: {str(e)}")

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
