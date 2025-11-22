'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, RegisterData } from '@/lib/types';
import { authAPI, getErrorMessage } from '@/lib/api';

// ========================================
// Auth Context Type
// ========================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// ========================================
// Create Context
// ========================================

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================================
// Auth Provider Component
// ========================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user && !!token;

  // ========================================
  // Check Authentication on Mount
  // ========================================

  const checkAuth = useCallback(async () => {
    // Skip auth check on public pages
    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = typeof window !== 'undefined' &&
      publicPages.includes(window.location.pathname);

    if (isPublicPage) {
      setIsLoading(false);
      return;
    }

    try {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      // Validate token by fetching user info
      const userData = await authAPI.me();
      setUser(userData);
      setToken(savedToken);
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token is invalid, clear it
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ========================================
  // Login Function
  // ========================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call login API
      const authResponse = await authAPI.login(credentials.email, credentials.password);

      // Save token to localStorage
      localStorage.setItem('token', authResponse.access_token);
      setToken(authResponse.access_token);

      // Fetch user info
      const userData = await authAPI.me();
      setUser(userData);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw so component can handle it
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // ========================================
  // Register Function
  // ========================================

  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call register API
      const newUser = await authAPI.register(data);

      // Auto-login after registration
      await login({ email: data.email, password: data.password });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw so component can handle it
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // ========================================
  // Logout Function
  // ========================================

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout API to invalidate token on backend
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsLoading(false);

      // Redirect to home
      router.push('/');
    }
  }, [router]);

  // ========================================
  // Clear Error Function
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ========================================
  // Context Value
  // ========================================

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
