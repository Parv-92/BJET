/**
 * Bjet Mobile - Categories API
 * Conforming strictly to API Contract v0.3.0.
 * Paths have strictly NO trailing slashes.
 */
import { apiClient } from './client';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api';

/**
 * Fetch all categories accessible to the current user (defaults + custom).
 * GET /api/v1/categories
 */
export async function getCategoriesApi(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>('/categories');
  return response.data;
}

/**
 * Retrieve a specific category by ID.
 * GET /api/v1/categories/{id}
 */
export async function getCategoryApi(id: number): Promise<Category> {
  const response = await apiClient.get<Category>(`/categories/${id}`);
  return response.data;
}

/**
 * Create a new custom category for the authenticated user.
 * POST /api/v1/categories
 */
export async function createCategoryApi(data: CreateCategoryRequest): Promise<Category> {
  const response = await apiClient.post<Category>('/categories', data);
  return response.data;
}

/**
 * Update a custom category owned by the user.
 * System defaults cannot be modified.
 * PUT /api/v1/categories/{id}
 */
export async function updateCategoryApi(
  id: number,
  data: UpdateCategoryRequest
): Promise<Category> {
  const response = await apiClient.put<Category>(`/categories/${id}`, data);
  return response.data;
}

/**
 * Delete a custom category owned by the user.
 * System defaults cannot be deleted.
 * Referenced categories cannot be deleted (returns 400).
 * DELETE /api/v1/categories/{id}
 */
export async function deleteCategoryApi(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
