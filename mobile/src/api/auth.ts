/**
 * Bjet Mobile - Authentication API
 * Implements real endpoints conforming to API Contract v0.3.0.
 * Paths have strictly NO trailing slashes.
 */
import { apiClient } from './client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/api';

/**
 * Log in an existing user with email and password.
 * POST /api/v1/auth/login
 */
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Register a new user.
 * POST /api/v1/auth/register
 */
export async function registerApi(userData: RegisterRequest): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', userData);
  return response.data;
}

/**
 * Retrieve the current authenticated user profile using Bearer JWT.
 * GET /api/v1/auth/me
 */
export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
