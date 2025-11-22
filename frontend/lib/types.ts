// ========================================
// Authentication Types
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'THERAPIST' | 'ASSISTANT';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// ========================================
// Patient Types
// ========================================

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface PatientDemographics {
  age?: number;
  gender?: Gender;
  occupation?: string;
  referral_source?: string;
  initial_concerns?: string[];
}

export interface Patient {
  id: string;
  therapist_id: string;
  name: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  name: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
}

export interface PatientUpdate {
  name?: string;
  email?: string;
  phone?: string;
  demographics?: PatientDemographics;
}

export interface PatientStats {
  total_sessions: number;
  active_sessions: number;
  last_session_date?: string;
}

export interface PatientDetail extends Patient {
  stats: PatientStats;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  page_size: number;
}

// ========================================
// Session Types
// ========================================

export interface Session {
  id: string;
  patient_id: string;
  therapist_id?: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed' | 'cancelled';
  transcript?: string;
  summary?: Record<string, any>;
  created_at: string;
}

// ========================================
// Graph Types (Neo4j Knowledge Graph)
// ========================================

/**
 * Graph node with multi-tier metrics
 *
 * Metrics system:
 * - Weighted Degree: Instant (<5ms), sum of similarity scores
 * - PageRank: Core issues (10s updates), graph importance
 * - Betweenness: Emotional triggers (60s updates), bridge topics
 */
export interface GraphNode {
  id: string;  // node_id
  label: string;
  type: 'topic' | 'emotion';
  group: number;  // For coloring: 1 = emotion, 2 = topic

  // Multi-tier metrics (Neo4j)
  weightedDegree?: number;
  pagerank?: number;
  betweenness?: number;
  mentionCount?: number;

  // D3 Force Simulation properties (for react-force-graph-2d)
  x?: number;  // Position X
  y?: number;  // Position Y
  vx?: number;  // Velocity X
  vy?: number;  // Velocity Y
  fx?: number;  // Fixed position X (for pinning nodes)
  fy?: number;  // Fixed position Y (for pinning nodes)
}

export interface GraphEdge {
  source: string;  // node_id
  target: string;  // node_id
  value: number;  // similarity_score (for edge thickness)
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

/**
 * Multi-tier session insights from Neo4j graph algorithms
 */
export interface SessionInsights {
  realTime: {
    description: string;
    topEntities: Array<{
      label: string;
      type: string;
      weightedDegree: number;
      mentionCount: number;
    }>;
    latency: string;
  };
  coreIssues: {
    description: string;
    topEntities: Array<{
      label: string;
      type: string;
      pagerank: number;
      mentionCount: number;
    }>;
    lastUpdated: string;
    updateFrequency: string;
  };
  emotionalTriggers: {
    description: string;
    topEntities: Array<{
      label: string;
      type: string;
      betweenness: number;
    }>;
    lastUpdated: string;
    updateFrequency: string;
  };
}

// ========================================
// API Error Types
// ========================================

export interface APIError {
  detail: string;
  status_code?: number;
}
