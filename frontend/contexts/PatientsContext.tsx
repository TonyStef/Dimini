'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientDetail,
  Session,
} from '@/lib/types';
import { patientsAPI, PatientsListParams, getErrorMessage } from '@/lib/api';

// ============================================================================
// Context Types
// ============================================================================

interface PatientsContextType {
  // State
  patients: Patient[];
  currentPatient: PatientDetail | null;
  loading: boolean;
  error: string | null;

  // Patient operations
  fetchPatients: (params?: PatientsListParams) => Promise<void>;
  createPatient: (data: PatientCreate) => Promise<Patient | null>;
  updatePatient: (patientId: string, data: PatientUpdate) => Promise<boolean>;
  deletePatient: (patientId: string) => Promise<boolean>;
  fetchPatientDetail: (patientId: string) => Promise<void>;

  // Session operations
  startSession: (patientId: string) => Promise<Session | null>;

  // Utility
  clearError: () => void;
  clearCurrentPatient: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface PatientsProviderProps {
  children: ReactNode;
}

export function PatientsProvider({ children }: PatientsProviderProps) {
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // Clear Functions
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCurrentPatient = useCallback(() => {
    setCurrentPatient(null);
  }, []);

  // ========================================
  // Fetch Patients List
  // ========================================

  const fetchPatients = useCallback(async (params?: PatientsListParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await patientsAPI.list(params);
      setPatients(response.patients);

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error('Failed to load patients', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // Create Patient
  // ========================================

  const createPatient = useCallback(async (data: PatientCreate): Promise<Patient | null> => {
    try {
      setLoading(true);
      setError(null);

      const newPatient = await patientsAPI.create(data);

      // Add to local state
      setPatients((prev) => [newPatient, ...prev]);

      toast.success('Patient created successfully', {
        description: `${newPatient.name} has been added to your patient list.`,
      });

      return newPatient;

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error('Failed to create patient', {
        description: message,
      });
      return null;

    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // Update Patient
  // ========================================

  const updatePatient = useCallback(async (
    patientId: string,
    data: PatientUpdate
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const updatedPatient = await patientsAPI.update(patientId, data);

      // Update in local state
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? updatedPatient : p))
      );

      // Update current patient if it's the one being edited
      if (currentPatient?.id === patientId) {
        setCurrentPatient((prev) => (prev ? { ...prev, ...updatedPatient } : null));
      }

      toast.success('Patient updated successfully', {
        description: `${updatedPatient.name}'s information has been updated.`,
      });

      return true;

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error('Failed to update patient', {
        description: message,
      });
      return false;

    } finally {
      setLoading(false);
    }
  }, [currentPatient]);

  // ========================================
  // Delete Patient
  // ========================================

  const deletePatient = useCallback(async (patientId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await patientsAPI.delete(patientId);

      // Remove from local state
      setPatients((prev) => prev.filter((p) => p.id !== patientId));

      // Clear current patient if it's the one being deleted
      if (currentPatient?.id === patientId) {
        setCurrentPatient(null);
      }

      toast.success('Patient deleted successfully', {
        description: 'The patient has been removed from your list.',
      });

      return true;

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      // Check if error is due to active sessions
      if (message.includes('active session')) {
        toast.error('Cannot delete patient', {
          description: 'This patient has an active session. Please end the session first.',
        });
      } else {
        toast.error('Failed to delete patient', {
          description: message,
        });
      }

      return false;

    } finally {
      setLoading(false);
    }
  }, [currentPatient]);

  // ========================================
  // Fetch Patient Detail
  // ========================================

  const fetchPatientDetail = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);

      const patientDetail = await patientsAPI.get(patientId);
      setCurrentPatient(patientDetail);

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error('Failed to load patient details', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // Start Session
  // ========================================

  const startSession = useCallback(async (patientId: string): Promise<Session | null> => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await patientsAPI.startSession(patientId);

      toast.success('Session started', {
        description: 'A new therapy session has been created.',
      });

      // Refresh patient detail to update stats
      if (currentPatient?.id === patientId) {
        await fetchPatientDetail(patientId);
      }

      return newSession;

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error('Failed to start session', {
        description: message,
      });
      return null;

    } finally {
      setLoading(false);
    }
  }, [currentPatient, fetchPatientDetail]);

  // ========================================
  // Context Value
  // ========================================

  const value: PatientsContextType = {
    // State
    patients,
    currentPatient,
    loading,
    error,

    // Patient operations
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    fetchPatientDetail,

    // Session operations
    startSession,

    // Utility
    clearError,
    clearCurrentPatient,
  };

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePatients() {
  const context = useContext(PatientsContext);

  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }

  return context;
}
