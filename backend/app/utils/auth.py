from typing import Optional
from datetime import datetime, timedelta
from app.database import db
from app.models.auth import UserResponse

async def create_audit_log(
    user_id: str,
    section: str,
    action: str,
    ip_address: str,
    user_agent: str,
    changes_before: Optional[dict] = None,
    changes_after: Optional[dict] = None
):
    """Create an audit log entry"""
    await db.auditlog.create(
        data={
            "userId": user_id,
            "section": section,
            "action": action,
            "ipAddress": ip_address,
            "userAgent": user_agent,
            "changesBefore": changes_before or {},
            "changesAfter": changes_after or {}
        }
    )

async def is_user_authorized_for_patient(user_id: str, patient_id: str) -> bool:
    """Check if a user is authorized to access a patient"""
    patient = await db.patient.find_first(
        where={
            "id": patient_id,
            "therapistId": user_id
        }
    )
    return patient is not None

async def is_user_authorized_for_session(user_id: str, session_id: str) -> bool:
    """Check if a user is authorized to access a session"""
    session = await db.session.find_first(
        where={
            "id": session_id,
            "therapistId": user_id
        }
    )
    return session is not None

async def get_user_by_email(email: str) -> Optional[UserResponse]:
    """Get a user by email"""
    user = await db.user.find_unique(where={"email": email})
    return UserResponse.model_validate(user) if user else None

async def update_password_reset_token(user_id: str, reset_token: str, expiry_minutes: int = 15):
    """Update password reset token for a user"""
    expiry_time = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    
    await db.user.update(
        where={"id": user_id},
        data={
            "resetToken": reset_token,
            "resetTokenExpiry": expiry_time
        }
    )
