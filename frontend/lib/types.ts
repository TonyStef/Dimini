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

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  demographics?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
// Graph Types
// ========================================

export interface GraphNode {
  id: string;  // node_id
  label: string;
  type: 'topic' | 'emotion';
  group: number;  // For coloring: 1 = emotion, 2 = topic
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

// ========================================
// API Error Types
// ========================================

export interface APIError {
  detail: string;
  status_code?: number;
}
