/**
 * Bjet Mobile - useCategories Hook
 * Fetches categories list and individual category details.
 */
import { useQuery } from '@tanstack/react-query';
import { getCategoriesApi, getCategoryApi } from '../api/categories';
import { Category } from '../types/api';

/**
 * Hook to retrieve all categories available to the authenticated user.
 * Query key: ['categories', 'list']
 */
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories', 'list'],
    queryFn: () => getCategoriesApi(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to retrieve a single category by ID.
 * Query key: ['categories', id]
 */
export function useCategory(id: number) {
  return useQuery<Category, Error>({
    queryKey: ['categories', id],
    queryFn: () => getCategoryApi(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: typeof id === 'number' && !isNaN(id) && id > 0,
  });
}
