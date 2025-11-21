# Dimini Backend

AI-powered therapy visualization platform backend using FastAPI, Prisma, and Socket.io.

## Features

- **Real-time Graph Visualization**: WebSocket-based updates for live semantic graph rendering
- **AI Entity Extraction**: GPT-4 powered extraction of topics and emotions from therapy transcripts
- **Semantic Linking**: OpenAI embeddings for calculating relationships between concepts
- **JWT Authentication**: Secure authentication with token versioning
- **RESTful API**: Comprehensive API for patient and session management
- **Prisma ORM**: Type-safe database access with PostgreSQL

## Tech Stack

- FastAPI (Python web framework)
- Prisma (ORM)
- PostgreSQL (Database)
- Socket.io (Real-time communication)
- OpenAI API (GPT-4 & Embeddings)
- JWT (Authentication)

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL
- OpenAI API Key

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize Prisma:
```bash
cd backend
prisma generate
prisma db push
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## WebSocket Events

### Client → Server Events

- `connect`: Initial connection
- `join_session`: Join a therapy session room
  - Data: `{ session_id: string }`
- `leave_session`: Leave a session room
  - Data: `{ session_id: string }`

### Server → Client Events

- `connected`: Confirmation of connection
- `joined_session`: Confirmation of joining session
- `graph_update`: Real-time graph updates
  - Types: `node_added`, `edge_added`, `batch_update`
- `session_update`: Session status changes
- `processing_update`: Processing status notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new therapist
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/{id}` - Get patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions/start` - Start session
- `POST /api/sessions/{id}/transcript` - Update transcript (called by voice agent)
- `POST /api/sessions/{id}/end` - End session
- `GET /api/sessions/{id}/graph` - Get session graph

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dimini_db

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# AI Settings
SIMILARITY_THRESHOLD=0.75
EXTRACTION_INTERVAL=30
GPT_MODEL=gpt-4-0125-preview
EMBEDDING_MODEL=text-embedding-3-small
```

## Development

### Project Structure

```
backend/
├── app/
│   ├── api/            # REST API endpoints
│   ├── models/         # Pydantic models
│   ├── services/       # Business logic
│   ├── websocket/      # WebSocket handlers
│   ├── utils/          # Utility functions
│   ├── config.py       # Configuration
│   ├── database.py     # Database connection
│   └── main.py         # Application entry point
├── prisma/
│   └── schema.prisma   # Database schema
├── tests/              # Unit tests
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens include version tracking for invalidation
- Failed login attempts are tracked with account lockout
- All patient data access is scoped to authenticated therapist
- Audit logging for compliance

## License

Proprietary - All rights reserved
