# Dimini - Developer Guide

**Version:** 1.0
**Last Updated:** 2025-11-21
**Target:** Developers & AI Assistants building the Dimini platform

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture Decisions](#tech-stack--architecture-decisions)
3. [Project Structure](#project-structure)
4. [Database Schema & Models](#database-schema--models)
5. [Backend Implementation Guide](#backend-implementation-guide)
6. [Frontend Implementation Guide](#frontend-implementation-guide)
7. [Core Algorithms](#core-algorithms)
8. [API Specifications](#api-specifications)
9. [Real-time System](#real-time-system)
10. [Integration Points](#integration-points)
11. [Development Workflow](#development-workflow)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Guide](#deployment-guide)
14. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Project Overview

### What is Dimini?

Dimini is a **real-time AI therapy assistant** that creates semantic relationship visualizations during therapy sessions. As therapists conduct sessions with patients, Dimini listens to the conversation (via a voice AI agent) and automatically generates a **dynamic, growing graph** showing topics, emotions, and their relationships.

### Core Features

1. **Semantic Therapy Map** - Real-time visualization of topics/emotions and their relationships
2. **Patient Management** - Organize patients, sessions, and historical data
3. **AI Analysis** - Post-session summaries and insights
4. **Voice Integration** - APIs for external voice agent to send transcripts

### User Flow

```
Therapist → Starts Session → Voice Agent Records Conversation
                           ↓
                    Sends transcript chunks every 30s
                           ↓
Backend → Extracts entities (GPT-4) → Generates embeddings → Calculates similarity
                           ↓
                    Saves to Supabase (triggers real-time)
                           ↓
Frontend → Receives updates → Graph animates new nodes/edges
                           ↓
Therapist → Watches semantic map grow in real-time
```

---

## Tech Stack & Architecture Decisions

### Frontend: Next.js 14 + shadcn/ui

**Why Next.js 14 (App Router)?**
- Built-in routing for `/patients/[id]/sessions/[sessionId]`
- API route proxying if needed (though FastAPI handles main backend)
- Server components for initial data loading
- Excellent TypeScript support
- Vercel deployment ready

**Why shadcn/ui over Chakra UI?**
- Modern 2024 aesthetic (Linear/Vercel style)
- Tailwind-based (flexible customization)
- Copy-paste components (no bundle bloat)
- Better for hackathon demos (impressive visuals)

**Why React Force Graph 2D?**
- Physics-based animations (nodes self-organize)
- Battle-tested library (10k+ GitHub stars)
- Canvas-based rendering (performant for 50-100 nodes)
- Easy to customize node/edge appearance

### Backend: FastAPI + Python

**Why FastAPI?**
- Async by default (handles concurrent requests well)
- Automatic API documentation (Swagger UI)
- Excellent for AI/ML integration (OpenAI SDK, NumPy)
- Type hints with Pydantic (catches errors early)

**Why Python over Node.js?**
- Superior AI/ML libraries (OpenAI, NumPy for embeddings)
- NetworkX available if graph algorithms needed
- Simpler semantic similarity calculations
- LangChain integration if needed later

### Database: Supabase (PostgreSQL + Real-time)

**Why Supabase over self-hosted PostgreSQL?**
- **Zero setup time** - No Docker configuration needed
- **Built-in real-time** - WebSocket subscriptions handled automatically
- **Instant APIs** - Auto-generated REST API (can bypass if using direct client)
- **Free tier** - 500MB database, 50k rows, 2GB bandwidth (plenty for hackathon/MVP)
- **Auth included** - If user authentication needed later

**Why PostgreSQL over MongoDB?**
- Graph data (nodes/edges) fits relational model well
- JSONB columns provide flexibility when needed
- pgvector extension available if advanced vector search needed
- Strong consistency guarantees

### AI Services: OpenAI

**GPT-4 for Entity Extraction**
- Function calling = structured output (guaranteed JSON schema)
- Excellent at understanding therapy concepts
- Fast enough for real-time processing (~1-2s per extraction)

**text-embedding-3-small for Semantic Similarity**
- 1536-dimensional vectors
- Fast generation (~100ms per embedding)
- Cheap ($0.02 per 1M tokens)
- Cosine similarity is simple NumPy operation

---

## Project Structure

```
Dimini/
├── frontend/                          # Next.js 14 App Router application
│   ├── app/
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Dashboard/landing page
│   │   ├── patients/
│   │   │   ├── page.tsx              # Patient list view
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create new patient form
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Patient profile (demographics, history)
│   │   │       └── sessions/
│   │   │           ├── page.tsx      # Session history for this patient
│   │   │           ├── new/
│   │   │           │   └── page.tsx  # Start new session
│   │   │           └── [sessionId]/
│   │   │               └── page.tsx  # LIVE SESSION VIEW (main graph page)
│   │   └── api/                       # Optional: Next.js API routes (if needed for proxying)
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn components (button, card, sheet, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── ...
│   │   ├── SemanticGraph.tsx          # CORE: Force graph visualization component
│   │   ├── GraphControls.tsx          # Zoom, reset, layout controls
│   │   ├── PatientList.tsx            # Patient listing with search/filter
│   │   ├── PatientCard.tsx            # Single patient card component
│   │   ├── SessionHistory.tsx         # Timeline of past sessions
│   │   ├── SessionControls.tsx        # Start/stop session, status indicators
│   │   ├── SessionSummary.tsx         # Display AI-generated session summaries
│   │   └── Navbar.tsx                 # Top navigation bar
│   │
│   ├── hooks/
│   │   ├── useRealtimeGraph.ts        # CRITICAL: Supabase real-time subscription for graph updates
│   │   ├── usePatients.ts             # Patient data fetching/mutations
│   │   └── useSessions.ts             # Session data fetching/mutations
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client initialization
│   │   ├── api.ts                     # Backend API client (Axios/Fetch wrapper)
│   │   ├── utils.ts                   # Utility functions (cn, formatDate, etc.)
│   │   └── types.ts                   # TypeScript types/interfaces
│   │
│   ├── public/                        # Static assets
│   │   └── logo.svg
│   │
│   ├── .env.local                     # Environment variables (gitignored)
│   ├── next.config.js                 # Next.js configuration
│   ├── tailwind.config.ts             # Tailwind + shadcn theme config
│   ├── tsconfig.json                  # TypeScript configuration
│   └── package.json
│
├── backend/                           # FastAPI Python application
│   ├── app/
│   │   ├── main.py                    # FastAPI app initialization, CORS, routes
│   │   ├── config.py                  # Environment variables, settings
│   │   ├── models.py                  # Pydantic models (request/response schemas)
│   │   │
│   │   ├── api/                       # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── patients.py            # Patient CRUD endpoints
│   │   │   ├── sessions.py            # Session management endpoints
│   │   │   └── health.py              # Health check endpoint
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── entity_extractor.py    # CRITICAL: GPT-4 entity extraction
│   │   │   ├── semantic_linker.py     # CRITICAL: Embeddings + similarity calculation
│   │   │   ├── session_analyzer.py    # Post-session summary generation
│   │   │   └── graph_builder.py       # Orchestrates graph construction
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── supabase_client.py     # Supabase client + helper functions
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── logger.py              # Logging configuration
│   │
│   ├── tests/                         # Unit and integration tests
│   │   ├── __init__.py
│   │   ├── test_entity_extractor.py
│   │   └── test_semantic_linker.py
│   │
│   ├── .env                           # Environment variables (gitignored)
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Docker configuration (optional)
│   └── README.md                      # Backend-specific docs
│
├── .env.example                       # Template for environment variables
├── README.md                          # Main project documentation (for users/contributors)
├── DEVELOPER_GUIDE.md                 # This file (for developers building the project)
├── .gitignore                         # Git ignore patterns
└── docker-compose.yml                 # Optional: local development setup
```

### File Purposes Explained

#### Frontend Key Files

**`app/patients/[id]/sessions/[sessionId]/page.tsx`** - THE MAIN PAGE
- This is where therapists spend 90% of their time during sessions
- Contains the `<SemanticGraph>` component (full-screen)
- Shows live updates as conversation progresses
- Includes session controls (status, timer, stop button)

**`components/SemanticGraph.tsx`** - THE CORE VISUALIZATION
- Wraps `react-force-graph-2d` library
- Uses `useRealtimeGraph()` hook for live data
- Handles node styling (emotions vs topics = different colors)
- Physics configuration for automatic layout
- Zoom/pan controls

**`hooks/useRealtimeGraph.ts`** - THE REAL-TIME ENGINE
- Subscribes to Supabase `graph_nodes` and `graph_edges` tables
- Listens for INSERT events
- Updates React state when new nodes/edges appear
- Handles initial data loading
- Manages subscription lifecycle (cleanup on unmount)

#### Backend Key Files

**`services/entity_extractor.py`** - THE AI BRAIN
- Receives transcript chunks (30-second segments)
- Calls GPT-4 with function calling
- Extracts: `{entities: [{id, type, label}], relationships: [{source, target}]}`
- Returns structured JSON

**`services/semantic_linker.py`** - THE INTELLIGENCE LAYER
- Takes newly extracted entities
- Generates OpenAI embeddings for each entity
- Compares with existing entities using cosine similarity
- Creates edges if similarity > 0.75
- Returns list of new edges to create

**`services/graph_builder.py`** - THE ORCHESTRATOR
- Coordinates entity_extractor + semantic_linker
- Inserts nodes into Supabase (with embeddings stored)
- Inserts edges into Supabase
- Handles deduplication (same entity mentioned multiple times)

---

## Database Schema & Models

### Supabase Tables

#### 1. `patients` Table

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  demographics JSONB DEFAULT '{}',  -- age, gender, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_name ON patients(name);
```

**Purpose:** Store patient profiles and demographics.

**JSONB `demographics` structure:**
```json
{
  "age": 32,
  "gender": "female",
  "occupation": "software engineer",
  "referral_source": "primary care physician",
  "initial_concerns": ["anxiety", "work stress"]
}
```

#### 2. `sessions` Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id TEXT,  -- External ID from auth system or placeholder
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  transcript TEXT DEFAULT '',  -- Full session transcript (accumulated)
  summary JSONB,  -- AI-generated post-session summary
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_patient ON sessions(patient_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);
```

**Purpose:** Track therapy sessions.

**JSONB `summary` structure:**
```json
{
  "key_topics": ["work stress", "family relationships", "anxiety"],
  "emotional_themes": ["frustration", "hope", "overwhelm"],
  "insights": "Patient shows correlation between work deadlines and anxiety symptoms...",
  "recommendations": ["Explore coping strategies for work stress", "Discuss boundary setting"],
  "progress_notes": "Patient more open this session compared to last."
}
```

#### 3. `graph_nodes` Table (CORE)

```sql
CREATE TABLE graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,  -- Unique within session: "anxiety", "girlfriend", "work_stress"
  node_type TEXT NOT NULL CHECK (node_type IN ('topic', 'emotion')),
  label TEXT NOT NULL,  -- Display label: "Girlfriend", "Anxiety", "Work Stress"
  embedding VECTOR(1536),  -- OpenAI text-embedding-3-small vector
  properties JSONB DEFAULT '{}',  -- Additional metadata
  first_mentioned_at TIMESTAMPTZ DEFAULT NOW(),
  mention_count INT DEFAULT 1,  -- How many times entity mentioned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, node_id)
);

-- Indexes
CREATE INDEX idx_graph_nodes_session ON graph_nodes(session_id);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);
```

**Purpose:** Store graph nodes (topics and emotions).

**Key Fields:**
- `node_id`: Normalized ID (lowercase, underscores). Example: "work_stress"
- `label`: Human-readable display name. Example: "Work Stress"
- `embedding`: 1536-dimensional vector for semantic similarity
- `node_type`: "topic" (girlfriend, work, therapy) or "emotion" (anxiety, joy, anger)

**JSONB `properties` structure:**
```json
{
  "intensity": 0.8,  -- For emotions: 0.0 to 1.0
  "context": "mentioned in relation to family dynamics",
  "transcript_snippet": "...and whenever I think about my girlfriend..."
}
```

#### 4. `graph_edges` Table (CORE)

```sql
CREATE TABLE graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,  -- Must match graph_nodes.node_id
  target_node_id TEXT NOT NULL,  -- Must match graph_nodes.node_id
  similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
  relationship_type TEXT DEFAULT 'related_to',
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, source_node_id, target_node_id)
);

-- Indexes
CREATE INDEX idx_graph_edges_session ON graph_edges(session_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node_id);
CREATE INDEX idx_graph_edges_score ON graph_edges(similarity_score DESC);
```

**Purpose:** Store relationships between nodes.

**Key Fields:**
- `similarity_score`: 0.75 to 1.0 (cosine similarity from embeddings)
- `relationship_type`: Future expansion ("causes", "alleviates", "triggers")

### Supabase Real-time Setup

**CRITICAL: Enable real-time for graph tables**

```sql
-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
```

**Why this matters:**
- When backend inserts a node → Frontend instantly receives it via WebSocket
- No polling required
- Sub-100ms latency from database insert to frontend update

---

## Backend Implementation Guide

### 1. Project Setup

```bash
# Create backend directory
mkdir backend && cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-dotenv
pip install openai supabase numpy
pip install pydantic pydantic-settings
```

### 2. Environment Configuration (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS (adjust for production)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Main Application (`backend/app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import patients, sessions, health

app = FastAPI(
    title="Dimini API",
    description="AI Therapy Assistant Backend",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])

@app.get("/")
def root():
    return {"status": "Dimini API is running", "version": "1.0.0"}
```

### 4. Configuration (`backend/app/config.py`)

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # OpenAI
    OPENAI_API_KEY: str

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Semantic Similarity
    SIMILARITY_THRESHOLD: float = 0.75  # Edges created if similarity > this

    # Entity Extraction
    EXTRACTION_INTERVAL: int = 30  # Seconds between extractions

    class Config:
        env_file = ".env"

settings = Settings()
```

### 5. Supabase Client (`backend/app/db/supabase_client.py`)

```python
from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_KEY
)

# Helper functions
async def get_patient(patient_id: str):
    """Fetch patient by ID"""
    response = supabase.table('patients').select('*').eq('id', patient_id).single().execute()
    return response.data

async def create_session(patient_id: str, therapist_id: str = None):
    """Create new therapy session"""
    data = {
        'patient_id': patient_id,
        'therapist_id': therapist_id,
        'status': 'active'
    }
    response = supabase.table('sessions').insert(data).execute()
    return response.data[0]

async def update_transcript(session_id: str, new_text: str):
    """Append text to session transcript"""
    # Fetch current transcript
    session = supabase.table('sessions').select('transcript').eq('id', session_id).single().execute()
    current_transcript = session.data['transcript'] or ''

    # Append new text
    updated_transcript = current_transcript + '\n' + new_text

    # Update
    response = supabase.table('sessions').update({
        'transcript': updated_transcript
    }).eq('id', session_id).execute()

    return response.data[0]

async def insert_graph_node(session_id: str, node_data: dict):
    """Insert or update graph node"""
    data = {
        'session_id': session_id,
        'node_id': node_data['node_id'],
        'node_type': node_data['node_type'],
        'label': node_data['label'],
        'embedding': node_data['embedding'],
        'properties': node_data.get('properties', {})
    }

    # Upsert (insert or update if exists)
    response = supabase.table('graph_nodes').upsert(data).execute()
    return response.data[0]

async def insert_graph_edge(session_id: str, edge_data: dict):
    """Insert graph edge (relationship)"""
    data = {
        'session_id': session_id,
        'source_node_id': edge_data['source'],
        'target_node_id': edge_data['target'],
        'similarity_score': edge_data['similarity_score'],
        'relationship_type': edge_data.get('relationship_type', 'related_to')
    }

    # Upsert
    response = supabase.table('graph_edges').upsert(data).execute()
    return response.data[0]

async def get_session_graph(session_id: str):
    """Fetch all nodes and edges for a session"""
    nodes = supabase.table('graph_nodes').select('*').eq('session_id', session_id).execute()
    edges = supabase.table('graph_edges').select('*').eq('session_id', session_id).execute()

    return {
        'nodes': nodes.data,
        'edges': edges.data
    }
```

### 6. Entity Extractor (`backend/app/services/entity_extractor.py`)

**PURPOSE:** Use GPT-4 to extract topics and emotions from transcript chunks.

```python
import openai
from app.config import settings
from typing import Dict, List
import json

openai.api_key = settings.OPENAI_API_KEY

class EntityExtractor:
    def __init__(self):
        self.system_prompt = """You are a therapy session analyzer. Extract psychological entities from therapy conversations.

Focus on:
- TOPICS: Concrete subjects discussed (work, girlfriend, family, therapy, childhood, etc.)
- EMOTIONS: Emotional states expressed (anxiety, joy, anger, sadness, hope, frustration, etc.)

Rules:
- Use simple, normalized IDs (lowercase, underscores): "work_stress", "anxiety", "girlfriend"
- Use clear, title-case labels for display: "Work Stress", "Anxiety", "Girlfriend"
- Only extract entities EXPLICITLY mentioned in the text
- Avoid inferring entities not clearly discussed
"""

        self.function_schema = {
            "name": "extract_therapy_entities",
            "description": "Extract topics and emotions from therapy conversation",
            "parameters": {
                "type": "object",
                "properties": {
                    "entities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "node_id": {
                                    "type": "string",
                                    "description": "Normalized ID (lowercase, underscores): 'anxiety', 'work_stress'"
                                },
                                "node_type": {
                                    "type": "string",
                                    "enum": ["topic", "emotion"],
                                    "description": "Is this a topic or emotion?"
                                },
                                "label": {
                                    "type": "string",
                                    "description": "Display label (title case): 'Anxiety', 'Work Stress'"
                                },
                                "context": {
                                    "type": "string",
                                    "description": "Brief context of how it was mentioned"
                                }
                            },
                            "required": ["node_id", "node_type", "label"]
                        }
                    }
                },
                "required": ["entities"]
            }
        }

    async def extract(self, transcript_chunk: str) -> Dict[str, List]:
        """
        Extract entities from a transcript chunk.

        Args:
            transcript_chunk: 30-second segment of therapy conversation

        Returns:
            {
                "entities": [
                    {"node_id": "anxiety", "node_type": "emotion", "label": "Anxiety", ...},
                    ...
                ]
            }
        """
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Extract entities from this therapy conversation:\n\n{transcript_chunk}"}
                ],
                functions=[self.function_schema],
                function_call={"name": "extract_therapy_entities"},
                temperature=0.3  # Low temperature for consistent extraction
            )

            # Parse function call result
            function_call = response.choices[0].message.function_call
            result = json.loads(function_call.arguments)

            return result

        except Exception as e:
            print(f"Error in entity extraction: {e}")
            return {"entities": []}

# Example usage:
# extractor = EntityExtractor()
# result = await extractor.extract("I've been feeling really anxious about work lately. My relationship with my girlfriend has been strained...")
# => {"entities": [{"node_id": "anxiety", "node_type": "emotion", ...}, {"node_id": "work", ...}, {"node_id": "girlfriend", ...}]}
```

### 7. Semantic Linker (`backend/app/services/semantic_linker.py`)

**PURPOSE:** Calculate semantic similarity between entities using embeddings.

```python
import openai
import numpy as np
from app.config import settings
from typing import List, Tuple, Dict

openai.api_key = settings.OPENAI_API_KEY

class SemanticLinker:
    def __init__(self, threshold: float = None):
        self.threshold = threshold or settings.SIMILARITY_THRESHOLD
        self.embedding_model = "text-embedding-3-small"  # 1536 dimensions, cheap, fast

    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate OpenAI embedding for a text string.

        Args:
            text: The entity label or description

        Returns:
            List of 1536 floats
        """
        try:
            response = openai.Embedding.create(
                model=self.embedding_model,
                input=text
            )
            return response['data'][0]['embedding']
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None

    def cosine_similarity(self, embedding_a: List[float], embedding_b: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Formula: cos(θ) = (A · B) / (||A|| * ||B||)
        Result: -1.0 to 1.0 (higher = more similar)

        Args:
            embedding_a: First embedding vector
            embedding_b: Second embedding vector

        Returns:
            Similarity score (0.0 to 1.0)
        """
        a = np.array(embedding_a)
        b = np.array(embedding_b)

        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        similarity = dot_product / (norm_a * norm_b)

        # Normalize to 0-1 range (from -1 to 1)
        normalized_similarity = (similarity + 1) / 2

        return normalized_similarity

    async def find_related_nodes(
        self,
        new_node: Dict,
        existing_nodes: List[Dict]
    ) -> List[Tuple[str, float]]:
        """
        Find which existing nodes should connect to the new node.

        Args:
            new_node: {"node_id": "anxiety", "embedding": [...], ...}
            existing_nodes: List of existing nodes with embeddings

        Returns:
            List of (node_id, similarity_score) tuples for nodes above threshold

        Example:
            >>> new_node = {"node_id": "stress", "embedding": [...]}
            >>> existing = [
            ...     {"node_id": "anxiety", "embedding": [...]},
            ...     {"node_id": "girlfriend", "embedding": [...]}
            ... ]
            >>> await linker.find_related_nodes(new_node, existing)
            [("anxiety", 0.89), ("work", 0.78)]  # "girlfriend" was below 0.75 threshold
        """
        new_embedding = new_node['embedding']
        related_nodes = []

        for existing_node in existing_nodes:
            # Skip self-comparison
            if existing_node['node_id'] == new_node['node_id']:
                continue

            existing_embedding = existing_node['embedding']

            # Calculate similarity
            similarity = self.cosine_similarity(new_embedding, existing_embedding)

            # Add if above threshold
            if similarity >= self.threshold:
                related_nodes.append((existing_node['node_id'], similarity))

        # Sort by similarity (highest first)
        related_nodes.sort(key=lambda x: x[1], reverse=True)

        return related_nodes

# Example usage:
# linker = SemanticLinker(threshold=0.75)
# embedding = await linker.get_embedding("anxiety")
# related = await linker.find_related_nodes(new_node, existing_nodes)
```

### 8. Graph Builder (`backend/app/services/graph_builder.py`)

**PURPOSE:** Orchestrate entity extraction → embedding generation → similarity calculation → database insertion.

```python
from app.services.entity_extractor import EntityExtractor
from app.services.semantic_linker import SemanticLinker
from app.db.supabase_client import (
    insert_graph_node,
    insert_graph_edge,
    get_session_graph
)
from typing import Dict, List

class GraphBuilder:
    def __init__(self):
        self.extractor = EntityExtractor()
        self.linker = SemanticLinker()

    async def process_transcript_chunk(
        self,
        session_id: str,
        transcript_chunk: str
    ) -> Dict:
        """
        Main processing pipeline:
        1. Extract entities from transcript
        2. Generate embeddings for new entities
        3. Calculate similarity with existing entities
        4. Insert nodes and edges into database

        Args:
            session_id: UUID of active session
            transcript_chunk: 30-second transcript segment

        Returns:
            {
                "nodes_added": [...],
                "edges_added": [...],
                "status": "success"
            }
        """
        nodes_added = []
        edges_added = []

        try:
            # Step 1: Extract entities
            extraction_result = await self.extractor.extract(transcript_chunk)
            entities = extraction_result.get('entities', [])

            if not entities:
                return {
                    "nodes_added": [],
                    "edges_added": [],
                    "status": "no_entities_found"
                }

            # Step 2: Get existing nodes from this session
            existing_graph = await get_session_graph(session_id)
            existing_nodes = existing_graph['nodes']

            # Step 3: Process each new entity
            for entity in entities:
                # Generate embedding for new entity
                embedding = await self.linker.get_embedding(entity['label'])

                if not embedding:
                    continue

                # Prepare node data
                node_data = {
                    'node_id': entity['node_id'],
                    'node_type': entity['node_type'],
                    'label': entity['label'],
                    'embedding': embedding,
                    'properties': {
                        'context': entity.get('context', '')
                    }
                }

                # Insert node (upsert = skip if already exists)
                inserted_node = await insert_graph_node(session_id, node_data)
                nodes_added.append(inserted_node)

                # Step 4: Find related nodes (semantic similarity)
                related_nodes = await self.linker.find_related_nodes(
                    {'node_id': entity['node_id'], 'embedding': embedding},
                    existing_nodes
                )

                # Step 5: Create edges
                for related_node_id, similarity_score in related_nodes:
                    edge_data = {
                        'source': entity['node_id'],
                        'target': related_node_id,
                        'similarity_score': similarity_score
                    }

                    inserted_edge = await insert_graph_edge(session_id, edge_data)
                    edges_added.append(inserted_edge)

            return {
                "nodes_added": nodes_added,
                "edges_added": edges_added,
                "status": "success"
            }

        except Exception as e:
            print(f"Error in graph building: {e}")
            return {
                "nodes_added": nodes_added,
                "edges_added": edges_added,
                "status": "error",
                "error": str(e)
            }

# Example usage:
# builder = GraphBuilder()
# result = await builder.process_transcript_chunk(session_id, "I've been feeling anxious...")
```

### 9. Sessions API (`backend/app/api/sessions.py`)

**PURPOSE:** REST API endpoints for session management.

```python
from fastapi import APIRouter, HTTPException
from app.models import SessionCreate, TranscriptUpdate
from app.services.graph_builder import GraphBuilder
from app.db.supabase_client import (
    create_session,
    update_transcript,
    supabase
)

router = APIRouter()
graph_builder = GraphBuilder()

@router.post("/start")
async def start_session(data: SessionCreate):
    """
    Start a new therapy session.

    Request body:
    {
        "patient_id": "uuid",
        "therapist_id": "optional_string"
    }

    Returns:
    {
        "session_id": "uuid",
        "status": "active",
        "started_at": "2024-01-15T10:30:00Z"
    }
    """
    try:
        session = await create_session(
            patient_id=data.patient_id,
            therapist_id=data.therapist_id
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/transcript")
async def update_session_transcript(session_id: str, data: TranscriptUpdate):
    """
    Voice agent calls this endpoint every 30 seconds.

    Request body:
    {
        "text": "transcript chunk from last 30 seconds"
    }

    Processing:
    1. Append text to session transcript
    2. Extract entities (GPT-4)
    3. Generate embeddings
    4. Calculate similarities
    5. Insert nodes/edges into Supabase
    6. Supabase Realtime broadcasts to frontend

    Returns:
    {
        "nodes_added": [{...}, {...}],
        "edges_added": [{...}, {...}],
        "status": "success"
    }
    """
    try:
        # Update transcript in database
        await update_transcript(session_id, data.text)

        # Process the chunk (extract entities, build graph)
        result = await graph_builder.process_transcript_chunk(
            session_id=session_id,
            transcript_chunk=data.text
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/end")
async def end_session(session_id: str):
    """
    End a therapy session and generate summary.

    Processing:
    1. Mark session as completed
    2. Generate AI summary (GPT-4)
    3. Store summary in database

    Returns:
    {
        "session_id": "uuid",
        "status": "completed",
        "summary": {...}
    }
    """
    try:
        # Fetch full transcript
        session = supabase.table('sessions').select('transcript').eq('id', session_id).single().execute()
        transcript = session.data['transcript']

        # Generate summary (TODO: implement session_analyzer.py)
        # summary = await session_analyzer.generate_summary(transcript)

        # For now, simple summary
        summary = {
            "key_topics": ["work", "anxiety"],
            "insights": "Session focused on work-related stress."
        }

        # Update session
        updated_session = supabase.table('sessions').update({
            'status': 'completed',
            'ended_at': 'now()',
            'summary': summary
        }).eq('id', session_id).execute()

        return updated_session.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/graph")
async def get_session_graph_data(session_id: str):
    """
    Fetch complete graph for a session (for loading historical sessions).

    Returns:
    {
        "nodes": [{...}, {...}],
        "edges": [{...}, {...}]
    }
    """
    try:
        from app.db.supabase_client import get_session_graph
        graph = await get_session_graph(session_id)
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 10. Pydantic Models (`backend/app/models.py`)

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class SessionCreate(BaseModel):
    patient_id: str = Field(..., description="UUID of the patient")
    therapist_id: Optional[str] = Field(None, description="ID of the therapist")

class TranscriptUpdate(BaseModel):
    text: str = Field(..., description="Transcript chunk from voice agent")

class SessionResponse(BaseModel):
    id: str
    patient_id: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None

class NodeData(BaseModel):
    node_id: str
    node_type: str  # "topic" or "emotion"
    label: str
    embedding: List[float]

class EdgeData(BaseModel):
    source: str
    target: str
    similarity_score: float
```

---

## Frontend Implementation Guide

### 1. Project Setup

```bash
# Create Next.js project
npx create-next-app@latest frontend --typescript --tailwind --app --use-npm

cd frontend

# Install dependencies
npm install @supabase/supabase-js
npm install react-force-graph-2d
npm install lucide-react
npm install axios

# Initialize shadcn/ui
npx shadcn-ui@latest init
# Choose: Default style, Slate base color, CSS variables: yes

# Add shadcn components
npx shadcn-ui@latest add button card sheet scroll-area badge
```

### 2. Environment Configuration (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Supabase Client (`frontend/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### 4. Types (`frontend/lib/types.ts`)

```typescript
export interface Patient {
  id: string;
  name: string;
  email?: string;
  demographics?: Record<string, any>;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  therapist_id?: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed' | 'cancelled';
  transcript?: string;
  summary?: Record<string, any>;
}

export interface GraphNode {
  id: string;  // node_id
  label: string;
  type: 'topic' | 'emotion';
  group: number;  // For coloring: 1 = emotion, 2 = topic
}

export interface GraphEdge {
  source: string;  // node_id
  target: string;  // node_id
  value: number;  // similarity_score (for edge thickness)
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}
```

### 5. Real-time Hook (`frontend/hooks/useRealtimeGraph.ts`)

**THIS IS THE CORE FRONTEND LOGIC**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GraphData, GraphNode, GraphEdge } from '@/lib/types';

export function useRealtimeGraph(sessionId: string) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    // Initial load
    loadInitialGraph();

    // Subscribe to real-time node additions
    const nodeSubscription = supabase
      .channel(`session_${sessionId}_nodes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'graph_nodes',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New node:', payload.new);

          const newNode: GraphNode = {
            id: payload.new.node_id,
            label: payload.new.label,
            type: payload.new.node_type,
            group: payload.new.node_type === 'emotion' ? 1 : 2
          };

          setGraphData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
          }));
        }
      )
      .subscribe();

    // Subscribe to real-time edge additions
    const edgeSubscription = supabase
      .channel(`session_${sessionId}_edges`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'graph_edges',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New edge:', payload.new);

          const newEdge: GraphEdge = {
            source: payload.new.source_node_id,
            target: payload.new.target_node_id,
            value: payload.new.similarity_score
          };

          setGraphData(prev => ({
            ...prev,
            links: [...prev.links, newEdge]
          }));
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      nodeSubscription.unsubscribe();
      edgeSubscription.unsubscribe();
    };
  }, [sessionId]);

  async function loadInitialGraph() {
    try {
      setLoading(true);

      // Fetch nodes
      const { data: nodes, error: nodesError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('session_id', sessionId);

      if (nodesError) throw nodesError;

      // Fetch edges
      const { data: edges, error: edgesError } = await supabase
        .from('graph_edges')
        .select('*')
        .eq('session_id', sessionId);

      if (edgesError) throw edgesError;

      // Transform to graph format
      const transformedNodes: GraphNode[] = (nodes || []).map(node => ({
        id: node.node_id,
        label: node.label,
        type: node.node_type,
        group: node.node_type === 'emotion' ? 1 : 2
      }));

      const transformedEdges: GraphEdge[] = (edges || []).map(edge => ({
        source: edge.source_node_id,
        target: edge.target_node_id,
        value: edge.similarity_score
      }));

      setGraphData({
        nodes: transformedNodes,
        links: transformedEdges
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading graph:', error);
      setLoading(false);
    }
  }

  return { graphData, loading, refresh: loadInitialGraph };
}
```

### 6. Graph Component (`frontend/components/SemanticGraph.tsx`)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GraphData } from '@/lib/types';

// Force Graph must be dynamically imported (no SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});

interface SemanticGraphProps {
  graphData: GraphData;
  loading?: boolean;
}

export default function SemanticGraph({ graphData, loading }: SemanticGraphProps) {
  const graphRef = useRef<any>();

  // Auto-fit graph when new nodes appear
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, [graphData.nodes.length]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden bg-slate-950">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeAutoColorBy="group"
        nodeLabel="label"
        nodeRelSize={8}
        linkWidth={link => link.value * 3}  // Thicker edges = higher similarity
        linkDirectionalParticles={2}  // Animated particles along edges
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#020617"  // matches Tailwind slate-950
        linkColor={() => '#64748b'}  // Tailwind slate-500
        d3AlphaDecay={0.02}  // Slower physics = smoother animation
        d3VelocityDecay={0.3}  // Natural movement feel
        cooldownTicks={100}
        onNodeClick={(node) => {
          console.log('Node clicked:', node);
          // TODO: Show node details in sidebar
        }}
      />
    </div>
  );
}
```

### 7. Session Page (`frontend/app/patients/[id]/sessions/[sessionId]/page.tsx`)

**THE MAIN SESSION VIEW**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SemanticGraph from '@/components/SemanticGraph';
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const { graphData, loading } = useRealtimeGraph(sessionId);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');

  return (
    <div className="h-screen flex flex-col p-4 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Session</h1>
          <p className="text-slate-400 text-sm">Session ID: {sessionId}</p>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={sessionStatus === 'active' ? 'default' : 'secondary'}>
            {sessionStatus === 'active' ? '🔴 Live' : 'Completed'}
          </Badge>

          <Button
            variant="destructive"
            onClick={() => {
              // TODO: Call /api/sessions/${sessionId}/end
              setSessionStatus('completed');
            }}
            disabled={sessionStatus === 'completed'}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Graph Area */}
      <Card className="flex-1 p-0 overflow-hidden">
        <SemanticGraph graphData={graphData} loading={loading} />
      </Card>

      {/* Stats Footer */}
      <div className="mt-4 flex gap-4">
        <Card className="flex-1 p-4">
          <div className="text-sm text-slate-400">Nodes</div>
          <div className="text-2xl font-bold text-white">{graphData.nodes.length}</div>
        </Card>

        <Card className="flex-1 p-4">
          <div className="text-sm text-slate-400">Connections</div>
          <div className="text-2xl font-bold text-white">{graphData.links.length}</div>
        </Card>

        <Card className="flex-1 p-4">
          <div className="text-sm text-slate-400">Topics</div>
          <div className="text-2xl font-bold text-white">
            {graphData.nodes.filter(n => n.type === 'topic').length}
          </div>
        </Card>

        <Card className="flex-1 p-4">
          <div className="text-sm text-slate-400">Emotions</div>
          <div className="text-2xl font-bold text-white">
            {graphData.nodes.filter(n => n.type === 'emotion').length}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

---

## Core Algorithms

### Semantic Similarity Algorithm

**Goal:** Determine if two concepts should be connected in the graph.

**Input:**
- Entity A: "anxiety" (embedding: 1536-dimensional vector)
- Entity B: "stress" (embedding: 1536-dimensional vector)

**Process:**

1. **Cosine Similarity Calculation**

```
similarity = (A · B) / (||A|| * ||B||)

Where:
- A · B = dot product of vectors
- ||A|| = magnitude (length) of vector A
- ||B|| = magnitude of vector B

Result: -1.0 to 1.0
```

2. **Normalization to 0-1 Range**

```
normalized = (similarity + 1) / 2

Result: 0.0 to 1.0
```

3. **Thresholding**

```python
if normalized_similarity >= 0.75:
    create_edge(entity_a, entity_b, similarity_score=normalized_similarity)
```

**Example Similarities (Observed):**
- "anxiety" ↔ "stress": ~0.85
- "anxiety" ↔ "worried": ~0.82
- "anxiety" ↔ "girlfriend": ~0.35 (not connected)
- "work" ↔ "job": ~0.91
- "work" ↔ "career": ~0.88

### Entity Extraction Algorithm

**Goal:** Extract topics and emotions from unstructured therapy conversation.

**Input:**
```
Transcript: "I've been feeling really anxious lately. Work has been stressful,
and my relationship with my girlfriend is causing me a lot of worry."
```

**Process:**

1. **GPT-4 Function Calling**
   - System prompt: Define extraction rules
   - User message: Transcript chunk
   - Function: "extract_therapy_entities"
   - Temperature: 0.3 (consistent, deterministic)

2. **Output Schema**
```json
{
  "entities": [
    {"node_id": "anxiety", "node_type": "emotion", "label": "Anxiety"},
    {"node_id": "work", "node_type": "topic", "label": "Work"},
    {"node_id": "girlfriend", "node_type": "topic", "label": "Girlfriend"},
    {"node_id": "worry", "node_type": "emotion", "label": "Worry"}
  ]
}
```

3. **Deduplication**
   - Check if `node_id` already exists in session
   - If exists: Increment `mention_count`
   - If new: Create node

---

## API Specifications

### For Voice Agent Integration

#### 1. Start Session

```http
POST /api/sessions/start
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "therapist_id": "dr_smith"
}

Response 200:
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "therapist_id": "dr_smith",
  "status": "active",
  "started_at": "2024-01-15T14:30:00Z"
}
```

#### 2. Update Transcript (Real-time - Called Every 30s)

```http
POST /api/sessions/{session_id}/transcript
Content-Type: application/json

{
  "text": "Patient mentioned feeling anxious about upcoming work deadlines.
           Discussed relationship with girlfriend and family dynamics."
}

Response 200:
{
  "nodes_added": [
    {"id": "...", "node_id": "anxiety", "label": "Anxiety", "node_type": "emotion"},
    {"id": "...", "node_id": "work", "label": "Work", "node_type": "topic"}
  ],
  "edges_added": [
    {"id": "...", "source": "anxiety", "target": "work", "similarity_score": 0.82}
  ],
  "status": "success"
}
```

**Critical Implementation Notes:**
- Voice agent should buffer 30 seconds of transcript
- Send accumulated text to this endpoint
- Backend processes asynchronously (may take 2-3s)
- Supabase Realtime pushes results to frontend

#### 3. End Session

```http
POST /api/sessions/{session_id}/end
Content-Type: application/json

Response 200:
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "ended_at": "2024-01-15T15:30:00Z",
  "summary": {
    "key_topics": ["work", "girlfriend", "family"],
    "emotional_themes": ["anxiety", "frustration", "hope"],
    "insights": "Patient shows correlation between work stress and relationship anxiety...",
    "recommendations": ["Explore coping mechanisms", "Discuss boundary setting"]
  }
}
```

---

## Real-time System

### How Supabase Realtime Works

1. **Enable Realtime on Tables**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
```

2. **Frontend Subscribes to Changes**
```typescript
supabase
  .channel('session_123_nodes')
  .on('postgres_changes', { event: 'INSERT', ... }, (payload) => {
    // payload.new = newly inserted row
    addNodeToGraph(payload.new);
  })
  .subscribe();
```

3. **Backend Inserts Data**
```python
supabase.table('graph_nodes').insert({...}).execute()
```

4. **Supabase Broadcasts Change**
   - PostgreSQL triggers notification
   - Supabase Realtime server receives notification
   - Broadcasts to all subscribed clients via WebSocket

5. **Frontend Receives Update**
   - React state updated
   - Force Graph animates new node appearance

**Latency:** Typically 50-150ms from insert to frontend update.

---

## Integration Points

### Voice Agent ↔ Backend

**Voice Agent Responsibilities:**
- Capture audio
- Transcribe speech (STT)
- Buffer 30 seconds of transcript
- Send to `/api/sessions/{id}/transcript` every 30s
- Display response status

**Backend Responsibilities:**
- Receive transcript chunk
- Extract entities (GPT-4)
- Generate embeddings (OpenAI)
- Calculate similarities
- Insert to database

**Protocol:**
```
Voice Agent → POST /api/sessions/start → Backend
            ← session_id

Every 30s:
Voice Agent → POST /api/sessions/{id}/transcript → Backend
            ← nodes_added, edges_added

At end:
Voice Agent → POST /api/sessions/{id}/end → Backend
            ← summary
```

### Backend ↔ Supabase

**Direct Client Connection:**
- Backend uses Supabase Python client
- Service role key (full access)
- Inserts/updates via `.insert()`, `.update()`, `.upsert()`

**Real-time Trigger:**
- When backend inserts into `graph_nodes` or `graph_edges`
- Supabase Realtime automatically broadcasts
- No custom WebSocket code needed

### Frontend ↔ Supabase

**Read Operations:**
- Initial graph load: `supabase.from('graph_nodes').select().eq('session_id', ...)`
- Patient lists: `supabase.from('patients').select()`

**Real-time Subscriptions:**
- Subscribe to `INSERT` events on graph tables
- Filtered by `session_id`
- Updates React state on new data

---

## Development Workflow

### Local Development Setup

1. **Start Backend**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

2. **Start Frontend**
```bash
cd frontend
npm run dev
```

3. **Access Services**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger UI)
- Supabase Dashboard: https://app.supabase.com

### Testing Real-time Flow

**Manual Test:**
1. Open frontend: http://localhost:3000/patients/[id]/sessions/[session_id]
2. Use Postman/curl to send transcript:
```bash
curl -X POST http://localhost:8000/api/sessions/{session_id}/transcript \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious about work and my relationship"}'
```
3. Watch graph update in real-time on frontend

**Expected Behavior:**
- Request completes in 2-4 seconds
- Nodes appear on graph within 100ms of backend response
- Edges connect related concepts
- Physics animation causes nodes to find optimal positions

### Development Order

**Recommended Build Sequence:**

1. **Phase 1: Database Foundation** (2 hours)
   - Create Supabase project
   - Run schema SQL
   - Test manual inserts via Supabase UI
   - Enable Realtime on graph tables

2. **Phase 2: Backend Core** (8 hours)
   - Set up FastAPI project structure
   - Implement Supabase client helpers
   - Implement EntityExtractor (GPT-4)
   - Implement SemanticLinker (embeddings + similarity)
   - Implement GraphBuilder (orchestration)
   - Create sessions API endpoints
   - Test with Postman

3. **Phase 3: Frontend Foundation** (4 hours)
   - Create Next.js project
   - Install shadcn/ui components
   - Set up Supabase client
   - Create basic routing structure
   - Test Supabase connection

4. **Phase 4: Graph Visualization** (6 hours)
   - Implement useRealtimeGraph hook
   - Create SemanticGraph component
   - Test real-time updates (manual backend calls)
   - Style graph (colors, node sizes, edge thickness)

5. **Phase 5: Patient Management** (4 hours)
   - Patient list page
   - Patient profile page
   - Session history component
   - CRUD operations

6. **Phase 6: Integration & Testing** (4 hours)
   - Coordinate with teammate on voice agent integration
   - Test end-to-end flow
   - Handle edge cases
   - Error handling

7. **Phase 7: Polish** (4 hours)
   - UI improvements
   - Loading states
   - Error messages
   - Demo data seeding

8. **Phase 8: Deployment** (2 hours)
   - Deploy backend (Railway/Render)
   - Deploy frontend (Vercel)
   - Environment variables setup
   - Final testing

**Buffer:** 12 hours for debugging, unexpected issues, demos

---

## Testing Strategy

### Backend Tests

**Entity Extraction Test:**
```python
import pytest
from app.services.entity_extractor import EntityExtractor

@pytest.mark.asyncio
async def test_entity_extraction():
    extractor = EntityExtractor()

    transcript = "I've been feeling anxious about work. My girlfriend is supportive."
    result = await extractor.extract(transcript)

    assert 'entities' in result
    entities = result['entities']

    # Should extract anxiety, work, girlfriend
    node_ids = [e['node_id'] for e in entities]
    assert 'anxiety' in node_ids
    assert 'work' in node_ids
    assert 'girlfriend' in node_ids
```

**Semantic Similarity Test:**
```python
@pytest.mark.asyncio
async def test_semantic_similarity():
    linker = SemanticLinker(threshold=0.75)

    # These should be similar
    emb1 = await linker.get_embedding("anxiety")
    emb2 = await linker.get_embedding("stress")

    similarity = linker.cosine_similarity(emb1, emb2)

    assert similarity >= 0.75  # Should be connected
```

### Frontend Tests

**Real-time Hook Test:**
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';

test('useRealtimeGraph loads initial data', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useRealtimeGraph('test-session-id')
  );

  await waitForNextUpdate();

  expect(result.current.loading).toBe(false);
  expect(result.current.graphData.nodes).toHaveLength(0);
});
```

### Integration Test

**End-to-End Flow:**
1. Start session via API
2. Send transcript chunk
3. Verify nodes appear in database
4. Verify edges created for similar concepts
5. Verify frontend receives real-time update

---

## Deployment Guide

### Backend Deployment (Railway)

1. **Create Railway Project**
   - Connect GitHub repo
   - Select `backend` directory

2. **Environment Variables**
   - Add all variables from `.env`
   - Ensure `SUPABASE_URL`, `SUPABASE_KEY`, `OPENAI_API_KEY` are set

3. **Build Command**
```bash
pip install -r requirements.txt
```

4. **Start Command**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Import from GitHub
   - Select `frontend` directory

2. **Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_URL` (Railway backend URL)

3. **Build Settings**
```bash
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

---

## Common Pitfalls & Solutions

### 1. Supabase Real-time Not Working

**Symptom:** Graph doesn't update in real-time.

**Causes:**
- Realtime not enabled on tables
- Wrong channel subscription filter
- Anon key doesn't have permissions

**Solution:**
```sql
-- Verify Realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;

-- Check Row Level Security (disable for testing)
ALTER TABLE graph_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges DISABLE ROW LEVEL SECURITY;
```

```typescript
// Correct subscription filter
supabase
  .channel('my_channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',  // Must specify schema
    table: 'graph_nodes',
    filter: `session_id=eq.${sessionId}`  // Correct filter syntax
  }, (payload) => { ... })
  .subscribe();
```

### 2. Force Graph Not Rendering

**Symptom:** Blank screen or "window is not defined" error.

**Cause:** react-force-graph uses browser APIs (Canvas) not available in SSR.

**Solution:**
```typescript
// Use dynamic import with ssr: false
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});
```

### 3. OpenAI Rate Limits

**Symptom:** 429 errors when processing multiple transcript chunks.

**Cause:** OpenAI API rate limits (3 RPM on free tier, 60 RPM on paid).

**Solution:**
```python
import asyncio
from openai import RateLimitError

async def extract_with_retry(transcript, max_retries=3):
    for i in range(max_retries):
        try:
            return await extractor.extract(transcript)
        except RateLimitError:
            if i < max_retries - 1:
                await asyncio.sleep(2 ** i)  # Exponential backoff
            else:
                raise
```

### 4. CORS Errors

**Symptom:** Frontend can't call backend API.

**Cause:** CORS not configured or wrong origins.

**Solution:**
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. Embedding Storage (Vector Type)

**Symptom:** Can't store embeddings in PostgreSQL.

**Cause:** VECTOR type not enabled.

**Solution:**
```sql
-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Create column with correct type
ALTER TABLE graph_nodes ADD COLUMN embedding VECTOR(1536);
```

Alternatively, store as JSON:
```sql
ALTER TABLE graph_nodes ADD COLUMN embedding JSONB;
```

```python
# Store as array
supabase.table('graph_nodes').insert({
    'embedding': embedding_list  # [0.123, 0.456, ...]
}).execute()
```

### 6. Graph Performance Issues

**Symptom:** Graph lags with 100+ nodes.

**Cause:** Too many physics calculations.

**Solution:**
```typescript
<ForceGraph2D
  graphData={graphData}
  cooldownTicks={100}  // Stop physics after 100 ticks
  d3AlphaDecay={0.05}  // Faster cooldown
  enableNodeDrag={false}  // Disable if not needed
  enableZoomInteraction={true}
  enablePanInteraction={true}
/>
```

Or use react-force-graph-3d's WebGL renderer:
```typescript
import ForceGraph3D from 'react-force-graph-3d';
// 3D = WebGL = better performance for large graphs
```

---

## Appendix: Quick Reference

### Key Commands

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

# Database
# Access Supabase dashboard at app.supabase.com

# Testing
# Backend: pytest
# Frontend: npm test
```

### Key URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Supabase: https://app.supabase.com

### Important Files

- Backend entry: `backend/app/main.py`
- Entity extraction: `backend/app/services/entity_extractor.py`
- Semantic similarity: `backend/app/services/semantic_linker.py`
- Real-time hook: `frontend/hooks/useRealtimeGraph.ts`
- Graph component: `frontend/components/SemanticGraph.tsx`
- Main session page: `frontend/app/patients/[id]/sessions/[sessionId]/page.tsx`

---

**This guide should provide everything needed to build Dimini. For any ambiguities or questions during implementation, refer back to the "Core Algorithms" and "API Specifications" sections.**
