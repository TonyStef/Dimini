# Patients Tab Implementation Guide

**Project:** Dimini - AI Therapy Assistant
**Component:** Patients Management System
**Context:** Hackathon Implementation
**Date Created:** 2025-11-21
**Status:** 📋 Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites & Context](#prerequisites--context)
4. [Phase 1: Backend API Foundation](#phase-1-backend-api-foundation)
5. [Phase 2: Frontend Patient List](#phase-2-frontend-patient-list)
6. [Phase 3: Patient Creation Flow](#phase-3-patient-creation-flow)
7. [Phase 4: Patient Detail & Sessions Integration](#phase-4-patient-detail--sessions-integration)
8. [Phase 5: Real-time Updates & Polish](#phase-5-real-time-updates--polish)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)
11. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### What We're Building

A complete patient management system that allows therapists to:
- View all their patients in a card grid layout
- Add new patients with essential demographics
- View patient details and session history
- Start therapy sessions that connect to voice AI
- See real-time session status updates

### Key Design Decisions (From Brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Display Style** | Card Grid Layout | More visually impressive for demos, better UX for therapy context |
| **Add Patient UI** | Sheet Slide-over | Polished animation, keeps context, modern UX pattern |
| **State Management** | Context API (MVP) → React Query (Production) | Speed for hackathon, scalability path clear |
| **Routing** | Nested routes (`/patients/[id]`) | Scalable, deep-linkable, clear URL structure |
| **Real-time** | Supabase Realtime for session status | Already implemented for graphs, consistent architecture |
| **Delete Strategy** | Hard delete with confirmation | Faster for MVP, add soft delete post-hackathon |
| **Demographics** | Flexible JSON with core fields | Balance of structure and flexibility |

### User Flow (Critical Path)

```
1. Therapist logs in → Dashboard
2. Clicks "Patients" in nav
3. Sees patient grid (or empty state)
4. Clicks "Add New Patient"
5. Sheet slides in with form
6. Fills: Name, Age, Gender, Initial Concerns
7. Submits → Patient card appears with animation
8. Clicks patient card → Patient detail page
9. Navigates to "Sessions" tab
10. Clicks "Start New Session"
11. Creates session → Redirects to live session view
12. Voice AI (teammate) connects and starts processing
13. Graph visualizes semantic relationships in real-time
```

---

## Architecture Overview

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Patients   │  │   Patient    │  │   Sessions   │     │
│  │   List Page  │─▶│ Detail Page  │─▶│   Integration│     │
│  │              │  │              │  │              │     │
│  │ /patients    │  │/patients/[id]│  │.../sessions  │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │             │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                                               │ HTTP/REST
                                               │
                    ┌──────────────────────────▼─────────────┐
                    │      Backend (FastAPI)                 │
                    ├────────────────────────────────────────┤
                    │                                        │
                    │  GET    /api/patients                  │
                    │  POST   /api/patients                  │
                    │  GET    /api/patients/{id}             │
                    │  PATCH  /api/patients/{id}             │
                    │  DELETE /api/patients/{id}             │
                    │  POST   /api/patients/{id}/sessions/start│
                    │  GET    /api/patients/{id}/sessions    │
                    │                                        │
                    └─────────────────┬──────────────────────┘
                                      │
                                      │ Prisma ORM
                                      │
                    ┌─────────────────▼──────────────────────┐
                    │      PostgreSQL Database               │
                    ├────────────────────────────────────────┤
                    │                                        │
                    │  ┌──────────┐  ┌──────────┐          │
                    │  │ patients │  │ sessions │          │
                    │  │          │──│          │          │
                    │  │ therapist│  │ patient  │          │
                    │  │   scoped │  │   scoped │          │
                    │  └──────────┘  └──────────┘          │
                    │                                        │
                    └────────────────────────────────────────┘
                                      │
                                      │ Realtime Updates
                                      │
                    ┌─────────────────▼──────────────────────┐
                    │   Supabase Realtime (WebSocket)        │
                    │   - Session status updates             │
                    │   - Active session badges              │
                    └────────────────────────────────────────┘
```

### Data Flow: Patient Creation → Session → Voice AI

```
User Action              Frontend                Backend                Database              Voice AI
    │                        │                       │                      │                    │
    ├─ Click "Add Patient"   │                       │                      │                    │
    │                        │                       │                      │                    │
    ├──────────────────────▶ │ Open Sheet            │                      │                    │
    │                        │                       │                      │                    │
    ├─ Fill Form & Submit    │                       │                      │                    │
    │                        │                       │                      │                    │
    │                        ├─ POST /api/patients ─▶│                      │                    │
    │                        │                       │                      │                    │
    │                        │                       ├─ Validate            │                    │
    │                        │                       │                      │                    │
    │                        │                       ├─ INSERT patient ────▶│                    │
    │                        │                       │                      │                    │
    │                        │◀─ 201 Created ────────│                      │                    │
    │                        │  { patient data }     │                      │                    │
    │                        │                       │                      │                    │
    ├──────────────────────▶ │ Navigate to           │                      │                    │
    │   Click "Start Session" │ /patients/{id}       │                      │                    │
    │                        │                       │                      │                    │
    │                        ├─ POST .../start ─────▶│                      │                    │
    │                        │                       │                      │                    │
    │                        │                       ├─ Create Session ────▶│                    │
    │                        │                       │  status: ACTIVE      │                    │
    │                        │                       │                      │                    │
    │                        │◀─ { session_id } ─────│                      │                    │
    │                        │                       │                      │                    │
    │                        ├─ Navigate to          │                      │                    │
    │                        │  .../sessions/{id}    │                      │                    │
    │                        │                       │                      │                    │
    │                        ├─ Voice AI connects ───┼──────────────────────┼───────────────────▶│
    │                        │                       │                      │                    │
    │                        │                       │◀─ Transcript chunks ─┼────────────────────│
    │                        │                       │   every 30s          │                    │
    │                        │                       │                      │                    │
    │                        │                       ├─ Extract entities    │                    │
    │                        │                       ├─ Build graph         │                    │
    │                        │                       ├─ INSERT nodes/edges ▶│                    │
    │                        │                       │                      │                    │
    │                        │◀─ WebSocket: Graph ───┼──────────────────────│                    │
    │                        │   updates (realtime)  │                      │                    │
    │                        │                       │                      │                    │
    └────────────────────────┴───────────────────────┴──────────────────────┴────────────────────┘
```

---

## Prerequisites & Context

### Existing System State

**✅ Already Implemented:**
- Complete authentication system (JWT-based)
- User/therapist accounts with role-based access
- Dashboard skeleton with navigation
- Design system "Clinical Precision with Warm Intelligence"
- Backend FastAPI app with Prisma ORM
- PostgreSQL database with Patient and Session models
- Supabase Realtime for graph updates
- Socket.IO for WebSocket communication

**📁 Relevant Files Already Exist:**
```
backend/
├── app/
│   ├── main.py                    # FastAPI app with CORS
│   ├── config.py                  # Environment settings
│   ├── database.py                # Prisma client instance
│   ├── api/
│   │   └── auth.py                # Auth endpoints (working)
│   └── models/
│       └── auth.py                # Pydantic auth models
└── prisma/
    └── schema.prisma              # Patient & Session models defined

frontend/
├── app/
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Landing page
│   ├── login/page.tsx             # Login page (working)
│   ├── register/page.tsx          # Register page (working)
│   └── dashboard/page.tsx         # Dashboard with "Patients" placeholder
├── components/ui/                 # shadcn components (Button, Card, Input, etc.)
├── contexts/AuthContext.tsx       # Auth state management
├── hooks/useAuth.ts               # Auth hook
└── lib/
    ├── api.ts                     # API client with interceptors
    └── types.ts                   # TypeScript interfaces
```

### Database Schema (Prisma)

**Patient Model:**
```prisma
model Patient {
  id            String    @id @default(uuid())
  name          String
  email         String?
  phone         String?
  demographics  Json?     // { age, gender, occupation, initial_concerns, ... }
  therapistId   String    @map("therapist_id")
  therapist     User      @relation(fields: [therapistId], references: [id], onDelete: Cascade)
  sessions      Session[]
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@index([therapistId])
  @@index([therapistId, createdAt])  // For sorted list views
  @@map("patients")
}

model Session {
  id           String        @id @default(uuid())
  patientId    String        @map("patient_id")
  patient      Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  therapistId  String?       @map("therapist_id")
  therapist    User?         @relation(fields: [therapistId], references: [id])
  startedAt    DateTime      @default(now()) @map("started_at")
  endedAt      DateTime?     @map("ended_at")
  transcript   String?       @db.Text
  summary      Json?
  status       SessionStatus @default(ACTIVE)
  graphNodes   GraphNode[]
  graphEdges   GraphEdge[]
  createdAt    DateTime      @default(now()) @map("created_at")

  @@index([patientId])
  @@index([patientId, status])  // For active session checks
  @@index([therapistId])
  @@map("sessions")
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### Design System Reference

**Colors (from globals.css):**
```css
--background: 10 14 20;           /* #0a0e14 - Deep navy-black */
--surface: 20 25 34;              /* #141922 - Elevated surface */
--surface-elevated: 26 31 46;     /* #1a1f2e - Cards, modals */
--accent-primary: 124 156 191;    /* #7c9cbf - Muted blue */
--accent-warm: 229 171 111;       /* #e5ab6f - Warm amber */
--text-primary: 230 232 235;      /* #e6e8eb - Main text */
--text-secondary: 156 163 175;    /* #9ca3af - Secondary text */
--border: 45 55 72;               /* #2d3748 - Subtle borders */
```

**Typography:**
- Display: Crimson Pro (serif) - Headings
- Sans: Inter - Body text
- Mono: JetBrains Mono - Data/code

**Spacing:** 8px baseline grid (p-4 = 16px, p-6 = 24px, p-8 = 32px)

---

## Phase 1: Backend API Foundation

### 1.1 Create Patients API Router

**File:** `backend/app/api/patients.py`

**Purpose:** RESTful endpoints for patient CRUD operations, scoped to authenticated therapist.

**Implementation:**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models.patients import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
    PatientDetailResponse,
    PatientStats
)
from app.models.auth import UserResponse
from app.api.auth import get_current_user
from app.database import db
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def verify_patient_access(patient_id: str, therapist_id: str):
    """Verify patient exists and belongs to therapist."""
    patient = await db.patient.find_first(
        where={"id": patient_id, "therapistId": therapist_id}
    )
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found or access denied"
        )
    return patient

async def get_patient_stats(patient_id: str) -> PatientStats:
    """Calculate patient statistics."""
    sessions = await db.session.find_many(
        where={"patientId": patient_id}
    )

    completed_sessions = [s for s in sessions if s.status == "COMPLETED"]

    return PatientStats(
        total_sessions=len(sessions),
        completed_sessions=len(completed_sessions),
        last_session_date=sessions[0].startedAt if sessions else None
    )

# ============================================================================
# CRUD ENDPOINTS
# ============================================================================

@router.get("/", response_model=PatientListResponse)
async def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(name|created_at|last_session)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of patients for authenticated therapist.

    Query params:
    - skip: Pagination offset
    - limit: Max results per page (1-100)
    - search: Search in name, email, phone
    - sort_by: name | created_at | last_session
    - sort_order: asc | desc
    """
    try:
        # Base where clause
        where_clause = {"therapistId": current_user.id}

        # Add search filter
        if search:
            where_clause["OR"] = [
                {"name": {"contains": search, "mode": "insensitive"}},
                {"email": {"contains": search, "mode": "insensitive"}},
                {"phone": {"contains": search, "mode": "insensitive"}}
            ]

        # Get total count
        total = await db.patient.count(where=where_clause)

        # Fetch patients with session count
        patients = await db.patient.find_many(
            where=where_clause,
            skip=skip,
            take=limit,
            order_by={sort_by: sort_order},
            include={
                "_count": {
                    "select": {"sessions": True}
                },
                "sessions": {
                    "where": {"status": "ACTIVE"},
                    "take": 1,
                    "select": {"id": True, "startedAt": True}
                }
            }
        )

        # Transform response
        patient_list = []
        for patient in patients:
            session_count = patient._count.sessions
            active_session = patient.sessions[0] if patient.sessions else None

            patient_list.append({
                **patient.__dict__,
                "session_count": session_count,
                "active_session_id": active_session.id if active_session else None,
                "has_active_session": active_session is not None
            })

        return PatientListResponse(
            patients=patient_list,
            total=total,
            skip=skip,
            limit=limit
        )

    except Exception as e:
        logger.error(f"Error fetching patients: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patients")


@router.post("/", response_model=PatientResponse, status_code=201)
async def create_patient(
    patient_data: PatientCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create new patient for authenticated therapist."""
    try:
        # Create patient
        patient = await db.patient.create(
            data={
                "name": patient_data.name,
                "email": patient_data.email,
                "phone": patient_data.phone,
                "demographics": patient_data.demographics or {},
                "therapistId": current_user.id
            }
        )

        logger.info(f"Patient created: {patient.id} by therapist {current_user.id}")

        return PatientResponse(**patient.__dict__)

    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to create patient")


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient_detail(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get patient details with session info."""
    try:
        # Verify access
        patient = await verify_patient_access(patient_id, current_user.id)

        # Get statistics
        stats = await get_patient_stats(patient_id)

        # Get recent sessions
        recent_sessions = await db.session.find_many(
            where={"patientId": patient_id},
            order_by={"startedAt": "desc"},
            take=5
        )

        # Get active session if exists
        active_session = await db.session.find_first(
            where={"patientId": patient_id, "status": "ACTIVE"}
        )

        return PatientDetailResponse(
            patient=PatientResponse(**patient.__dict__),
            stats=stats,
            recent_sessions=recent_sessions,
            active_session=active_session
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch patient details")


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update patient information."""
    try:
        # Verify access
        await verify_patient_access(patient_id, current_user.id)

        # Build update data (only include provided fields)
        update_data = patient_data.dict(exclude_unset=True)

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Update patient
        patient = await db.patient.update(
            where={"id": patient_id},
            data=update_data
        )

        logger.info(f"Patient updated: {patient_id} by therapist {current_user.id}")

        return PatientResponse(**patient.__dict__)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to update patient")


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete patient (hard delete with cascade)."""
    try:
        # Verify access
        await verify_patient_access(patient_id, current_user.id)

        # Check for active sessions
        active_session = await db.session.find_first(
            where={"patientId": patient_id, "status": "ACTIVE"}
        )

        if active_session:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete patient with active session. End session first."
            )

        # Delete patient (cascades to sessions and graph data)
        await db.patient.delete(where={"id": patient_id})

        logger.info(f"Patient deleted: {patient_id} by therapist {current_user.id}")

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting patient: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete patient")


# ============================================================================
# SESSION INTEGRATION
# ============================================================================

@router.post("/{patient_id}/sessions/start")
async def start_patient_session(
    patient_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Quick session start from patient view.
    Creates session and returns redirect URL.
    """
    try:
        # Verify access
        await verify_patient_access(patient_id, current_user.id)

        # Check for existing active session
        active_session = await db.session.find_first(
            where={"patientId": patient_id, "status": "ACTIVE"}
        )

        if active_session:
            return {
                "session_id": active_session.id,
                "patient_id": patient_id,
                "status": "already_active",
                "redirect_url": f"/patients/{patient_id}/sessions/{active_session.id}"
            }

        # Create new session
        session = await db.session.create(
            data={
                "patientId": patient_id,
                "therapistId": current_user.id,
                "status": "ACTIVE"
            }
        )

        logger.info(f"Session started: {session.id} for patient {patient_id}")

        return {
            "session_id": session.id,
            "patient_id": patient_id,
            "status": "created",
            "redirect_url": f"/patients/{patient_id}/sessions/{session.id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")


@router.get("/{patient_id}/sessions")
async def get_patient_sessions(
    patient_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get session history for patient."""
    try:
        # Verify access
        await verify_patient_access(patient_id, current_user.id)

        # Build where clause
        where_clause = {"patientId": patient_id}
        if status:
            where_clause["status"] = status.upper()

        # Fetch sessions
        sessions = await db.session.find_many(
            where=where_clause,
            skip=skip,
            take=limit,
            order_by={"startedAt": "desc"}
        )

        total = await db.session.count(where=where_clause)

        return {
            "sessions": sessions,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")
```

### 1.2 Create Pydantic Models

**File:** `backend/app/models/patients.py`

```python
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS
# ============================================================================

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non-binary"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

# ============================================================================
# DEMOGRAPHICS
# ============================================================================

class Demographics(BaseModel):
    """Structured demographics (optional)."""
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[Gender] = None
    occupation: Optional[str] = Field(None, max_length=100)
    initial_concerns: Optional[List[str]] = []
    referral_source: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)

    class Config:
        use_enum_values = True

# ============================================================================
# REQUEST MODELS
# ============================================================================

class PatientCreate(BaseModel):
    """Patient creation request."""
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, regex=r'^\+?1?\d{9,15}$')
    demographics: Optional[Dict[str, Any]] = None

    @validator('demographics')
    def validate_demographics(cls, v):
        if v and len(str(v)) > 10000:
            raise ValueError('Demographics data too large (max 10KB)')
        return v

    class Config:
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "demographics": {
                    "age": 32,
                    "gender": "male",
                    "occupation": "Software Engineer",
                    "initial_concerns": ["anxiety", "work stress"]
                }
            }
        }

class PatientUpdate(BaseModel):
    """Patient update request (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, regex=r'^\+?1?\d{9,15}$')
    demographics: Optional[Dict[str, Any]] = None

    @validator('demographics')
    def validate_demographics(cls, v):
        if v and len(str(v)) > 10000:
            raise ValueError('Demographics data too large (max 10KB)')
        return v

# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PatientResponse(BaseModel):
    """Patient data response."""
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    demographics: Optional[Dict[str, Any]]
    therapistId: str
    createdAt: datetime
    updatedAt: datetime

    # Additional computed fields (from joins)
    session_count: Optional[int] = None
    active_session_id: Optional[str] = None
    has_active_session: Optional[bool] = False

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "demographics": {
                    "age": 32,
                    "gender": "male"
                },
                "therapistId": "therapist-uuid",
                "createdAt": "2025-11-21T10:00:00Z",
                "updatedAt": "2025-11-21T10:00:00Z",
                "session_count": 5,
                "active_session_id": None,
                "has_active_session": False
            }
        }

class PatientStats(BaseModel):
    """Patient statistics."""
    total_sessions: int
    completed_sessions: int
    last_session_date: Optional[datetime]

class PatientDetailResponse(BaseModel):
    """Detailed patient view with sessions."""
    patient: PatientResponse
    stats: PatientStats
    recent_sessions: List[Any]  # SessionResponse imported from sessions model
    active_session: Optional[Any] = None

class PatientListResponse(BaseModel):
    """Paginated patient list response."""
    patients: List[PatientResponse]
    total: int
    skip: int
    limit: int

    class Config:
        schema_extra = {
            "example": {
                "patients": [
                    {
                        "id": "uuid-1",
                        "name": "John Doe",
                        "session_count": 5,
                        "has_active_session": False
                    }
                ],
                "total": 15,
                "skip": 0,
                "limit": 50
            }
        }
```

### 1.3 Register Router in Main App

**File:** `backend/app/main.py` (UPDATE)

```python
# Add to imports
from app.api import patients

# Add to router registration (after auth router)
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
```

### 1.4 Database Migrations

**Run Prisma commands:**

```bash
cd backend
source venv/bin/activate

# Generate Prisma client
python -m prisma generate

# Sync database schema (adds indexes if not present)
python -m prisma db push
```

### 1.5 Testing Backend API

**Use Swagger UI:** http://localhost:8000/docs

**Test sequence:**
1. Register/login to get JWT token
2. Click "Authorize" button, add token
3. Test endpoints:
   - `GET /api/patients` (should return empty list)
   - `POST /api/patients` (create test patient)
   - `GET /api/patients` (should return 1 patient)
   - `GET /api/patients/{id}` (get patient detail)
   - `POST /api/patients/{id}/sessions/start` (create session)
   - `GET /api/patients/{id}/sessions` (list sessions)
   - `DELETE /api/patients/{id}` (should fail if active session)

---

## Phase 2: Frontend Patient List

### 2.1 Create TypeScript Types

**File:** `frontend/lib/types.ts` (ADD to existing file)

```typescript
// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
  therapistId: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields from API
  session_count?: number;
  active_session_id?: string;
  has_active_session?: boolean;
}

export interface PatientDemographics {
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'prefer_not_to_say';
  occupation?: string;
  initial_concerns?: string[];
  referral_source?: string;
  notes?: string;
  [key: string]: any; // Allow custom fields
}

export interface PatientCreate {
  name: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
}

export interface PatientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  skip: number;
  limit: number;
}

export interface PatientStats {
  total_sessions: number;
  completed_sessions: number;
  last_session_date?: string;
}

export interface PatientDetail {
  patient: Patient;
  stats: PatientStats;
  recent_sessions: Session[];
  active_session?: Session;
}
```

### 2.2 Create Patients API Client

**File:** `frontend/lib/api.ts` (ADD to existing file)

```typescript
// ============================================================================
// PATIENTS API
// ============================================================================

export const patientsAPI = {
  /**
   * Get list of patients for authenticated therapist
   */
  async list(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    sort_by?: 'name' | 'created_at' | 'last_session';
    sort_order?: 'asc' | 'desc';
  }): Promise<PatientListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    const response = await apiClient.get<PatientListResponse>(
      `/api/patients?${searchParams}`
    );
    return response.data;
  },

  /**
   * Create new patient
   */
  async create(data: PatientCreate): Promise<Patient> {
    const response = await apiClient.post<Patient>('/api/patients', data);
    return response.data;
  },

  /**
   * Get patient detail
   */
  async get(patientId: string): Promise<PatientDetail> {
    const response = await apiClient.get<PatientDetail>(`/api/patients/${patientId}`);
    return response.data;
  },

  /**
   * Update patient
   */
  async update(patientId: string, data: PatientUpdate): Promise<Patient> {
    const response = await apiClient.patch<Patient>(`/api/patients/${patientId}`, data);
    return response.data;
  },

  /**
   * Delete patient
   */
  async delete(patientId: string): Promise<void> {
    await apiClient.delete(`/api/patients/${patientId}`);
  },

  /**
   * Start session for patient
   */
  async startSession(patientId: string): Promise<{
    session_id: string;
    patient_id: string;
    status: string;
    redirect_url: string;
  }> {
    const response = await apiClient.post(`/api/patients/${patientId}/sessions/start`);
    return response.data;
  },

  /**
   * Get patient sessions
   */
  async getSessions(patientId: string, params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient.get(`/api/patients/${patientId}/sessions?${searchParams}`);
    return response.data;
  }
};
```

### 2.3 Create Patients Context (State Management)

**File:** `frontend/contexts/PatientsContext.tsx` (NEW)

```typescript
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Patient, PatientCreate, PatientUpdate, PatientListResponse } from '@/lib/types';
import { patientsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface PatientsContextType {
  patients: Patient[];
  total: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPatients: (params?: { skip?: number; limit?: number; search?: string }) => Promise<void>;
  createPatient: (data: PatientCreate) => Promise<Patient>;
  updatePatient: (patientId: string, data: PatientUpdate) => Promise<Patient>;
  deletePatient: (patientId: string) => Promise<void>;
  startSession: (patientId: string) => Promise<string>; // Returns redirect URL

  // Utilities
  clearError: () => void;
  refreshPatients: () => Promise<void>;
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

export function PatientsProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await patientsAPI.list(params);
      setPatients(response.patients);
      setTotal(response.total);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch patients';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (data: PatientCreate): Promise<Patient> => {
    try {
      setIsLoading(true);
      setError(null);

      const newPatient = await patientsAPI.create(data);

      // Optimistic update
      setPatients(prev => [newPatient, ...prev]);
      setTotal(prev => prev + 1);

      toast.success('Patient added successfully');
      return newPatient;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to create patient';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePatient = useCallback(async (
    patientId: string,
    data: PatientUpdate
  ): Promise<Patient> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedPatient = await patientsAPI.update(patientId, data);

      // Update in list
      setPatients(prev =>
        prev.map(p => (p.id === patientId ? updatedPatient : p))
      );

      toast.success('Patient updated successfully');
      return updatedPatient;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to update patient';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePatient = useCallback(async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await patientsAPI.delete(patientId);

      // Remove from list
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setTotal(prev => prev - 1);

      toast.success('Patient deleted successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete patient';
      setError(errorMsg);

      if (err.response?.status === 409) {
        toast.error('Cannot delete patient with active session');
      } else {
        toast.error(errorMsg);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startSession = useCallback(async (patientId: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await patientsAPI.startSession(patientId);

      if (response.status === 'already_active') {
        toast.info('Session already active for this patient');
      } else {
        toast.success('Session started successfully');
      }

      // Refresh patients to update active session status
      await fetchPatients();

      return response.redirect_url;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to start session';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPatients]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshPatients = useCallback(async () => {
    await fetchPatients();
  }, [fetchPatients]);

  const value = {
    patients,
    total,
    isLoading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    startSession,
    clearError,
    refreshPatients
  };

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientsContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
}
```

### 2.4 Wrap App with PatientsProvider

**File:** `frontend/app/layout.tsx` (UPDATE)

```typescript
import { PatientsProvider } from '@/contexts/PatientsContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PatientsProvider>
            {children}
          </PatientsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2.5 Create Patient Card Component

**File:** `frontend/components/PatientCard.tsx` (NEW)

```typescript
'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Patient } from '@/lib/types';
import { Play, User, Calendar, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PatientCardProps {
  patient: Patient;
  index: number;
  onStartSession?: (patientId: string) => void;
}

export function PatientCard({ patient, index, onStartSession }: PatientCardProps) {
  const router = useRouter();

  // Get initials from name
  const initials = patient.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get age and gender from demographics
  const age = patient.demographics?.age;
  const gender = patient.demographics?.gender;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Card
        className="p-6 bg-surface-elevated border-border hover:border-accent-primary/50 transition-all cursor-pointer group"
        onClick={() => router.push(`/patients/${patient.id}`)}
      >
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-accent-primary/20 text-accent-primary">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary">
                {patient.name}
              </h3>
              {age && gender && (
                <p className="text-sm text-text-secondary">
                  {age} years • {gender}
                </p>
              )}
            </div>
          </div>

          {/* Active Session Badge */}
          {patient.has_active_session && (
            <Badge
              variant="destructive"
              className="animate-pulse"
            >
              Live
            </Badge>
          )}
        </div>

        {/* Demographics Info */}
        {patient.demographics?.occupation && (
          <div className="mb-4">
            <p className="text-sm text-text-secondary">
              {patient.demographics.occupation}
            </p>
          </div>
        )}

        {/* Session Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {patient.session_count || 0} session{patient.session_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onStartSession?.(patient.id);
            }}
            disabled={patient.has_active_session}
          >
            <Play className="h-4 w-4 mr-2" />
            {patient.has_active_session ? 'Session Active' : 'Start Session'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/patients/${patient.id}`);
            }}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
```

### 2.6 Create Patients List Page

**File:** `frontend/app/patients/page.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/contexts/PatientsContext';
import { PatientCard } from '@/components/PatientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PatientsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    patients,
    total,
    isLoading,
    fetchPatients,
    startSession
  } = usePatients();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch patients on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPatients();
    }
  }, [isAuthenticated, fetchPatients]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search patients
  useEffect(() => {
    if (debouncedSearch) {
      fetchPatients({ search: debouncedSearch });
    } else if (debouncedSearch === '') {
      fetchPatients();
    }
  }, [debouncedSearch, fetchPatients]);

  // Handle start session
  const handleStartSession = async (patientId: string) => {
    try {
      const redirectUrl = await startSession(patientId);
      router.push(redirectUrl);
    } catch (error) {
      // Error already handled in context
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
              Patients
            </h1>
            <p className="text-text-secondary">
              Manage your patients and therapy sessions
            </p>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={() => router.push('/patients/new')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 text-text-secondary">
            <Users className="h-5 w-5" />
            <span className="font-mono">
              {total} patient{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Patient Grid */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-9 w-full" />
              </Card>
            ))}
          </div>
        ) : patients.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-primary/10 mb-6">
              <Users className="h-10 w-10 text-accent-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">
              No patients yet
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Start building your practice by adding your first patient.
              You'll be able to track sessions and visualize therapy progress.
            </p>
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push('/patients/new')}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Patient
            </Button>
          </motion.div>
        ) : (
          // Patient cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                index={index}
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2.7 Add Navigation to Patients Tab

**File:** `frontend/app/dashboard/page.tsx` (UPDATE)

Add a "Patients" card/button in the Quick Actions section:

```typescript
<Card className="p-6 hover:border-accent-primary/50 transition-all cursor-pointer"
  onClick={() => router.push('/patients')}>
  <Users className="h-8 w-8 text-accent-primary mb-3" />
  <h3 className="font-display text-lg font-semibold mb-2">Patients</h3>
  <p className="text-sm text-text-secondary">
    View and manage your patients
  </p>
</Card>
```

---

## Phase 3: Patient Creation Flow

### 3.1 Install Additional UI Components

```bash
cd frontend
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add label
```

### 3.2 Create Add Patient Sheet Component

**File:** `frontend/components/AddPatientSheet.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PatientCreate } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?1?\d{9,15}$/, 'Invalid phone number').optional().or(z.literal('')),
  age: z.number().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'other', 'prefer_not_to_say']).optional(),
  occupation: z.string().max(100).optional(),
  initial_concerns: z.string().max(500).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface AddPatientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (patient: any) => void;
}

export function AddPatientSheet({ open, onOpenChange, onSuccess }: AddPatientSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  });

  const gender = watch('gender');

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);

      // Build patient create payload
      const patientData: PatientCreate = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        demographics: {
          age: data.age,
          gender: data.gender,
          occupation: data.occupation,
          initial_concerns: data.initial_concerns
            ? data.initial_concerns.split(',').map(c => c.trim())
            : []
        }
      };

      // Call parent handler
      await onSuccess(patientData);

      // Reset form and close
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Add New Patient</SheetTitle>
          <SheetDescription>
            Enter patient information to create their profile and start tracking sessions.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              {...register('phone')}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Age and Gender Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="32"
                {...register('age', { valueAsNumber: true })}
                disabled={isSubmitting}
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={gender}
                onValueChange={(value) => setValue('gender', value as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Occupation */}
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              placeholder="Software Engineer"
              {...register('occupation')}
              disabled={isSubmitting}
            />
          </div>

          {/* Initial Concerns */}
          <div className="space-y-2">
            <Label htmlFor="initial_concerns">Initial Concerns</Label>
            <Textarea
              id="initial_concerns"
              placeholder="E.g., anxiety, work stress, relationship issues (comma-separated)"
              rows={3}
              {...register('initial_concerns')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-text-tertiary">
              Enter concerns separated by commas
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add Patient'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

### 3.3 Integrate Sheet into Patients Page

**File:** `frontend/app/patients/page.tsx` (UPDATE)

```typescript
import { AddPatientSheet } from '@/components/AddPatientSheet';

export default function PatientsPage() {
  // ... existing code ...

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const handleAddPatient = async (patientData: PatientCreate) => {
    const newPatient = await createPatient(patientData);
    // Optionally navigate to patient detail
    router.push(`/patients/${newPatient.id}`);
  };

  return (
    <>
      {/* ... existing JSX ... */}

      {/* Update button */}
      <Button
        variant="default"
        size="lg"
        onClick={() => setIsAddSheetOpen(true)}  // Changed
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Patient
      </Button>

      {/* Add sheet */}
      <AddPatientSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onSuccess={handleAddPatient}
      />
    </>
  );
}
```

---

## Phase 4: Patient Detail & Sessions Integration

### 4.1 Create Patient Detail Page

**File:** `frontend/app/patients/[id]/page.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { patientsAPI } from '@/lib/api';
import { PatientDetail } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Mail, Phone, User, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchPatientDetail();
  }, [patientId, isAuthenticated]);

  const fetchPatientDetail = async () => {
    try {
      setIsLoading(true);
      const data = await patientsAPI.get(patientId);
      setPatientDetail(data);
    } catch (error: any) {
      toast.error('Failed to load patient details');
      router.push('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setIsStartingSession(true);
      const response = await patientsAPI.startSession(patientId);
      toast.success('Session started');
      router.push(response.redirect_url);
    } catch (error: any) {
      toast.error('Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  if (isLoading || !patientDetail) {
    return <div>Loading...</div>; // TODO: Add skeleton
  }

  const { patient, stats, recent_sessions, active_session } = patientDetail;

  const initials = patient.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/patients')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>

        {/* Patient Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 bg-accent-primary/20 text-accent-primary">
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>

                <div>
                  <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                    {patient.name}
                  </h1>

                  <div className="flex items-center gap-4 text-text-secondary">
                    {patient.demographics?.age && (
                      <span>{patient.demographics.age} years</span>
                    )}
                    {patient.demographics?.gender && (
                      <span className="capitalize">{patient.demographics.gender}</span>
                    )}
                    {patient.demographics?.occupation && (
                      <span>{patient.demographics.occupation}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    {patient.email && (
                      <a
                        href={`mailto:${patient.email}`}
                        className="flex items-center gap-1 text-sm text-text-tertiary hover:text-accent-primary"
                      >
                        <Mail className="h-4 w-4" />
                        {patient.email}
                      </a>
                    )}
                    {patient.phone && (
                      <a
                        href={`tel:${patient.phone}`}
                        className="flex items-center gap-1 text-sm text-text-tertiary hover:text-accent-primary"
                      >
                        <Phone className="h-4 w-4" />
                        {patient.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {active_session && (
                  <Badge variant="destructive" className="animate-pulse">
                    Session Active
                  </Badge>
                )}

                <Button
                  variant="default"
                  size="lg"
                  onClick={handleStartSession}
                  disabled={isStartingSession || !!active_session}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {active_session ? 'Session Active' : 'Start Session'}
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary font-mono">
                  {stats.total_sessions}
                </div>
                <div className="text-sm text-text-secondary">Total Sessions</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary font-mono">
                  {stats.completed_sessions}
                </div>
                <div className="text-sm text-text-secondary">Completed</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary font-mono">
                  {stats.last_session_date
                    ? format(new Date(stats.last_session_date), 'MMM d')
                    : 'Never'}
                </div>
                <div className="text-sm text-text-secondary">Last Session</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                Patient Information
              </h2>

              <dl className="space-y-4">
                {patient.demographics?.initial_concerns && (
                  <div>
                    <dt className="text-sm font-medium text-text-secondary">Initial Concerns</dt>
                    <dd className="mt-1 text-text-primary">
                      {patient.demographics.initial_concerns.join(', ')}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-text-secondary">Created</dt>
                  <dd className="mt-1 text-text-primary">
                    {format(new Date(patient.createdAt), 'MMMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">
                  Session History
                </h2>

                <Button
                  variant="default"
                  onClick={handleStartSession}
                  disabled={isStartingSession || !!active_session}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start New Session
                </Button>
              </div>

              {recent_sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    No sessions yet. Start your first session to begin tracking.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent_sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-accent-primary/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/patients/${patientId}/sessions/${session.id}`)}
                    >
                      <div>
                        <div className="font-medium text-text-primary">
                          {format(new Date(session.startedAt), 'MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {format(new Date(session.startedAt), 'h:mm a')}
                          {session.endedAt && ` - ${format(new Date(session.endedAt), 'h:mm a')}`}
                        </div>
                      </div>

                      <Badge
                        variant={
                          session.status === 'ACTIVE' ? 'destructive' :
                          session.status === 'COMPLETED' ? 'default' : 'secondary'
                        }
                      >
                        {session.status.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### 4.2 Install Additional UI Components

```bash
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

### 4.3 Create Session View Placeholder

**File:** `frontend/app/patients/[patientId]/sessions/[sessionId]/page.tsx` (NEW)

```typescript
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic } from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { patientId, sessionId } = params;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(`/patients/${patientId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient
        </Button>

        <Card className="p-8 text-center">
          <Mic className="h-16 w-16 text-accent-primary mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-3">
            Live Session
          </h1>
          <p className="text-text-secondary mb-6">
            Session ID: {sessionId}
          </p>

          <div className="bg-accent-warm/10 border border-accent-warm/30 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-text-secondary">
              <strong>Voice AI Integration Point</strong>
              <br />
              <br />
              Your teammate's voice AI component will be integrated here.
              <br />
              When the voice AI sends transcript chunks to the backend,
              the semantic graph will appear and update in real-time below.
            </p>
          </div>

          <div className="mt-8 text-text-tertiary text-sm">
            <p>Coming soon:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Real-time graph visualization</li>
              <li>Live transcript display</li>
              <li>Session controls (pause, end)</li>
              <li>Voice AI integration</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

---

## Phase 5: Real-time Updates & Polish

### 5.1 Add Supabase Realtime for Session Status

**File:** `frontend/hooks/useSessionStatus.ts` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useSessionStatus(patientId: string) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Subscribe to session changes for this patient
    const subscription = supabase
      .channel(`patient_${patientId}_sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          if (payload.new && payload.new.status === 'ACTIVE') {
            setActiveSessionId(payload.new.id);
            setIsActive(true);
          } else if (payload.new && payload.new.status !== 'ACTIVE') {
            setActiveSessionId(null);
            setIsActive(false);
          }
        }
      )
      .subscribe();

    // Fetch initial status
    const fetchInitialStatus = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('patient_id', patientId)
        .eq('status', 'ACTIVE')
        .single();

      if (data) {
        setActiveSessionId(data.id);
        setIsActive(true);
      }
    };

    fetchInitialStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [patientId]);

  return { activeSessionId, isActive };
}
```

### 5.2 Integrate Real-time into Patient Card

**File:** `frontend/components/PatientCard.tsx` (UPDATE)

```typescript
import { useSessionStatus } from '@/hooks/useSessionStatus';

export function PatientCard({ patient, index, onStartSession }: PatientCardProps) {
  // ... existing code ...

  // Add real-time status
  const { isActive: liveIsActive } = useSessionStatus(patient.id);
  const hasActiveSession = patient.has_active_session || liveIsActive;

  return (
    // ... use hasActiveSession instead of patient.has_active_session
  );
}
```

### 5.3 Add Loading States and Error Boundaries

**File:** `frontend/components/LoadingState.tsx` (NEW)

```typescript
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-accent-primary mb-4" />
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
```

**File:** `frontend/components/ErrorState.tsx` (NEW)

```typescript
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

export function ErrorState({
  message = 'Something went wrong',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-text-secondary mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
```

### 5.4 Add Confirmation Dialog for Delete

**File:** `frontend/components/DeleteConfirmDialog.tsx` (NEW)

```typescript
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  patientName: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Patient</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{patientName}</strong>?
            This will permanently delete the patient and all their session data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 5.5 Add Toast Notifications

**Install Sonner:**

```bash
npm install sonner
```

**File:** `frontend/app/layout.tsx` (UPDATE)

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PatientsProvider>
            {children}
            <Toaster position="top-right" />
          </PatientsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Testing Strategy

### Backend Testing

**File:** `backend/tests/test_patients.py` (NEW)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_patient_unauthorized():
    """Test that patient creation requires authentication."""
    response = client.post("/api/patients", json={
        "name": "Test Patient"
    })
    assert response.status_code == 401

def test_create_patient_success(auth_token):
    """Test successful patient creation."""
    response = client.post(
        "/api/patients",
        json={
            "name": "Test Patient",
            "email": "test@example.com",
            "demographics": {"age": 30, "gender": "male"}
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Patient"
    assert "id" in data

def test_list_patients_scoped_to_therapist(auth_token, other_therapist_token):
    """Test that patients are scoped to therapist."""
    # Create patient with first therapist
    response1 = client.post(
        "/api/patients",
        json={"name": "Therapist 1 Patient"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response1.status_code == 201

    # List patients with second therapist
    response2 = client.get(
        "/api/patients",
        headers={"Authorization": f"Bearer {other_therapist_token}"}
    )
    assert response2.status_code == 200
    # Should not see first therapist's patient
    assert len(response2.json()["patients"]) == 0

def test_start_session_creates_active_session(auth_token, patient_id):
    """Test starting a session."""
    response = client.post(
        f"/api/patients/{patient_id}/sessions/start",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "created"
    assert "session_id" in data

def test_cannot_delete_patient_with_active_session(auth_token, patient_id):
    """Test deletion prevention with active session."""
    # Start session
    client.post(
        f"/api/patients/{patient_id}/sessions/start",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    # Try to delete
    response = client.delete(
        f"/api/patients/{patient_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 409
```

### Frontend Testing

**Manual Test Checklist:**

1. **Patient List**
   - [ ] Empty state shows when no patients
   - [ ] Patient cards display with correct information
   - [ ] Search filters patients in real-time
   - [ ] Loading skeletons appear during fetch
   - [ ] Active session badge shows red pulse

2. **Add Patient**
   - [ ] Sheet slides in smoothly
   - [ ] Form validation works (name required, email format, phone format)
   - [ ] Success toast appears after creation
   - [ ] New patient card appears in list
   - [ ] Can navigate to new patient immediately

3. **Patient Detail**
   - [ ] Patient information displays correctly
   - [ ] Stats show accurate counts
   - [ ] Tabs switch correctly
   - [ ] Sessions tab shows history
   - [ ] "Start Session" button works

4. **Session Start**
   - [ ] Creates session in database
   - [ ] Redirects to session page
   - [ ] Cannot start if session already active
   - [ ] Active badge appears on patient card

5. **Real-time Updates**
   - [ ] Session status updates across tabs
   - [ ] Multiple therapists see their own patients only

---

## Deployment Checklist

### Backend Deployment

**Environment Variables:**
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
SECRET_KEY=...
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
```

**Commands:**
```bash
# Install dependencies
pip install -r requirements.txt

# Generate Prisma client
python -m prisma generate

# Sync database
python -m prisma db push

# Run server
python -m uvicorn app.main:socket_app --host 0.0.0.0 --port 8000
```

### Frontend Deployment (Vercel)

**Environment Variables:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

**Build Settings:**
```bash
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

---

## Future Enhancements

### High Priority (Post-Hackathon)

1. **Edit Patient Information**
   - Add edit button to patient detail
   - Reuse AddPatientSheet with edit mode
   - Pre-populate form with existing data

2. **Advanced Search & Filters**
   - Filter by active/inactive status
   - Sort by last session date
   - Filter by demographic criteria
   - Date range for last session

3. **Pagination**
   - Implement cursor or offset pagination
   - Add "Load More" button
   - Show page indicators

4. **Patient Photos/Avatars**
   - Upload patient photos
   - Store in cloud storage (S3, Cloudinary)
   - Display in card and detail view

### Medium Priority

5. **Soft Delete**
   - Add `deletedAt` field to Patient model
   - Archive instead of hard delete
   - Add "Archived Patients" view
   - Restore functionality

6. **Bulk Actions**
   - Select multiple patients
   - Bulk delete, export, or tag
   - Bulk status updates

7. **Export Functionality**
   - Export patient list to CSV
   - Export individual patient data
   - Generate patient reports (PDF)

8. **Advanced Demographics**
   - Custom fields per therapist
   - Insurance information
   - Emergency contacts
   - Medical history

### Low Priority

9. **Patient Portal**
   - Separate login for patients
   - View own session history
   - View therapist notes (if permitted)
   - Schedule appointments

10. **Analytics Dashboard**
    - Average sessions per patient
    - Most common concerns
    - Session completion rates
    - Growth metrics

---

## Conclusion

This implementation guide provides a complete roadmap for building the Patients tab in Dimini. The phased approach ensures:

1. **Phase 1**: Backend foundation is solid and tested
2. **Phase 2**: Frontend displays patients correctly
3. **Phase 3**: Patient creation is smooth and validated
4. **Phase 4**: Integration with sessions is seamless
5. **Phase 5**: Real-time updates and polish for demo

**Estimated Implementation Time:**
- Phase 1: 3-4 hours
- Phase 2: 2-3 hours
- Phase 3: 2 hours
- Phase 4: 2-3 hours
- Phase 5: 1-2 hours
- **Total: 10-14 hours**

**Key Success Metrics:**
- ✅ Therapist can add patients in < 30 seconds
- ✅ Patient list loads in < 500ms
- ✅ Session creation works in < 2 seconds
- ✅ Real-time updates appear within 100ms
- ✅ Demo flow (add patient → start session) is smooth

**Ready for Implementation!** 🚀
