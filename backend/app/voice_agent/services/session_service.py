"""
Session Service - Session CRUD and lifecycle management

Handles:
- Session creation/finalization
- Note management (save_session_note tool)
- Progress tracking (mark_progress tool)
- Concern flagging (flag_concern tool)
- Session summaries (generate_session_summary tool)

Note: update_kg_important tool is handled by KGService (Phase 4)
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing therapy sessions"""

    @staticmethod
    async def create_session(session_data: Dict) -> Dict:
        """Create new therapy session"""
        logger.info(f"Creating session for patient {session_data.get('patient_id')}")

        # TODO Phase 2: Prisma integration
        session = {
            "id": "session_uuid",
            "patient_id": session_data["patient_id"],
            "therapist_id": session_data["therapist_id"],
            "started_at": session_data["started_at"],
            "status": "in_progress"
        }

        return session

    @staticmethod
    async def add_note(session_id: str, note: str, category: str, importance: str, source: str = "ai_agent") -> Dict:
        """
        Add note to session.
        Called by save_session_note tool (Phase 3).

        Args:
            session_id: Session UUID
            note: Content of the note
            category: insight | observation | concern | progress
            importance: low | medium | high | critical
            source: ai_agent | therapist | system
        """
        from app.database import db

        logger.info(f"Adding {category} note to session {session_id}")

        # Verify session exists
        session = await db.session.find_unique(where={"id": session_id})
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # Map lowercase to ENUM (Prisma expects uppercase)
        category_enum = category.upper()  # "insight" -> "INSIGHT"
        importance_enum = importance.upper()  # "medium" -> "MEDIUM"

        # Create note in PostgreSQL
        db_note = await db.sessionnote.create(
            data={
                "sessionId": session_id,
                "content": note,
                "category": category_enum,
                "importance": importance_enum,
                "source": source
            }
        )

        logger.info(f"Note saved: {db_note.id} ({category_enum})")

        return {
            "id": db_note.id,
            "session_id": session_id,
            "content": note,
            "category": category,
            "importance": importance,
            "source": source,
            "timestamp": db_note.timestamp.isoformat()
        }

    @staticmethod
    async def mark_progress(session_id: str, progress_type: str, description: str, evidence: Optional[str] = None) -> Dict:
        """
        Mark therapeutic progress.
        Called by mark_progress tool (Phase 3).

        Args:
            session_id: Session UUID
            progress_type: emotional_regulation | insight_gained | behavioral_change | coping_skill
            description: Description of the progress
            evidence: Specific evidence of this progress (optional)
        """
        from app.database import db

        logger.info(f"Marking progress: {progress_type}")

        # Verify session exists
        session = await db.session.find_unique(where={"id": session_id})
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # Map to ENUM (Prisma expects uppercase)
        progress_type_enum = progress_type.upper()  # "emotional_regulation" -> "EMOTIONAL_REGULATION"

        # Create progress in PostgreSQL
        db_progress = await db.sessionprogress.create(
            data={
                "sessionId": session_id,
                "progressType": progress_type_enum,
                "description": description,
                "evidence": evidence
            }
        )

        logger.info(f"Progress marked: {db_progress.id} ({progress_type_enum})")

        return {
            "id": db_progress.id,
            "session_id": session_id,
            "progress_type": progress_type,
            "description": description,
            "evidence": evidence,
            "flagged_at": db_progress.flaggedAt.isoformat()
        }

    @staticmethod
    async def flag_concern(session_id: str, concern_type: str, severity: str, description: str, recommended_action: Optional[str] = None) -> Dict:
        """
        Flag concerning pattern or risk factor.
        Called by flag_concern tool (Phase 3).

        Args:
            session_id: Session UUID
            concern_type: emotional_distress | risk_behavior | deterioration | crisis_indicator
            severity: moderate | high | urgent
            description: Description of the concern
            recommended_action: Suggested therapist action (optional)
        """
        from app.database import db

        logger.warning(f"Flagging concern: {concern_type} ({severity})")

        # Verify session exists
        session = await db.session.find_unique(where={"id": session_id})
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        # Map to ENUMs (Prisma expects uppercase)
        concern_type_enum = concern_type.upper()  # "emotional_distress" -> "EMOTIONAL_DISTRESS"
        severity_enum = severity.upper()  # "high" -> "HIGH"

        # Create concern in PostgreSQL
        db_concern = await db.sessionconcern.create(
            data={
                "sessionId": session_id,
                "concernType": concern_type_enum,
                "severity": severity_enum,
                "description": description,
                "recommendedAction": recommended_action
            }
        )

        logger.info(f"Concern flagged: {db_concern.id} ({concern_type_enum}, {severity_enum})")

        return {
            "id": db_concern.id,
            "session_id": session_id,
            "concern_type": concern_type,
            "severity": severity,
            "description": description,
            "recommended_action": recommended_action,
            "flagged_at": db_concern.flaggedAt.isoformat()
        }

    @staticmethod
    async def finalize_session(session_id: str, ended_at: datetime, duration: int):
        """Finalize session"""
        logger.info(f"Finalizing session {session_id}")
        # TODO Phase 2: Update DB

    @staticmethod
    async def generate_summary(session_id: str) -> Dict:
        """Generate session summary"""
        return {"session_id": session_id, "summary": "Generated summary"}

    @staticmethod
    async def generate_detailed_summary(session_id: str, include_emotions: bool, include_topics: bool, include_recommendations: bool) -> Dict:
        """
        Generate structured summary of therapy session.
        Called by generate_session_summary tool (Phase 3).

        Args:
            session_id: Session UUID
            include_emotions: Include emotional timeline
            include_topics: Include topics discussed
            include_recommendations: Include therapist recommendations

        Returns:
            Structured summary dict
        """
        from app.database import db

        # Verify session exists
        session = await db.session.find_unique(where={"id": session_id})
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        summary_data = {}

        if include_emotions:
            # Query emotions from session.emotionTimeline (JSONB)
            summary_data["emotions"] = session.emotionTimeline or []

        if include_topics:
            # Query topics from session.topicsDiscussed (JSONB)
            summary_data["topics"] = session.topicsDiscussed or []

        if include_recommendations:
            # Query concerns and progress from tool calls
            concerns = await db.sessionconcern.find_many(
                where={"sessionId": session_id},
                order={"severity": "desc"}
            )
            progress = await db.sessionprogress.find_many(
                where={"sessionId": session_id}
            )

            summary_data["recommendations"] = {
                "high_priority_concerns": [
                    {
                        "type": c.concernType,
                        "severity": c.severity,
                        "description": c.description
                    }
                    for c in concerns[:3]
                ],
                "notable_progress": [
                    {
                        "type": p.progressType,
                        "description": p.description
                    }
                    for p in progress[:3]
                ]
            }

        # Save summary to StoredSessionSummary
        db_summary = await db.storedsessionsummary.upsert(
            where={"sessionId": session_id},
            create={
                "sessionId": session_id,
                "emotionsData": summary_data.get("emotions"),
                "topicsData": summary_data.get("topics"),
                "recommendationsData": summary_data.get("recommendations")
            },
            update={
                "emotionsData": summary_data.get("emotions"),
                "topicsData": summary_data.get("topics"),
                "recommendationsData": summary_data.get("recommendations")
            }
        )

        logger.info(f"Summary generated and saved: {db_summary.id}")

        return summary_data
