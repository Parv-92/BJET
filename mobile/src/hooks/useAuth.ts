/**
 * Bjet Mobile - useAuth Hook
 * Custom hook providing access to AuthContext.
 */
import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../features/auth/AuthContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
