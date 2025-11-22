"""
Patient Service - Adapted from Brian Agent PropertyService
Fetches patient history and formats context for Hume injection
"""

from typing import List, Dict, Optional
from datetime import datetime
import httpx
import logging

logger = logging.getLogger(__name__)


class PatientService:
    """
    Service for fetching and formatting patient data.

    Adapted from: brian_agent/webhook_v0_livekit/services/property_service.py
    Reuse: 85% - Service pattern structure
    Adaptation: Properties → Patient data
    """

    def __init__(self, api_url: str, therapist_id: str):
        self.api_url = api_url
        self.therapist_id = therapist_id
        self.cached_patient_data: Dict = {}
        self.cache_timestamp: Optional[datetime] = None

    async def fetch_patient_history(self, patient_id: str) -> Dict:
        """
        Fetch patient history for context injection.

        Returns:
            Dictionary with patient background, triggers, previous insights
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/patients/{patient_id}/history",
                    params={"therapist_id": self.therapist_id},
                    timeout=10.0
                )
                response.raise_for_status()

                data = response.json()
                if data.get('success'):
                    self.cached_patient_data = data['data']
                    self.cache_timestamp = datetime.now()
                    return self.cached_patient_data
                else:
                    return {}

        except httpx.RequestError as e:
            print(f"Failed to fetch patient history: {e}")
            return self.cached_patient_data

    async def get_previous_sessions(self, patient_id: str, limit: int = 5) -> List[Dict]:
        """
        Fetch summaries of previous therapy sessions.

        Args:
            patient_id: Patient identifier
            limit: Number of recent sessions to fetch

        Returns:
            List of session summaries
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/sessions",
                    params={
                        "patient_id": patient_id,
                        "limit": limit,
                        "order": "desc"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()["data"]["sessions"]

        except httpx.RequestError as e:
            print(f"Failed to fetch sessions: {e}")
            return []

    def format_history_for_context(self, patient_data: Optional[Dict] = None) -> str:
        """
        Format patient history as readable text for Hume context injection.

        Args:
            patient_data: Patient history dictionary (uses cache if None)

        Returns:
            Formatted string ready for context injection
        """
        if patient_data is None:
            patient_data = self.cached_patient_data

        if not patient_data:
            return "No previous patient history available."

        lines = ["Patient Background:\n"]

        # Basic info
        lines.append(f"Name: {patient_data.get('name', 'Unknown')}")

        if age := patient_data.get('age'):
            lines.append(f"Age: {age}")

        # Previous diagnoses
        if diagnoses := patient_data.get('diagnoses'):
            lines.append(f"\nPrevious Diagnoses:")
            for diagnosis in diagnoses:
                lines.append(f"- {diagnosis}")

        # Known triggers
        if triggers := patient_data.get('triggers'):
            lines.append(f"\nKnown Triggers:")
            for trigger in triggers:
                lines.append(f"- {trigger['description']} (intensity: {trigger['intensity']})")

        # Therapy goals
        if goals := patient_data.get('therapy_goals'):
            lines.append(f"\nTherapy Goals:")
            for goal in goals:
                lines.append(f"- {goal}")

        # Recent insights
        if insights := patient_data.get('recent_insights'):
            lines.append(f"\nRecent Insights:")
            for insight in insights[:3]:  # Last 3 insights
                lines.append(f"- {insight['date']}: {insight['content']}")

        return "\n".join(lines)

    async def get_patient_kg_summary(self, patient_id: str) -> str:
        """
        Get summary of patient's knowledge graph state.

        Returns:
            Formatted KG summary for context
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/kg/{patient_id}/summary",
                    timeout=10.0
                )
                response.raise_for_status()

                kg_data = response.json()["data"]

                summary_lines = ["\nKnowledge Graph Summary:"]
                summary_lines.append(f"Total nodes: {kg_data['total_nodes']}")
                summary_lines.append(f"Primary emotions: {', '.join(kg_data['top_emotions'])}")
                summary_lines.append(f"Key topics: {', '.join(kg_data['key_topics'])}")

                return "\n".join(summary_lines)

        except Exception as e:
            print(f"Failed to fetch KG summary: {e}")
            return ""


async def load_and_inject_patient_context(patient_id: str, hume_service):
    """
    Load patient data from database and inject formatted context into Hume session.

    This function retrieves patient information (name, demographics) and formats
    it into a structured context message for the voice agent.

    Args:
        patient_id: Patient identifier
        hume_service: HumeService instance with active WebSocket connection

    Returns:
        bool: True if context was injected, False otherwise
    """
    try:
        from app.database import db

        # Fetch patient from database
        patient = await db.patient.find_unique(
            where={"id": patient_id},
            include={"therapist": True}
        )

        if not patient:
            logger.error(f"PATIENT_CONTEXT: Patient {patient_id} not found")
            return False

        # Format patient context from demographics
        context_text = format_patient_context(patient)

        # Inject context into Hume session
        await hume_service.inject_patient_history_text(
            patient_id=patient_id,
            history_text=context_text
        )

        logger.info(f"PATIENT_CONTEXT: Successfully loaded and injected context for patient {patient_id}")
        return True

    except Exception as e:
        logger.error(f"PATIENT_CONTEXT: Failed to load context for patient {patient_id}: {e}", exc_info=True)
        return False


def format_patient_context(patient) -> str:
    """
    Format patient data into structured context text for voice agent.

    Args:
        patient: Patient record from database

    Returns:
        Formatted context string
    """
    lines = ["=== PATIENT CONTEXT ===\n"]

    # Basic information
    lines.append(f"Patient Name: {patient.name}")

    # Parse demographics (stored as JSON)
    demographics = patient.demographics or {}

    if isinstance(demographics, dict):
        # Age and gender
        if age := demographics.get("age"):
            lines.append(f"Age: {age} years old")

        if gender := demographics.get("gender"):
            gender_display = gender.replace("_", " ").title()
            lines.append(f"Gender: {gender_display}")

        # Occupation
        if occupation := demographics.get("occupation"):
            lines.append(f"Occupation: {occupation}")

        # Referral source
        if referral := demographics.get("referral_source"):
            lines.append(f"Referred by: {referral}")

        # Initial concerns
        if concerns := demographics.get("initial_concerns"):
            if concerns and isinstance(concerns, list):
                lines.append("\nInitial Presenting Concerns:")
                for concern in concerns:
                    lines.append(f"  - {concern}")

    return "\n".join(lines)
