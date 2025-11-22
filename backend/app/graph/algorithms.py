"""
Graph Algorithms - Multi-Tier Metrics System

Implements 3-tier graph algorithm stack for therapy session analysis:

Tier 1: Weighted Degree (INSTANT <5ms)
    - Implemented in neo4j_client.py
    - Updated immediately after edge creation
    - Sum of similarity scores from connected edges

Tier 2: PageRank with Seed (STREAMING MODE, 10s intervals)
    - Uses GDS streaming mode (no projection overhead)
    - First run: 20 iterations (2-5s)
    - Incremental: 5 iterations with seed (200-500ms)
    - Identifies core issues in session

Tier 3: Betweenness Centrality (STREAMING MODE, 60s intervals)
    - Uses GDS streaming mode
    - Identifies bridge topics connecting emotion clusters
    - Latency: 2-5s

Background Task Management:
    - Automatic start/stop with session lifecycle
    - Error recovery with exponential backoff
    - Graceful degradation on failures
"""

import asyncio
import logging
from typing import Dict, List
from app.graph.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)


class GraphAlgorithms:
    """Graph algorithms using Neo4j GDS (Graph Data Science)"""

    def __init__(self):
        self.active_sessions = set()  # Track sessions with background tasks

    # ============================================
    # TIER 2: PAGERANK WITH SEED (STREAMING MODE)
    # ============================================

    async def update_pagerank_streaming(self, session_id: str, is_first_run: bool = False):
        """
        Update PageRank using STREAMING mode (no projection needed).

        STREAMING MODE BENEFITS:
        - No projection creation/deletion overhead
        - Always queries current graph state (real-time)
        - Memory efficient (no duplicate graph in memory)
        - No race conditions from concurrent updates

        Args:
            session_id: Session to compute PageRank for
            is_first_run: If True, use 20 iterations; if False, use 5 (seed-based)

        Latency:
            - First run: ~2-5s (20 iterations, no seed)
            - Incremental: ~200-500ms (5 iterations, with seed)
        """
        iterations = 20 if is_first_run else 5
        logger.info(f"Running PageRank (streaming, {iterations} iter) for session {session_id}")

        # Stream PageRank computation directly from graph (no projection)
        pagerank_query = """
        CALL gds.pageRank.stream({
            nodeQuery: "MATCH (n:Entity {session_id: $session_id}) RETURN id(n) AS id",
            relationshipQuery: "
                MATCH (source:Entity {session_id: $session_id})-[r:SIMILAR_TO]-(target:Entity)
                RETURN id(source) AS source, id(target) AS target, r.similarity_score AS weight
            ",
            seedProperty: $seed_property,
            relationshipWeightProperty: 'weight',
            dampingFactor: 0.85,
            maxIterations: $max_iterations,
            tolerance: 0.0001
        })
        YIELD nodeId, score

        // Write scores back to nodes
        MATCH (e:Entity) WHERE id(e) = nodeId
        SET e.pagerank = score,
            e.metrics_updated_at = datetime()

        RETURN count(*) AS updated_count
        """

        result = neo4j_client.execute_write(pagerank_query, {
            "session_id": session_id,
            "seed_property": None if is_first_run else "pagerank",
            "max_iterations": iterations
        })

        logger.info(f"PageRank updated for {session_id}: {result[0]['updated_count']} nodes")
        return result[0]['updated_count'] if result else 0

    async def pagerank_background_task(self, session_id: str, interval: int = 10):
        """
        Background task to update PageRank every N seconds using streaming mode.

        Args:
            session_id: Session to monitor
            interval: Update interval in seconds (default: 10s)
        """
        self.active_sessions.add(session_id)
        logger.info(f"Starting PageRank background task for {session_id} (interval: {interval}s)")

        # First run (full computation)
        await self.update_pagerank_streaming(session_id, is_first_run=True)

        try:
            while session_id in self.active_sessions:
                await asyncio.sleep(interval)

                # Check if session still active
                if session_id not in self.active_sessions:
                    break

                # Run incremental update (seed-based, 5 iterations)
                await self.update_pagerank_streaming(session_id, is_first_run=False)

        except asyncio.CancelledError:
            logger.info(f"PageRank task cancelled for {session_id}")
        except Exception as e:
            logger.error(f"PageRank task error for {session_id}: {e}")
            # Retry logic (max 3 attempts with exponential backoff)
            for attempt in range(3):
                try:
                    await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s
                    await self.update_pagerank_streaming(session_id, is_first_run=False)
                    logger.info(f"PageRank recovered after {attempt + 1} retries")
                    break
                except Exception as retry_error:
                    logger.error(f"Retry {attempt + 1} failed: {retry_error}")
        finally:
            # Cleanup (no projection to drop in streaming mode)
            self.active_sessions.discard(session_id)
            logger.info(f"PageRank task stopped for {session_id}")

    # ============================================
    # TIER 3: BETWEENNESS CENTRALITY
    # ============================================

    async def update_betweenness_streaming(self, session_id: str):
        """
        Update betweenness centrality using STREAMING mode.

        Identifies "bridge" entities that connect different topic/emotion clusters.
        Latency: ~2-5s

        STREAMING MODE: Same benefits as PageRank (no projection overhead, real-time)
        """
        logger.info(f"Running Betweenness Centrality (streaming) for session {session_id}")

        # Stream betweenness computation directly from graph
        betweenness_query = """
        CALL gds.betweenness.stream({
            nodeQuery: "MATCH (n:Entity {session_id: $session_id}) RETURN id(n) AS id",
            relationshipQuery: "
                MATCH (source:Entity {session_id: $session_id})-[r:SIMILAR_TO]-(target:Entity)
                RETURN id(source) AS source, id(target) AS target
            "
        })
        YIELD nodeId, score

        // Write scores back to nodes
        MATCH (e:Entity) WHERE id(e) = nodeId
        SET e.betweenness = score,
            e.metrics_updated_at = datetime()

        RETURN count(*) AS updated_count
        """

        try:
            result = neo4j_client.execute_write(betweenness_query, {
                "session_id": session_id
            })
            logger.info(f"Betweenness updated for {session_id}: {result[0]['updated_count']} nodes")
            return result[0]['updated_count'] if result else 0
        except Exception as e:
            logger.error(f"Betweenness update failed for {session_id}: {e}")
            return 0

    async def betweenness_background_task(self, session_id: str, interval: int = 60):
        """
        Background task to update betweenness every N seconds using streaming mode.

        Args:
            session_id: Session to monitor
            interval: Update interval in seconds (default: 60s)
        """
        logger.info(f"Starting Betweenness background task for {session_id} (interval: {interval}s)")

        try:
            while session_id in self.active_sessions:
                await asyncio.sleep(interval)

                # Check if session still active
                if session_id not in self.active_sessions:
                    break

                # Run betweenness update (streaming mode)
                await self.update_betweenness_streaming(session_id)

        except asyncio.CancelledError:
            logger.info(f"Betweenness task cancelled for {session_id}")
        except Exception as e:
            logger.error(f"Betweenness task error for {session_id}: {e}")
            # Retry logic (max 3 attempts)
            for attempt in range(3):
                try:
                    await asyncio.sleep(5 * (attempt + 1))  # 5s, 10s, 15s
                    await self.update_betweenness_streaming(session_id)
                    logger.info(f"Betweenness recovered after {attempt + 1} retries")
                    break
                except Exception as retry_error:
                    logger.error(f"Retry {attempt + 1} failed: {retry_error}")

    # ============================================
    # TASK MANAGEMENT
    # ============================================

    def start_background_algorithms(self, session_id: str):
        """Start all background algorithm tasks for a session"""
        # Tier 2: PageRank (every 10s)
        asyncio.create_task(self.pagerank_background_task(session_id, interval=10))

        # Tier 3: Betweenness (every 60s)
        asyncio.create_task(self.betweenness_background_task(session_id, interval=60))

        logger.info(f"Background algorithms started for session {session_id}")

    def stop_background_algorithms(self, session_id: str):
        """Stop all background algorithm tasks for a session"""
        if session_id in self.active_sessions:
            self.active_sessions.remove(session_id)
            logger.info(f"Background algorithms stopped for session {session_id}")


# Singleton instance
graph_algorithms = GraphAlgorithms()
