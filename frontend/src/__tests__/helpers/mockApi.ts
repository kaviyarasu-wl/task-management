import { vi } from 'vitest';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';

/**
 * Creates a successful API response wrapper
 */
export function apiSuccess<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

/**
 * Creates a paginated API response wrapper
 */
export function apiPaginated<T>(
  data: T[],
  total: number,
  nextCursor: string | null = null
): PaginatedResponse<T> {
  return { success: true, data, total, nextCursor };
}

/**
 * Creates a mock axios instance for testing
 */
export function createMockAxios() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
}
