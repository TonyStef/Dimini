"""
Neo4j Client - Therapy Session Knowledge Graph Database

Handles all Neo4j operations for the Dimini therapy platform:
- Entity node creation and updates (topics, emotions)
- Similarity edge creation
- Graph metrics calculation (Tier 1: Weighted Degree)
- Session graph retrieval

Database Separation:
- PostgreSQL (Prisma): Users, Patients, Sessions (metadata), Tool calls
- Neo4j: Entity nodes, Similarity edges, Graph algorithms
"""

from neo4j import GraphDatabase, Driver
from typing import List, Dict, Optional, Tuple
import os
import logging

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Neo4j database client for therapy session knowledge graphs"""

    def __init__(self, uri: str = None, user: str = None, password: str = None):
        """
        Initialize Neo4j client with connection parameters.

        Args:
            uri: Neo4j connection URI (default: from NEO4J_URI env var)
            user: Neo4j username (default: from NEO4J_USER env var)
            password: Neo4j password (default: from NEO4J_PASSWORD env var)
        """
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "diminipassword")

        self._driver: Optional[Driver] = None

    def connect(self):
        """
        Initialize Neo4j driver connection.

        Raises:
            Exception: If connection fails
        """
        try:
            self._driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_lifetime=3600,  # 1 hour
                max_connection_pool_size=50,
                connection_acquisition_timeout=30
            )
            # Verify connectivity
            self._driver.verify_connectivity()
            logger.info(f"Neo4j connection established: {self.uri}")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        """Close Neo4j driver connection"""
        if self._driver:
            self._driver.close()
            logger.info("Neo4j connection closed")

    def execute_query(self, query: str, parameters: Dict = None) -> List[Dict]:
        """
        Execute Cypher query and return results.

        Args:
            query: Cypher query string
            parameters: Query parameters dictionary

        Returns:
            List of result dictionaries
        """
        with self._driver.session() as session:
            result = session.run(query, parameters or {})
            return [dict(record) for record in result]

    def execute_write(self, query: str, parameters: Dict = None):
        """
        Execute write transaction.

        Args:
            query: Cypher query string
            parameters: Query parameters dictionary

        Returns:
            Query result data
        """
        with self._driver.session() as session:
            return session.execute_write(
                lambda tx: tx.run(query, parameters or {}).data()
            )

    # ============================================
    # NODE OPERATIONS
    # ============================================

    def create_or_update_entity(
        self,
        session_id: str,
        node_id: str,
        node_type: str,
        label: str,
        embedding: List[float],
        context: str = None
    ) -> Dict:
        """
        Create entity node or update mention_count if exists.

        Uses MERGE to handle deduplication: if entity already exists,
        increments mention_count; otherwise creates new node.

        Args:
            session_id: UUID of therapy session
            node_id: Normalized entity ID ("anxiety", "work_stress")
            node_type: "TOPIC" or "EMOTION"
            label: Display label ("Anxiety", "Work Stress")
            embedding: OpenAI 1536-dimensional vector
            context: Optional context snippet

        Returns:
            Created/updated entity node data

        Raises:
            ValueError: If embedding dimension != 1536
        """
        # Validate embedding dimension (OpenAI text-embedding-3-small = 1536)
        if len(embedding) != 1536:
            raise ValueError(
                f"Invalid embedding dimension: {len(embedding)} (expected 1536)"
            )

        query = """
        MERGE (e:Entity {session_id: $session_id, node_id: $node_id})
        ON CREATE SET
            e.node_type = $node_type,
            e.label = $label,
            e.embedding = $embedding,
            e.mention_count = 1,
            e.first_mentioned_at = datetime(),
            e.created_at = datetime(),
            e.context = $context,
            e.weighted_degree = 0.0,
            e.pagerank = 0.15,
            e.betweenness = 0.0,
            e.metrics_updated_at = datetime()
        ON MATCH SET
            e.mention_count = e.mention_count + 1
        RETURN e
        """

        result = self.execute_write(query, {
            "session_id": session_id,
            "node_id": node_id,
            "node_type": node_type,
            "label": label,
            "embedding": embedding,
            "context": context
        })

        return result[0] if result else None

    def create_similarity_edge(
        self,
        session_id: str,
        source_id: str,
        target_id: str,
        similarity_score: float
    ) -> Dict:
        """
        Create SIMILAR_TO relationship between entities.

        Args:
            session_id: UUID of therapy session
            source_id: Source entity node_id
            target_id: Target entity node_id
            similarity_score: Cosine similarity (0.75 to 1.0)

        Returns:
            Created relationship data
        """
        query = """
        MATCH (source:Entity {session_id: $session_id, node_id: $source_id})
        MATCH (target:Entity {session_id: $session_id, node_id: $target_id})
        MERGE (source)-[r:SIMILAR_TO]-(target)
        ON CREATE SET
            r.similarity_score = $similarity_score,
            r.created_at = datetime()
        RETURN r
        """

        result = self.execute_write(query, {
            "session_id": session_id,
            "source_id": source_id,
            "target_id": target_id,
            "similarity_score": similarity_score
        })

        return result[0] if result else None

    def get_session_entities(self, session_id: str) -> List[Dict]:
        """
        Get all entities for a session with their metrics.

        Returns entities sorted by PageRank (most important first).

        Args:
            session_id: UUID of therapy session

        Returns:
            List of entity dictionaries with all properties and metrics
        """
        query = """
        MATCH (e:Entity {session_id: $session_id})
        RETURN e.node_id AS node_id,
               e.node_type AS node_type,
               e.label AS label,
               e.embedding AS embedding,
               e.mention_count AS mention_count,
               e.weighted_degree AS weighted_degree,
               e.pagerank AS pagerank,
               e.betweenness AS betweenness
        ORDER BY e.pagerank DESC
        """

        return self.execute_query(query, {"session_id": session_id})

    def get_entity_by_id(self, session_id: str, node_id: str) -> Optional[Dict]:
        """
        Get specific entity by ID.

        Args:
            session_id: UUID of therapy session
            node_id: Entity identifier

        Returns:
            Entity data dictionary or None if not found
        """
        query = """
        MATCH (e:Entity {session_id: $session_id, node_id: $node_id})
        RETURN e
        """

        results = self.execute_query(query, {
            "session_id": session_id,
            "node_id": node_id
        })

        return results[0] if results else None

    # ============================================
    # TIER 1: WEIGHTED DEGREE (INSTANT <5ms)
    # ============================================

    def update_weighted_degree(self, session_id: str, node_id: str) -> float:
        """
        Calculate and update weighted degree for a node.

        Weighted Degree = sum of all similarity scores from connected edges
        This is the fastest metric (< 5ms) and updates immediately after
        each edge creation.

        Args:
            session_id: UUID of therapy session
            node_id: Entity identifier

        Returns:
            Calculated weighted degree value
        """
        query = """
        MATCH (e:Entity {session_id: $session_id, node_id: $node_id})
        OPTIONAL MATCH (e)-[r:SIMILAR_TO]-()
        WITH e, sum(r.similarity_score) AS weighted_degree
        SET e.weighted_degree = coalesce(weighted_degree, 0.0),
            e.metrics_updated_at = datetime()
        RETURN e.weighted_degree AS weighted_degree
        """

        result = self.execute_write(query, {
            "session_id": session_id,
            "node_id": node_id
        })

        return result[0]['weighted_degree'] if result else 0.0

    def batch_update_weighted_degree(self, session_id: str) -> int:
        """
        Update weighted degree for all nodes in session.

        Useful for bulk operations. Normally, weighted degree is updated
        immediately after edge creation for affected nodes.

        Args:
            session_id: UUID of therapy session

        Returns:
            Number of nodes updated
        """
        query = """
        MATCH (e:Entity {session_id: $session_id})
        OPTIONAL MATCH (e)-[r:SIMILAR_TO]-()
        WITH e, sum(r.similarity_score) AS weighted_degree
        SET e.weighted_degree = coalesce(weighted_degree, 0.0),
            e.metrics_updated_at = datetime()
        RETURN count(e) AS updated_count
        """

        result = self.execute_write(query, {"session_id": session_id})
        return result[0]['updated_count'] if result else 0


# Singleton instance for application-wide use
neo4j_client = Neo4jClient()
