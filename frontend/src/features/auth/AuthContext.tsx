import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../../types/api';
import { getMeApi } from '../../api/auth';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  registerUnauthorizedHandler,
} from '../../api/client';
import { queryClient } from '../../lib/queryClient';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
    } catch {
      // If fetching user profile fails with the token, clear the invalid session
      logout();
    }
  }, [logout]);

  const login = useCallback(async (newToken: string) => {
    setStoredToken(newToken);
    setToken(newToken);
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  // Initial session hydration
  useEffect(() => {
    const initAuth = async () => {
      const initialToken = getStoredToken();
      if (!initialToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getMeApi();
        setUser(currentUser);
        setToken(initialToken);
      } catch {
        // Token was expired or invalid
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for unauthorized 401 events from the API client
  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      logout();
    });
    return unregister;
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
