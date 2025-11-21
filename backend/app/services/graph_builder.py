import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.services.entity_extractor import EntityExtractor
from app.services.semantic_linker import SemanticLinker
from app.database import db
from app.models.graph import (
    GraphNodeResponse, GraphEdgeResponse, FrontendGraphData,
    FrontendNode, FrontendEdge, NodeType
)
from app.models.session import ProcessingResult

logger = logging.getLogger(__name__)

class GraphBuilder:
    """Orchestrate entity extraction, embedding generation, and graph construction"""
    
    def __init__(self, realtime_service=None):
        self.extractor = EntityExtractor()
        self.linker = SemanticLinker()
        self.realtime_service = realtime_service
        
    async def process_transcript_chunk(
        self,
        session_id: str,
        transcript_chunk: str
    ) -> ProcessingResult:
        """
        Main processing pipeline:
        1. Extract entities from transcript
        2. Generate embeddings for new entities
        3. Calculate similarity with existing entities
        4. Insert nodes and edges into database
        5. Broadcast updates via WebSocket
        
        Args:
            session_id: UUID of active session
            transcript_chunk: 30-second transcript segment
            
        Returns:
            ProcessingResult with nodes and edges added
        """
        nodes_added = []
        edges_added = []
        
        try:
            # Broadcast processing start
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "extracting", "Extracting entities from transcript..."
                )
            
            # Step 1: Extract entities
            extraction_result = await self.extractor.extract(transcript_chunk)
            entities = extraction_result.entities
            
            if not entities:
                return ProcessingResult(
                    nodes_added=[],
                    edges_added=[],
                    status="no_entities_found"
                )
                
            logger.info(f"Extracted {len(entities)} entities from transcript chunk")
            
            # Step 2: Get existing nodes from this session
            existing_nodes = await db.graphnode.find_many(
                where={"sessionId": session_id},
                include={"session": False}
            )
            
            # Convert Prisma models to dicts with embeddings
            existing_node_data = []
            for node in existing_nodes:
                node_dict = {
                    "node_id": node.nodeId,
                    "embedding": node.embedding if isinstance(node.embedding, list) else None
                }
                existing_node_data.append(node_dict)
                
            # Broadcast embedding generation start
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "embedding", "Generating semantic embeddings..."
                )
            
            # Step 3: Process each new entity
            for entity in entities:
                # Check if node already exists
                existing = await db.graphnode.find_first(
                    where={
                        "sessionId": session_id,
                        "nodeId": entity.node_id
                    }
                )
                
                if existing:
                    # Update mention count
                    updated = await db.graphnode.update(
                        where={"id": existing.id},
                        data={"mentionCount": existing.mentionCount + 1}
                    )
                    logger.info(f"Updated mention count for existing node: {entity.node_id}")
                    continue
                    
                # Generate embedding for new entity
                embedding = await self.linker.get_embedding(entity.label)
                
                if not embedding:
                    logger.warning(f"Failed to generate embedding for: {entity.label}")
                    continue
                    
                # Create node in database
                node = await db.graphnode.create(
                    data={
                        "sessionId": session_id,
                        "nodeId": entity.node_id,
                        "nodeType": entity.node_type.value,
                        "label": entity.label,
                        "embedding": embedding,
                        "properties": {"context": entity.context} if entity.context else {}
                    }
                )
                
                nodes_added.append(node.model_dump())
                
                # Broadcast node addition
                if self.realtime_service:
                    await self.realtime_service.broadcast_node_added(session_id, node)
                    
                # Step 4: Find related nodes (semantic similarity)
                if self.realtime_service:
                    await self.realtime_service.broadcast_processing_status(
                        session_id, "linking", f"Finding connections for '{entity.label}'..."
                    )
                    
                node_data = {"node_id": entity.node_id, "embedding": embedding}
                related_nodes = await self.linker.find_related_nodes(
                    node_data,
                    existing_node_data
                )
                
                # Step 5: Create edges
                for related_node_id, similarity_score in related_nodes:
                    # Check if edge already exists
                    edge_exists = await db.graphedge.find_first(
                        where={
                            "sessionId": session_id,
                            "OR": [
                                {
                                    "sourceNodeId": entity.node_id,
                                    "targetNodeId": related_node_id
                                },
                                {
                                    "sourceNodeId": related_node_id,
                                    "targetNodeId": entity.node_id
                                }
                            ]
                        }
                    )
                    
                    if not edge_exists:
                        edge = await db.graphedge.create(
                            data={
                                "sessionId": session_id,
                                "sourceNodeId": entity.node_id,
                                "targetNodeId": related_node_id,
                                "similarityScore": similarity_score
                            }
                        )
                        
                        edges_added.append(edge.model_dump())
                        
                        # Broadcast edge addition
                        if self.realtime_service:
                            await self.realtime_service.broadcast_edge_added(session_id, edge)
                            
                # Add new node to existing nodes for future comparisons
                existing_node_data.append(node_data)
                
            # Broadcast completion
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "completed", "Processing completed"
                )
                
            return ProcessingResult(
                nodes_added=nodes_added,
                edges_added=edges_added,
                status="success"
            )
            
        except Exception as e:
            logger.error(f"Error in graph building: {e}")
            
            # Broadcast error
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "error", f"Processing error: {str(e)}"
                )
                
            return ProcessingResult(
                nodes_added=nodes_added,
                edges_added=edges_added,
                status="error",
                error=str(e)
            )

async def get_session_graph_data(session_id: str) -> FrontendGraphData:
    """
    Get the complete graph data for a session in frontend format.
    
    Args:
        session_id: Session ID
        
    Returns:
        FrontendGraphData with nodes and edges
    """
    # Fetch nodes
    nodes = await db.graphnode.find_many(
        where={"sessionId": session_id},
        order={"createdAt": "asc"}
    )
    
    # Fetch edges
    edges = await db.graphedge.find_many(
        where={"sessionId": session_id},
        order={"createdAt": "asc"}
    )
    
    # Convert to frontend format
    frontend_nodes = [
        FrontendNode(
            id=node.nodeId,
            label=node.label,
            type=node.nodeType.lower(),
            group=1 if node.nodeType == "EMOTION" else 2
        )
        for node in nodes
    ]
    
    frontend_edges = [
        FrontendEdge(
            source=edge.sourceNodeId,
            target=edge.targetNodeId,
            value=edge.similarityScore
        )
        for edge in edges
    ]
    
    return FrontendGraphData(
        nodes=frontend_nodes,
        links=frontend_edges
    )
