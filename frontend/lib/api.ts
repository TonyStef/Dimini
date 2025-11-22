import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AuthResponse,
  User,
  RegisterData,
  APIError,
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientListResponse,
  PatientDetail,
  Session
} from './types';

// ========================================
// Axios Instance Configuration
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// ========================================
// Request Interceptor - Add Auth Token
// ========================================

api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================================
// Response Interceptor - Handle Errors
// ========================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');

      // Only redirect if we're in the browser and not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ========================================
// Authentication API Functions
// ========================================

export const authAPI = {
  /**
   * Login with email and password
   * IMPORTANT: Backend uses OAuth2PasswordRequestForm which expects:
   * - Field name 'username' (not 'email')
   * - Content-Type: application/x-www-form-urlencoded
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Create FormData for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', email); // OAuth2 uses 'username' field
    formData.append('password', password);

    const response = await api.post<AuthResponse>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  },

  /**
   * Register a new therapist
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Get current user info
   * Requires valid JWT token in Authorization header
   */
  async me(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  /**
   * Logout and invalidate all tokens
   * Increments tokenVersion on backend to invalidate all existing tokens
   */
  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/logout');
    return response.data;
  },
};

// ========================================
// Patients API Functions
// ========================================

export interface PatientsListParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: 'name' | 'created_at' | 'last_session';
  sort_order?: 'asc' | 'desc';
}

export interface SessionsListParams {
  page?: number;
  page_size?: number;
  status?: 'active' | 'completed' | 'cancelled';
}

export const patientsAPI = {
  /**
   * Get list of patients with pagination and filtering
   */
  async list(params?: PatientsListParams): Promise<PatientListResponse> {
    const response = await api.get<PatientListResponse>('/api/patients', { params });
    return response.data;
  },

  /**
   * Create a new patient
   */
  async create(data: PatientCreate): Promise<Patient> {
    const response = await api.post<Patient>('/api/patients', data);
    return response.data;
  },

  /**
   * Get patient details with stats
   */
  async get(patientId: string): Promise<PatientDetail> {
    const response = await api.get<PatientDetail>(`/api/patients/${patientId}`);
    return response.data;
  },

  /**
   * Update patient information
   */
  async update(patientId: string, data: PatientUpdate): Promise<Patient> {
    const response = await api.patch<Patient>(`/api/patients/${patientId}`, data);
    return response.data;
  },

  /**
   * Delete a patient
   * Returns 400 error if patient has active sessions
   */
  async delete(patientId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/patients/${patientId}`);
    return response.data;
  },

  /**
   * Start a new session for a patient
   */
  async startSession(patientId: string): Promise<Session> {
    const response = await api.post<Session>('/api/sessions/start', {
      patient_id: patientId
    });
    return response.data;
  },

  /**
   * Get session history for a patient
   */
  async getSessions(patientId: string, params?: SessionsListParams): Promise<{
    sessions: Session[];
    total: number;
  }> {
    const response = await api.get<{ sessions: Session[]; total: number }>(
      `/api/patients/${patientId}/sessions`,
      { params }
    );
    return response.data;
  },
};

// ========================================
// Helper Functions
// ========================================

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError | undefined;
    return apiError?.detail || error.message || 'An unexpected error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a 401 Unauthorized error
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

export default api;
