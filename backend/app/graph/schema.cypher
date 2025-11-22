// ============================================
// DIMINI - Neo4j Graph Schema
// ============================================
// AI-Powered Therapy Knowledge Graph
// Entity nodes: Topics and Emotions
// Relationships: Semantic similarity edges
// ============================================

// ============================================
// NODE CONSTRAINTS
// ============================================

// Entity nodes must have unique (session_id, node_id) combination
// This ensures we don't duplicate entities within the same session
CREATE CONSTRAINT entity_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE (e.session_id, e.node_id) IS UNIQUE;

// ============================================
// INDEXES
// ============================================

// Index on session_id for fast lookup of all entities in a session
CREATE INDEX entity_session IF NOT EXISTS
FOR (e:Entity) ON (e.session_id);

// Index on node_type for filtering by TOPIC vs EMOTION
CREATE INDEX entity_type IF NOT EXISTS
FOR (e:Entity) ON (e.node_type);

// Index on metrics_updated_at for tracking freshness
CREATE INDEX entity_metrics_updated IF NOT EXISTS
FOR (e:Entity) ON (e.metrics_updated_at);

// Index on similarity_score for finding high-similarity edges
CREATE INDEX similar_score IF NOT EXISTS
FOR ()-[r:SIMILAR_TO]-() ON (r.similarity_score);

// ============================================
// ENTITY NODE SCHEMA (Documentation)
// ============================================
//
// Node Label: Entity
//
// Properties:
// - session_id: STRING (required) - Link to PostgreSQL Session.id
// - node_id: STRING (required) - Normalized ID: "anxiety", "work_stress"
// - node_type: STRING (required) - "TOPIC" or "EMOTION"
// - label: STRING (required) - Display label: "Anxiety", "Work Stress"
// - embedding: LIST<FLOAT> (required) - OpenAI 1536-dimensional vector
// - mention_count: INT (default: 1) - How many times mentioned
// - first_mentioned_at: DATETIME (required) - Timestamp of first mention
// - created_at: DATETIME (required) - Node creation timestamp
// - context: STRING (optional) - Brief context of how entity was mentioned
//
// METRICS (computed by algorithms):
// - weighted_degree: FLOAT (default: 0.0) - Tier 1: Sum of similarity scores
// - pagerank: FLOAT (default: 0.15) - Tier 2: PageRank centrality score
// - betweenness: FLOAT (default: 0.0) - Tier 3: Betweenness centrality
// - metrics_updated_at: DATETIME - Last time metrics were computed
//
// Example:
// (:Entity {
//   session_id: "cljk1234567890",
//   node_id: "anxiety",
//   node_type: "EMOTION",
//   label: "Anxiety",
//   embedding: [0.123, -0.456, ...],
//   mention_count: 3,
//   first_mentioned_at: datetime("2025-11-22T10:30:00Z"),
//   created_at: datetime("2025-11-22T10:30:00Z"),
//   context: "Patient mentioned feeling anxious about work deadlines",
//   weighted_degree: 2.45,
//   pagerank: 0.28,
//   betweenness: 0.12,
//   metrics_updated_at: datetime("2025-11-22T10:31:00Z")
// })

// ============================================
// SIMILAR_TO RELATIONSHIP SCHEMA (Documentation)
// ============================================
//
// Relationship Type: SIMILAR_TO
// Direction: Undirected (can traverse both ways)
//
// Properties:
// - similarity_score: FLOAT (required) - Cosine similarity (0.75 to 1.0)
// - created_at: DATETIME (required) - Relationship creation timestamp
//
// Example:
// (:Entity {node_id: "anxiety"})-[:SIMILAR_TO {
//   similarity_score: 0.89,
//   created_at: datetime("2025-11-22T10:30:00Z")
// }]-(:Entity {node_id: "stress"})

// ============================================
// INITIALIZATION VERIFICATION
// ============================================

// Return schema info to verify setup
SHOW INDEXES;
