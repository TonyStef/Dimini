import logging
from typing import Dict, Set
from app.database import db

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manage WebSocket connections and session subscriptions"""
    
    def __init__(self):
        # Track which sessions each client is subscribed to
        self.client_sessions: Dict[str, Set[str]] = {}
        # Track which clients are in each session
        self.session_clients: Dict[str, Set[str]] = {}
        
    async def connect(self, sid: str):
        """Handle new client connection"""
        self.client_sessions[sid] = set()
        logger.info(f"WebSocket client {sid} connected")
        
    async def disconnect(self, sid: str):
        """Handle client disconnection"""
        # Remove client from all sessions
        if sid in self.client_sessions:
            for session_id in self.client_sessions[sid]:
                if session_id in self.session_clients:
                    self.session_clients[session_id].discard(sid)
                    if not self.session_clients[session_id]:
                        del self.session_clients[session_id]
            del self.client_sessions[sid]
        logger.info(f"WebSocket client {sid} disconnected")
        
    async def join_session(self, sid: str, session_id: str) -> bool:
        """Add client to a session room"""
        # Verify session exists
        session = await db.session.find_unique(where={"id": session_id})
        if not session:
            logger.warning(f"Client {sid} tried to join non-existent session {session_id}")
            return False
            
        # Add to tracking
        if sid in self.client_sessions:
            self.client_sessions[sid].add(session_id)
        if session_id not in self.session_clients:
            self.session_clients[session_id] = set()
        self.session_clients[session_id].add(sid)
        
        logger.info(f"Client {sid} joined session {session_id}")
        return True
        
    async def leave_session(self, sid: str, session_id: str) -> bool:
        """Remove client from a session room"""
        if sid in self.client_sessions:
            self.client_sessions[sid].discard(session_id)
        if session_id in self.session_clients:
            self.session_clients[session_id].discard(sid)
            if not self.session_clients[session_id]:
                del self.session_clients[session_id]
                
        logger.info(f"Client {sid} left session {session_id}")
        return True
        
    def get_session_clients(self, session_id: str) -> Set[str]:
        """Get all clients subscribed to a session"""
        return self.session_clients.get(session_id, set())
        
    def get_client_sessions(self, sid: str) -> Set[str]:
        """Get all sessions a client is subscribed to"""
        return self.client_sessions.get(sid, set())
