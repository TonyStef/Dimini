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
