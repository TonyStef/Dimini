"""
Tool KG Integration Service

Integrates tool call data into Neo4j Knowledge Graph.
Extracts entities from tool call text and creates KG nodes/edges.

Strategy:
- Tool handlers save to PostgreSQL first
- Then call this service to extract entities and update KG
- Async processing to avoid blocking tool response
"""

from typing import Dict, List
import logging
from app.services.entity_extractor import EntityExtractor
from app.services.semantic_linker import SemanticLinker
from app.graph.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)


class ToolKGIntegration:
    """
    Integrate tool call data into Knowledge Graph.

    Extracts entities from tool call text and creates KG nodes/edges.
    """

    def __init__(self):
        self.extractor = EntityExtractor()
        self.linker = SemanticLinker()

    async def process_note_for_kg(
        self,
        session_id: str,
        note_content: str,
        category: str
    ):
        """
        Extract entities from session note and add to KG.

        Args:
            session_id: Session UUID
            note_content: Note text content
            category: "insight", "observation", "concern", "progress"
        """
        try:
            logger.info(f"[KG-DEBUG] Processing note for KG: {category}, session_id: {session_id}")

            # Extract entities from note text
            extraction_result = await self.extractor.extract(note_content)
            entities = extraction_result.entities

            if not entities:
                logger.info("No entities extracted from note")
                return

            logger.info(f"Extracted {len(entities)} entities from note")

            # Get existing nodes from Neo4j
            existing_nodes = neo4j_client.get_session_entities(session_id)
            existing_node_data = [
                {"node_id": n['node_id'], "embedding": n['embedding']}
                for n in existing_nodes
            ]

            # Process each entity
            for entity in entities:
                # Generate embedding
                embedding = await self.linker.get_embedding(entity.label)
                if not embedding:
                    logger.warning(f"Failed to generate embedding for: {entity.label}")
                    continue

                # Create/update node in Neo4j
                neo4j_client.create_or_update_entity(
                    session_id=session_id,
                    node_id=entity.node_id,
                    node_type=entity.node_type.value,
                    label=entity.label,
                    embedding=embedding,
                    context=f"From {category} note: {note_content[:100]}"
                )

                # Find similar nodes
                node_data = {"node_id": entity.node_id, "embedding": embedding}
                related = await self.linker.find_related_nodes(
                    node_data,
                    existing_node_data
                )

                # Create edges
                for related_id, score in related:
                    neo4j_client.create_similarity_edge(
                        session_id=session_id,
                        source_id=entity.node_id,
                        target_id=related_id,
                        similarity_score=score
                    )

                    # Update Tier 1 metrics (weighted degree)
                    neo4j_client.update_weighted_degree(session_id, entity.node_id)
                    neo4j_client.update_weighted_degree(session_id, related_id)

                # Add to existing for next iteration
                existing_node_data.append(node_data)

            logger.info(f"KG updated: {len(entities)} entities from note")

            # Verify entities were stored in Neo4j
            verify_query = """
            MATCH (e:Entity {session_id: $session_id})
            RETURN count(e) AS entity_count
            """
            verify_result = neo4j_client.execute_query(verify_query, {"session_id": session_id})
            verified_count = verify_result[0]['entity_count'] if verify_result else 0
            logger.info(f"[KG-DEBUG] Verified {verified_count} entities in Neo4j for session {session_id}")

        except Exception as e:
            logger.error(f"Error processing note for KG: {e}", exc_info=True)

    async def process_concern_for_kg(
        self,
        session_id: str,
        concern_type: str,
        severity: str,
        description: str
    ):
        """
        Create EMOTION node for concern with severity.

        Concerns often indicate emotions - create EMOTION nodes.
        """
        try:
            logger.info(f"Processing concern for KG: {concern_type} ({severity})")

            # Map concern_type to emotion label
            emotion_map = {
                "emotional_distress": "Distress",
                "risk_behavior": "Fear",
                "deterioration": "Sadness",
                "crisis_indicator": "Panic"
            }

            emotion_label = emotion_map.get(concern_type, concern_type.replace("_", " ").title())
            node_id = f"concern_{concern_type}"

            # Generate embedding
            embedding = await self.linker.get_embedding(emotion_label)
            if not embedding:
                logger.warning(f"Failed to generate embedding for emotion: {emotion_label}")
                return

            # Create EMOTION node with severity in context
            neo4j_client.create_or_update_entity(
                session_id=session_id,
                node_id=node_id,
                node_type="EMOTION",
                label=emotion_label,
                embedding=embedding,
                context=f"Flagged concern: {severity} severity - {description[:100]}"
            )

            # Link to existing emotions/topics
            existing_nodes = neo4j_client.get_session_entities(session_id)
            existing_data = [
                {"node_id": n['node_id'], "embedding": n['embedding']}
                for n in existing_nodes
            ]

            node_data = {"node_id": node_id, "embedding": embedding}
            related = await self.linker.find_related_nodes(node_data, existing_data)

            for related_id, score in related:
                neo4j_client.create_similarity_edge(
                    session_id=session_id,
                    source_id=node_id,
                    target_id=related_id,
                    similarity_score=score
                )

                neo4j_client.update_weighted_degree(session_id, node_id)
                neo4j_client.update_weighted_degree(session_id, related_id)

            logger.info(f"KG updated: concern emotion '{emotion_label}' added")

        except Exception as e:
            logger.error(f"Error processing concern for KG: {e}", exc_info=True)

    async def process_progress_for_kg(
        self,
        session_id: str,
        progress_type: str,
        description: str
    ):
        """
        Create TOPIC node for progress milestone.

        Progress indicates topics - create TOPIC nodes.
        """
        try:
            logger.info(f"Processing progress for KG: {progress_type}")

            # Map progress_type to topic label
            topic_map = {
                "emotional_regulation": "Emotional Control",
                "insight_gained": "Self-Awareness",
                "behavioral_change": "Behavior Change",
                "coping_skill": "Coping Strategies"
            }

            topic_label = topic_map.get(progress_type, progress_type.replace("_", " ").title())
            node_id = f"progress_{progress_type}"

            # Generate embedding
            embedding = await self.linker.get_embedding(topic_label)
            if not embedding:
                logger.warning(f"Failed to generate embedding for topic: {topic_label}")
                return

            # Create TOPIC node
            neo4j_client.create_or_update_entity(
                session_id=session_id,
                node_id=node_id,
                node_type="TOPIC",
                label=topic_label,
                embedding=embedding,
                context=f"Progress milestone: {description[:100]}"
            )

            # Link to existing
            existing_nodes = neo4j_client.get_session_entities(session_id)
            existing_data = [
                {"node_id": n['node_id'], "embedding": n['embedding']}
                for n in existing_nodes
            ]

            node_data = {"node_id": node_id, "embedding": embedding}
            related = await self.linker.find_related_nodes(node_data, existing_data)

            for related_id, score in related:
                neo4j_client.create_similarity_edge(
                    session_id=session_id,
                    source_id=node_id,
                    target_id=related_id,
                    similarity_score=score
                )

                neo4j_client.update_weighted_degree(session_id, node_id)
                neo4j_client.update_weighted_degree(session_id, related_id)

            logger.info(f"KG updated: progress topic '{topic_label}' added")

        except Exception as e:
            logger.error(f"Error processing progress for KG: {e}", exc_info=True)
