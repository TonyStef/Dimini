"""
Tool Handlers for Hume AI Webhook Integration

Handles execution of therapy tools called by Hume AI voice agent.
Each handler corresponds to a tool defined in Hume AI configuration.
"""

from typing import Dict
import logging
import asyncio
from .session_service import SessionService
from .tool_kg_integration import ToolKGIntegration

logger = logging.getLogger(__name__)

# Initialize KG integration service
kg_integration = ToolKGIntegration()


async def execute_save_note(session_id: str, params: Dict) -> Dict:
    """
    Execute save_session_note tool.

    Called when Hume AI agent wants to save an observation or insight.

    Args:
        session_id: Session UUID
        params: {
            "note": str,
            "category": "insight" | "observation" | "concern" | "progress",
            "importance": "low" | "medium" | "high" | "critical" (optional)
        }

    Returns:
        Success/error response dict
    """
    try:
        logger.info(f"Executing save_note for session {session_id}")

        # [1] Save to PostgreSQL
        note = await SessionService.add_note(
            session_id=session_id,
            note=params["note"],
            category=params["category"],
            importance=params.get("importance", "medium"),
            source="ai_agent"
        )

        # [2] Process for KG (async, non-blocking)
        asyncio.create_task(
            kg_integration.process_note_for_kg(
                session_id=session_id,
                note_content=params["note"],
                category=params["category"]
            )
        )

        return {
            "status": "success",
            "note_id": note.get("id"),
            "message": f"Note saved: {params['category']}"
        }

    except KeyError as e:
        logger.error(f"Missing required parameter: {e}")
        return {
            "status": "error",
            "message": f"Missing required parameter: {e}"
        }

    except Exception as e:
        logger.error(f"Error saving note: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


async def execute_mark_progress(session_id: str, params: Dict) -> Dict:
    """
    Execute mark_progress tool.

    Called when Hume AI agent identifies significant therapeutic progress.

    Args:
        session_id: Session UUID
        params: {
            "progress_type": "emotional_regulation" | "insight_gained" | "behavioral_change" | "coping_skill",
            "description": str,
            "evidence": str (optional)
        }

    Returns:
        Success/error response dict
    """
    try:
        logger.info(f"Executing mark_progress for session {session_id}: {params['progress_type']}")

        # [1] Save to PostgreSQL
        progress = await SessionService.mark_progress(
            session_id=session_id,
            progress_type=params["progress_type"],
            description=params["description"],
            evidence=params.get("evidence")
        )

        # [2] Process for KG (async, non-blocking)
        asyncio.create_task(
            kg_integration.process_progress_for_kg(
                session_id=session_id,
                progress_type=params["progress_type"],
                description=params["description"]
            )
        )

        return {
            "status": "success",
            "progress_id": progress.get("id"),
            "message": f"Progress marked: {params['progress_type']}"
        }

    except KeyError as e:
        logger.error(f"Missing required parameter: {e}")
        return {
            "status": "error",
            "message": f"Missing required parameter: {e}"
        }

    except Exception as e:
        logger.error(f"Error marking progress: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


async def execute_flag_concern(session_id: str, params: Dict) -> Dict:
    """
    Execute flag_concern tool.

    Called when Hume AI agent identifies concerning patterns or risk factors.

    Args:
        session_id: Session UUID
        params: {
            "concern_type": "emotional_distress" | "risk_behavior" | "deterioration" | "crisis_indicator",
            "severity": "moderate" | "high" | "urgent",
            "description": str,
            "recommended_action": str (optional)
        }

    Returns:
        Success/error response dict
    """
    try:
        logger.info(f"Executing flag_concern for session {session_id}: {params['concern_type']} ({params['severity']})")

        # [1] Save to PostgreSQL
        concern = await SessionService.flag_concern(
            session_id=session_id,
            concern_type=params["concern_type"],
            severity=params["severity"],
            description=params["description"],
            recommended_action=params.get("recommended_action")
        )

        # [2] Process for KG (async, non-blocking)
        asyncio.create_task(
            kg_integration.process_concern_for_kg(
                session_id=session_id,
                concern_type=params["concern_type"],
                severity=params["severity"],
                description=params["description"]
            )
        )

        # TODO Phase 5: Send urgent alert via WebSocket if severity is high/urgent
        # if params["severity"] in ["high", "urgent"]:
        #     await WebSocketManager.send_urgent_alert(session_id, concern)

        return {
            "status": "success",
            "concern_id": concern.get("id"),
            "message": f"Concern flagged: {params['concern_type']} ({params['severity']})"
        }

    except KeyError as e:
        logger.error(f"Missing required parameter: {e}")
        return {
            "status": "error",
            "message": f"Missing required parameter: {e}"
        }

    except Exception as e:
        logger.error(f"Error flagging concern: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


async def execute_generate_summary(session_id: str, params: Dict) -> Dict:
    """
    Execute generate_session_summary tool.

    Called when Hume AI agent needs to generate session summary.

    Args:
        session_id: Session UUID
        params: {
            "include_emotions": bool (optional),
            "include_topics": bool (optional),
            "include_recommendations": bool (optional)
        }

    Returns:
        Success/error response dict with summary
    """
    try:
        logger.info(f"Executing generate_summary for session {session_id}")

        # Generate summary (KG data deferred to Phase 4)
        summary = await SessionService.generate_detailed_summary(
            session_id=session_id,
            include_emotions=params.get("include_emotions", True),
            include_topics=params.get("include_topics", True),
            include_recommendations=params.get("include_recommendations", True)
        )

        return {
            "status": "success",
            "summary": summary,
            "message": "Session summary generated"
        }

    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


# Tool handler registry for routing
TOOL_HANDLERS = {
    "save_session_note": execute_save_note,
    "mark_progress": execute_mark_progress,
    "flag_concern": execute_flag_concern,
    "generate_session_summary": execute_generate_summary
}
