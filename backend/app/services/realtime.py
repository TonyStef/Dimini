import logging
from typing import Dict, Any, List
from app.models.graph import FrontendNode, FrontendEdge, GraphNodeResponse, GraphEdgeResponse

logger = logging.getLogger(__name__)

class RealtimeService:
    """Service for handling real-time graph updates"""
    
    def __init__(self, sio):
        self.sio = sio
        
    async def broadcast_node_added(self, session_id: str, node: GraphNodeResponse):
        """Broadcast when a new node is added to the graph"""
        room = f"session_{session_id}"
        
        # Convert to frontend format
        frontend_node = FrontendNode(
            id=node.node_id,
            label=node.label,
            type=node.node_type.lower(),
            group=1 if node.node_type == "EMOTION" else 2
        )
        
        event_data = {
            "type": "node_added",
            "data": frontend_node.model_dump()
        }
        
        await self.sio.emit("graph_update", event_data, room=room)
        logger.info(f"Broadcasted node_added event for session {session_id}: {node.node_id}")
        
    async def broadcast_edge_added(self, session_id: str, edge: GraphEdgeResponse):
        """Broadcast when a new edge is added to the graph"""
        room = f"session_{session_id}"
        
        # Convert to frontend format
        frontend_edge = FrontendEdge(
            source=edge.source_node_id,
            target=edge.target_node_id,
            value=edge.similarity_score
        )
        
        event_data = {
            "type": "edge_added",
            "data": frontend_edge.model_dump()
        }
        
        await self.sio.emit("graph_update", event_data, room=room)
        logger.info(f"Broadcasted edge_added event for session {session_id}: {edge.source_node_id} -> {edge.target_node_id}")
        
    async def broadcast_batch_update(self, session_id: str, nodes: List[GraphNodeResponse], edges: List[GraphEdgeResponse]):
        """Broadcast multiple nodes and edges at once (legacy - Pydantic models)"""
        room = f"session_{session_id}"

        # Convert to frontend format
        frontend_nodes = [
            FrontendNode(
                id=node.node_id,
                label=node.label,
                type=node.node_type.lower(),
                group=1 if node.node_type == "EMOTION" else 2
            ).model_dump()
            for node in nodes
        ]

        frontend_edges = [
            FrontendEdge(
                source=edge.source_node_id,
                target=edge.target_node_id,
                value=edge.similarity_score
            ).model_dump()
            for edge in edges
        ]

        event_data = {
            "type": "batch_update",
            "data": {
                "nodes": frontend_nodes,
                "edges": frontend_edges
            }
        }

        await self.sio.emit("graph_update", event_data, room=room)
        logger.info(f"Broadcasted batch_update event for session {session_id}: {len(nodes)} nodes, {len(edges)} edges")

    async def broadcast_graph_batch_update(
        self,
        session_id: str,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        status: str = "completed",
        message: str = None
    ):
        """
        Broadcast batch graph update with raw dict format (Neo4j optimized).

        Prevents frontend from re-rendering 50+ times by sending all updates
        in a single WebSocket message.

        Args:
            session_id: Session ID
            nodes: List of node dicts with keys: node_id, label, type, mention_count,
                   weighted_degree, pagerank, betweenness
            edges: List of edge dicts with keys: source, target, similarity
            status: Update status (e.g., "completed", "processing")
            message: Status message for frontend display
        """
        room = f"session_{session_id}"

        event_data = {
            "nodes": nodes,
            "edges": edges,
            "status": status,
            "message": message
        }

        await self.sio.emit("graph_batch_update", event_data, room=room)
        logger.info(
            f"Broadcasted graph_batch_update for session {session_id}: "
            f"{len(nodes)} nodes, {len(edges)} edges - {status}"
        )
        
    async def broadcast_session_status(self, session_id: str, status: str):
        """Broadcast session status change"""
        room = f"session_{session_id}"
        
        event_data = {
            "type": "session_status",
            "data": {
                "status": status
            }
        }
        
        await self.sio.emit("session_update", event_data, room=room)
        logger.info(f"Broadcasted session_status event for session {session_id}: {status}")
        
    async def broadcast_processing_status(self, session_id: str, status: str, message: str = None):
        """Broadcast processing status (e.g., extracting entities, calculating similarity)"""
        room = f"session_{session_id}"
        
        event_data = {
            "type": "processing_status",
            "data": {
                "status": status,
                "message": message
            }
        }
        
        await self.sio.emit("processing_update", event_data, room=room)
        logger.info(f"Broadcasted processing_status event for session {session_id}: {status}")
