from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import socketio
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import connect_db, disconnect_db, prisma
from app.websocket.handlers import WebSocketManager
from app.services.realtime import RealtimeService
from app.graph.neo4j_client import neo4j_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.ALLOWED_ORIGINS
)

# Create managers and services
websocket_manager = WebSocketManager()
realtime_service = RealtimeService(sio)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    await connect_db()  # PostgreSQL
    neo4j_client.connect()  # Neo4j
    logger.info("Dimini API started (PostgreSQL + Neo4j)")

    yield

    # Shutdown
    await disconnect_db()  # PostgreSQL
    neo4j_client.close()  # Neo4j
    logger.info("Dimini API shutdown")

# Create FastAPI app
app = FastAPI(
    title="Dimini API",
    description="AI-Powered Therapy Visualization Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

# Import and include routers
from app.api import auth, patients, sessions, webhooks, hume
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(webhooks.router)  # No /api prefix - external webhooks go directly to /webhooks/*
app.include_router(hume.router, tags=["Hume AI"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Dimini API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected" if prisma.is_connected() else "disconnected"
    }

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    await websocket_manager.connect(sid)
    await sio.emit('connected', {'message': 'Connected to Dimini server'}, room=sid)

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    await websocket_manager.disconnect(sid)

@sio.event
async def join_session(sid, data):
    """Join a therapy session room for real-time updates"""
    session_id = data.get('session_id')
    if not session_id:
        await sio.emit('error', {'message': 'session_id is required'}, room=sid)
        return
        
    success = await websocket_manager.join_session(sid, session_id)
    if success:
        await sio.enter_room(sid, f"session_{session_id}")
        await sio.emit('joined_session', {'session_id': session_id}, room=sid)
        
        # Send current graph state
        try:
            from app.services.graph_builder import get_session_graph_data
            graph_data = await get_session_graph_data(session_id)
            await sio.emit('graph_state', graph_data.model_dump(), room=sid)
        except Exception as e:
            logger.error(f"Error sending graph state: {e}")
    else:
        await sio.emit('error', {'message': 'Failed to join session'}, room=sid)

@sio.event
async def leave_session(sid, data):
    """Leave a therapy session room"""
    session_id = data.get('session_id')
    if session_id:
        await websocket_manager.leave_session(sid, session_id)
        await sio.leave_room(sid, f"session_{session_id}")
        await sio.emit('left_session', {'session_id': session_id}, room=sid)

# Export the socket app for uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:socket_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
