import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.services.entity_extractor import EntityExtractor
from app.services.semantic_linker import SemanticLinker
from app.graph.neo4j_client import neo4j_client
from app.models.graph import (
    FrontendGraphData, FrontendNode, FrontendEdge, NodeType
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
        Main processing pipeline (Neo4j):
        1. Extract entities from transcript (GPT-4)
        2. Generate embeddings for new entities
        3. Calculate similarity with existing entities
        4. Insert nodes and edges into Neo4j
        5. Update Tier 1 metrics (weighted degree)
        6. Batch broadcast updates via WebSocket

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

            # Step 1: Extract entities (GPT-4)
            extraction_result = await self.extractor.extract(transcript_chunk)
            entities = extraction_result.entities

            if not entities:
                return ProcessingResult(
                    nodes_added=[],
                    edges_added=[],
                    status="no_entities_found"
                )

            logger.info(f"Extracted {len(entities)} entities from transcript chunk")

            # Step 2: Get existing nodes from Neo4j
            existing_nodes = neo4j_client.get_session_entities(session_id)

            # Convert to format compatible with semantic linker
            existing_node_data = []
            for node in existing_nodes:
                node_dict = {
                    "node_id": node['node_id'],
                    "embedding": node['embedding']
                }
                existing_node_data.append(node_dict)

            # Broadcast embedding generation start
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "embedding", "Generating semantic embeddings..."
                )

            # Step 3A: Generate ALL embeddings in single batch call (5x faster!)
            entity_labels = [entity.label for entity in entities]
            embeddings_batch = await self.linker.get_embeddings_batch(entity_labels)

            # Step 3B: Create ALL nodes first (no edge creation yet)
            new_nodes_data = []
            for entity in entities:
                # Get embedding from batch results
                embedding = embeddings_batch.get(entity.label)

                if not embedding:
                    logger.warning(f"Failed to generate embedding for: {entity.label}")
                    continue

                # Create node in Neo4j (or update if exists via MERGE)
                node = neo4j_client.create_or_update_entity(
                    session_id=session_id,
                    node_id=entity.node_id,
                    node_type=entity.node_type.value,
                    label=entity.label,
                    embedding=embedding,
                    context=entity.context
                )

                nodes_added.append({
                    'node_id': entity.node_id,
                    'label': entity.label,
                    'type': entity.node_type.value.lower(),
                    'mention_count': 1,
                    'weighted_degree': 0.0,
                    'pagerank': 0.15,
                    'betweenness': 0.0
                })

                # Collect new node data for similarity calculation
                new_nodes_data.append({
                    "node_id": entity.node_id,
                    "embedding": embedding
                })

            # Step 4: Calculate ALL similarities (new nodes + existing nodes)
            if self.realtime_service:
                await self.realtime_service.broadcast_processing_status(
                    session_id, "linking", "Calculating semantic connections..."
                )

            # Combine new and existing nodes for all-pairs comparison
            all_nodes = existing_node_data + new_nodes_data
            logger.info(f"[EDGE-DEBUG] Calculating similarities for {len(all_nodes)} total nodes ({len(new_nodes_data)} new, {len(existing_node_data)} existing)")

            # Use calculate_all_similarities() for ALL pairs
            similarities = await self.linker.calculate_all_similarities(all_nodes)
            logger.info(f"[EDGE-DEBUG] Found {len(similarities)} edges above threshold {self.linker.threshold}")

            # Step 5: Create edges in Neo4j for all similarities
            for source_id, target_id, similarity_score in similarities:
                # Create edge (Neo4j MERGE handles deduplication)
                edge = neo4j_client.create_similarity_edge(
                    session_id=session_id,
                    source_id=source_id,
                    target_id=target_id,
                    similarity_score=similarity_score
                )

                edges_added.append({
                    'source': source_id,
                    'target': target_id,
                    'similarity': similarity_score
                })

                # Step 6: Update Tier 1 metrics (weighted degree) for BOTH nodes
                neo4j_client.update_weighted_degree(session_id, source_id)
                neo4j_client.update_weighted_degree(session_id, target_id)

            # BATCH BROADCAST: Send all updates in single WebSocket message
            # This prevents frontend from re-rendering 50+ times
            if self.realtime_service and (nodes_added or edges_added):
                await self.realtime_service.broadcast_graph_batch_update(
                    session_id,
                    nodes=nodes_added,
                    edges=edges_added,
                    status="completed",
                    message=f"Added {len(nodes_added)} entities, {len(edges_added)} connections"
                )

            # Debug logging for edge verification
            logger.info(f"✅ Created {len(edges_added)} edges for session {session_id}")
            if edges_added:
                logger.info(f"Edge details: {edges_added}")

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
    Get the complete graph data for a session from Neo4j.

    Returns frontend-compatible format with all metrics.

    Args:
        session_id: Session ID

    Returns:
        FrontendGraphData with nodes and edges
    """
    # Fetch nodes from Neo4j
    logger.info(f"[KG-DEBUG] Fetching graph data for session_id: {session_id}")
    entities = neo4j_client.get_session_entities(session_id)
    logger.info(f"[KG-DEBUG] Found {len(entities)} entities in Neo4j for session {session_id}")

    # Fetch edges from Neo4j
    edges_query = """
    MATCH (source:Entity {session_id: $session_id})-[r:SIMILAR_TO]-(target:Entity)
    RETURN source.node_id AS source,
           target.node_id AS target,
           r.similarity_score AS similarity
    """
    edges = neo4j_client.execute_query(edges_query, {"session_id": session_id})

    # Convert to frontend format
    frontend_nodes = [
        FrontendNode(
            id=node['node_id'],
            label=node['label'],
            type=node['node_type'].lower(),
            group=1 if node['node_type'] == "EMOTION" else 2
        )
        for node in entities
    ]

    frontend_edges = [
        FrontendEdge(
            source=edge['source'],
            target=edge['target'],
            value=edge['similarity']
        )
        for edge in edges
    ]

    return FrontendGraphData(
        nodes=frontend_nodes,
        links=frontend_edges
    )
