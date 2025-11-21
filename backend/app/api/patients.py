from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import logging

from app.database import db
from app.models.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.models.auth import UserResponse
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=PatientListResponse)
async def get_patients(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all patients for the current therapist"""
    where_clause = {"therapistId": current_user.id}
    
    # Add search filter if provided
    if search:
        where_clause["OR"] = [
            {"name": {"contains": search, "mode": "insensitive"}},
            {"email": {"contains": search, "mode": "insensitive"}},
            {"phone": {"contains": search, "mode": "insensitive"}}
        ]
    
    # Get total count
    total = await db.patient.count(where=where_clause)
    
    # Get patients with pagination
    patients = await db.patient.find_many(
        where=where_clause,
        skip=skip,
        take=limit,
        order_by={"createdAt": "desc"}
    )
    
    return PatientListResponse(
        patients=[PatientResponse.model_validate(p) for p in patients],
        total=total
    )

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new patient"""
    # Check if email already exists for this therapist
    if patient_data.email:
        existing = await db.patient.find_first(
            where={
                "therapistId": current_user.id,
                "email": patient_data.email
            }
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this email already exists"
            )
    
    # Create patient
    patient = await db.patient.create(
        data={
            **patient_data.model_dump(exclude_none=True),
            "therapistId": current_user.id
        }
    )
    
    logger.info(f"Created patient {patient.id} for therapist {current_user.id}")
    return PatientResponse.model_validate(patient)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific patient by ID"""
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
    
    return PatientResponse.model_validate(patient)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a patient's information"""
    # Check if patient exists and belongs to current therapist
    existing_patient = await db.patient.find_first(
        where={
            "id": patient_id,
            "therapistId": current_user.id
        }
    )
    
    if not existing_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check email uniqueness if updating email
    if patient_data.email and patient_data.email != existing_patient.email:
        email_exists = await db.patient.find_first(
            where={
                "therapistId": current_user.id,
                "email": patient_data.email,
                "id": {"not": patient_id}
            }
        )
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this email already exists"
            )
    
    # Update patient
    update_data = patient_data.model_dump(exclude_none=True)
    if update_data:
        patient = await db.patient.update(
            where={"id": patient_id},
            data=update_data
        )
        
        logger.info(f"Updated patient {patient_id}")
        return PatientResponse.model_validate(patient)
    
    return PatientResponse.model_validate(existing_patient)

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a patient (soft delete recommended in production)"""
    # Check if patient exists and belongs to current therapist
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
    
    # Check if patient has active sessions
    active_sessions = await db.session.count(
        where={
            "patientId": patient_id,
            "status": "ACTIVE"
        }
    )
    
    if active_sessions > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete patient with active sessions"
        )
    
    # Delete patient (cascades to sessions and graph data)
    await db.patient.delete(where={"id": patient_id})
    
    logger.info(f"Deleted patient {patient_id}")

@router.get("/{patient_id}/sessions/count")
async def get_patient_session_count(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get session statistics for a patient"""
    # Verify patient belongs to current therapist
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
    
    # Get session counts
    total_sessions = await db.session.count(
        where={"patientId": patient_id}
    )
    
    active_sessions = await db.session.count(
        where={
            "patientId": patient_id,
            "status": "ACTIVE"
        }
    )
    
    completed_sessions = await db.session.count(
        where={
            "patientId": patient_id,
            "status": "COMPLETED"
        }
    )
    
    return {
        "total": total_sessions,
        "active": active_sessions,
        "completed": completed_sessions
    }
