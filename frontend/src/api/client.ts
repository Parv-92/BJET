import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APIError } from '../types/api';

export const SMART_BUDGET_ACCESS_TOKEN = 'SMART_BUDGET_ACCESS_TOKEN';
export const TOKEN_STORAGE_KEY = SMART_BUDGET_ACCESS_TOKEN;

// Central token helper functions
export function getStoredToken(): string | null {
  return localStorage.getItem(SMART_BUDGET_ACCESS_TOKEN) || localStorage.getItem('smart_budget_access_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem(SMART_BUDGET_ACCESS_TOKEN, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(SMART_BUDGET_ACCESS_TOKEN);
  localStorage.removeItem('smart_budget_access_token');
}

// Global listener for session expiration triggered by 401
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

// Base URL configured from environment, ensuring no trailing slash
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token & enforce no trailing slashes
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ensure URL has no trailing slash
    if (config.url && config.url.length > 1 && config.url.endsWith('/')) {
      config.url = config.url.replace(/\/+$/, '');
    }

    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<APIError>) => {
    if (error.response) {
      const { status, config } = error.response;
      const requestUrl = config.url || '';

      // Check if this was a 401 on an authenticated endpoint (not public /auth/login or /auth/register)
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (status === 401 && !isAuthEndpoint) {
        // Clear stored token
        clearStoredToken();
        // Notify AuthContext listener without hard redirecting from Axios
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from any backend API response.
 * Safely parses Pydantic validation errors (422) and domain detail strings (400, 401, 403, 404).
 */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      if (typeof data.detail === 'string') {
        return data.detail;
      }

      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail
          .map((item) => {
            const field = item.loc ? item.loc[item.loc.length - 1] : '';
            return field ? `${String(field)}: ${item.msg}` : item.msg;
          })
          .join(', ');
      }
    }

    if (axiosError.response?.status === 401) {
      return 'Incorrect email or password, or session expired.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (axiosError.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (axiosError.response?.status === 422) {
      return 'Validation error: Please check your input fields.';
    }
    if (axiosError.message === 'Network Error') {
      return 'Unable to reach the server. Please check your backend connection.';
    }

    return axiosError.message || 'An unexpected error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
