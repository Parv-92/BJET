/**
 * Bjet Mobile - Authentication Context
 * Manages authentication state (user, token, isLoading, isAuthenticated, sessionError)
 * backed by SecureStore persistence, with selective session restoration and
 * centralized 401 error handling.
 */
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { User } from '../../types/api';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  registerUnauthorizedHandler,
  getApiErrorMessage,
} from '../../api/client';
import { getMeApi } from '../../api/auth';
import { queryClient } from '../../lib/queryClient';

export { useAuth } from '../../hooks/useAuth';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Complete session cleanup helper
  const clearSession = useCallback(async () => {
    try {
      await clearStoredToken();
    } catch (err) {
      console.error('Failed to clear token during session cleanup:', err);
    } finally {
      setToken(null);
      setUser(null);
      setSessionError(null);
      queryClient.clear();
    }
  }, []);

  // Session restoration on app startup:
  // - 200 -> restore session
  // - 401 -> clear token and require login
  // - Network/timeout/5xx -> preserve stored token, expose recoverable error state
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setSessionError(null);

    try {
      const storedToken = await getStoredToken();
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return;
      }

      setToken(storedToken);

      try {
        const currentUser = await getMeApi();
        setUser(currentUser);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Token is explicitly expired or invalid
          console.warn('Stored token is invalid or expired (401). Clearing session.');
          await clearSession();
        } else {
          // Network, timeout, or server 5xx: preserve stored token and surface recoverable error
          console.warn('Network or server error during session restoration. Preserving stored token.');
          const message = getApiErrorMessage(error);
          setSessionError(message);
        }
      }
    } catch (err) {
      console.error('Failed to read token during session restoration:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  // Initial mount restoration
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Listen for unauthorized 401 events from authenticated requests
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      clearSession();
    });
    return unregister;
  }, [clearSession]);

  // Log in user with newly obtained token and hydrate user profile:
  // Cleans up partial session if getMe fails after token storage
  const login = useCallback(async (newToken: string) => {
    try {
      await setStoredToken(newToken);
      setToken(newToken);

      const currentUser = await getMeApi();
      setUser(currentUser);
      setSessionError(null);
    } catch (error) {
      console.error('Failed to hydrate user after token storage. Cleaning up partial session.');
      await clearSession();
      throw error;
    }
  }, [clearSession]);

  // Explicit user logout
  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  // Refresh current user profile
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
      setSessionError(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await clearSession();
      }
      throw error;
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    sessionError,
    login,
    logout,
    refreshUser,
    retrySessionRestore: restoreSession,
  }), [user, token, isLoading, sessionError, login, logout, refreshUser, restoreSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
