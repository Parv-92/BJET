import { apiClient } from './client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/api';

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

export async function registerApi(userData: RegisterRequest): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', userData);
  return response.data;
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
