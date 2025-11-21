# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dimini is an AI-powered therapy visualization platform. The backend is a FastAPI application that processes therapy session transcripts in real-time, extracts psychological entities (topics and emotions), builds semantic graphs using OpenAI embeddings, and broadcasts updates to connected clients via WebSocket.

## Development Commands

### Setup and Installation

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate Prisma client (Python)
python -m prisma generate

# Sync database schema (idempotent, safe for development)
python -m prisma db push
```

### Running the Server

```bash
# Development mode with auto-reload
python -m uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000

# Or use the convenience script
./run.sh

# Production mode (no --reload)
python -m uvicorn app.main:socket_app --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

### Database Operations

```bash
# Generate Prisma client after schema changes
python -m prisma generate

# Push schema changes to database
python -m prisma db push

# IMPORTANT: Always use python -m prisma, NOT npx prisma
# This uses the Python Prisma client, not the Node.js one
```

## Architecture

### Tech Stack

- **FastAPI**: ASGI web framework with automatic OpenAPI docs
- **Prisma (Python)**: Async ORM with PostgreSQL
- **Socket.IO**: Real-time bidirectional communication
- **OpenAI**: GPT-4 for entity extraction, text-embedding-3-small for semantic similarity
- **JWT**: Authentication with token versioning and invalidation

### Core Processing Pipeline

The system follows a real-time AI processing pipeline:

1. **Transcript Ingestion** (`POST /api/sessions/{id}/transcript`)
   - Voice agent sends 30-second transcript chunks
   - Stored incrementally in `Session.transcript` field

2. **Entity Extraction** (`app/services/entity_extractor.py`)
   - GPT-4 extracts topics (work, family, therapy) and emotions (anxiety, hope, anger)
   - Uses function calling for structured JSON output
   - Entities have normalized IDs (`work_stress`) and display labels (`Work Stress`)

3. **Semantic Embedding** (`app/services/semantic_linker.py`)
   - Generates OpenAI embeddings (1536 dimensions) for each entity label
   - Stored as JSON array in `GraphNode.embedding` field

4. **Similarity Calculation**
   - Computes cosine similarity between new and existing node embeddings
   - Creates `GraphEdge` when similarity >= `SIMILARITY_THRESHOLD` (default 0.75)

5. **Graph Construction** (`app/services/graph_builder.py`)
   - Orchestrates the above services
   - Inserts nodes and edges into PostgreSQL via Prisma
   - Broadcasts updates to WebSocket clients in real-time

6. **Real-time Broadcast** (`app/services/realtime.py`)
   - Emits `graph_update` events to session room subscribers
   - Types: `node_added`, `edge_added`, `batch_update`, `processing_update`

### Database Models

Key Prisma models:

- **User**: Therapist accounts with JWT authentication, token versioning, account lockout
- **Patient**: Client records scoped to therapist
- **Session**: Therapy sessions with transcript, status (ACTIVE/COMPLETED/CANCELLED)
- **GraphNode**: Entities extracted from session (nodeId, nodeType, label, embedding, mentionCount)
- **GraphEdge**: Semantic relationships (sourceNodeId, targetNodeId, similarityScore)
- **AuditLog**: Compliance and security audit trail

### Application Structure

- `app/main.py`: FastAPI app, Socket.IO server, lifecycle management
- `app/config.py`: Pydantic settings from `.env`
- `app/database.py`: Global Prisma instance and connection management
- `app/api/`: REST endpoints (auth, patients, sessions)
- `app/models/`: Pydantic request/response models
- `app/services/`: Business logic (entity extraction, graph building, semantic linking, realtime)
- `app/websocket/`: Socket.IO event handlers
- `app/utils/`: Utility functions
- `prisma/schema.prisma`: Database schema

## Key Implementation Details

### Authentication Flow

1. `POST /api/auth/register` creates User with hashed password (bcrypt)
2. `POST /api/auth/login` returns JWT with `user_id`, `email`, `token_version`
3. All protected endpoints use `get_current_user()` dependency
4. Token invalidation via `tokenVersion` bump on logout/password change
5. Account lockout after failed login attempts

### WebSocket Events

**Client → Server:**
- `connect`: Initial connection
- `join_session`: Subscribe to session updates `{session_id}`
- `leave_session`: Unsubscribe from session

**Server → Client:**
- `connected`: Connection confirmation
- `joined_session`: Session room joined, followed by `graph_state` snapshot
- `graph_update`: Real-time node/edge additions
- `processing_update`: AI processing status (extracting, embedding, linking)
- `session_update`: Session status changes

### Environment Configuration

Critical environment variables in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Required for entity extraction and embeddings
- `SECRET_KEY`: JWT signing (use `python -c "import secrets; print(secrets.token_hex(32))"`)
- `ALLOWED_ORIGINS`: JSON array of CORS origins `["http://localhost:3000"]`

**GOTCHA**: `ALLOWED_ORIGINS` must be valid JSON array, not comma-separated string.

### Prisma Python Client

- Use `python -m prisma generate`, NOT `npx prisma generate`
- Schema uses `generator client { provider = "prisma-client-py", interface = "asyncio" }`
- Global instance: `from app.database import db` or `prisma`
- All queries are async: `await db.user.find_unique(...)`

### Real-time Graph Updates

Graph updates are broadcast immediately after database writes:

```python
# In GraphBuilder.process_transcript_chunk()
node = await db.graphnode.create(...)
await realtime_service.broadcast_graph_update(session_id, {
    "type": "node_added",
    "data": node_response.model_dump()
})
```

Clients receive updates in Socket.IO room `session_{session_id}`.

## Common Patterns

### Adding New API Endpoints

1. Create route in `app/api/{resource}.py`
2. Define Pydantic models in `app/models/{resource}.py`
3. Use `get_current_user` dependency for protected routes
4. Include router in `app/main.py`

### Adding Business Logic

1. Create service class in `app/services/{service}.py`
2. Import `db` from `app.database`
3. Use async/await for all database operations
4. Inject dependencies in constructor (e.g., `RealtimeService` for WebSocket)

### Database Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `python -m prisma generate` to update Python client
3. Run `python -m prisma db push` to sync database
4. Update Pydantic models to match new schema

## PostgreSQL Setup

```bash
# Create database user and database
createuser dimini_user --createdb --pwprompt
createdb dimini_db --owner dimini_user

# Verify connection
psql -d dimini_db -c '\dt'

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@16
```

## API Documentation

When server is running, interactive docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Use the "Authorize" button in Swagger to add JWT token for protected endpoints.

## Security Notes

- Passwords hashed with bcrypt
- JWT tokens include `token_version` for invalidation
- Failed login tracking with account lockout
- All patient data scoped to authenticated therapist
- Audit logging for compliance (HIPAA consideration)
- CORS restricted to `ALLOWED_ORIGINS`

## OpenAI Integration

### Entity Extraction
- Model: `GPT_MODEL` (default: gpt-4-0125-preview)
- Uses function calling for structured output
- System prompt in `EntityExtractor.__init__`
- Extraction triggered every `EXTRACTION_INTERVAL` seconds (default: 30)

### Embeddings
- Model: `EMBEDDING_MODEL` (default: text-embedding-3-small)
- Dimension: 1536
- Batch API calls for efficiency
- Cosine similarity for semantic linking

## Testing Workflow

1. Start PostgreSQL and ensure `.env` is configured
2. Run `python -m prisma db push` to sync schema
3. Start server with `--reload` flag for development
4. Register therapist via `/api/auth/register`
5. Login to get JWT token
6. Create patient and session via API
7. Connect WebSocket client and join session room
8. Send transcript chunks to `/api/sessions/{id}/transcript`
9. Observe real-time graph updates via WebSocket

## Troubleshooting

**"Client hasn't been generated yet"**
→ Run `python -m prisma generate`

**"SettingsError: ALLOWED_ORIGINS"**
→ Ensure `.env` value is valid JSON: `["http://localhost:3000"]`

**"email-validator is not installed"**
→ Run `pip install pydantic[email]`

**"bad interpreter" when running uvicorn directly**
→ Use `python -m uvicorn ...` inside activated venv

**WebSocket not connecting**
→ Check CORS origins match client URL

**Graph not updating**
→ Verify client joined session room via `join_session` event
