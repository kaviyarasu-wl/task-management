import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type FilterValue = string | undefined;

interface UseFilterParamsReturn<T extends Record<string, FilterValue>> {
  filters: T;
  setFilter: (key: keyof T & string, value: FilterValue) => void;
  setFilters: (newFilters: Partial<T>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  searchParamsString: string;
}

export function useFilterParams<T extends Record<string, FilterValue>>(
  paramKeys: readonly (keyof T & string)[],
  defaults?: Partial<T>
): UseFilterParamsReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = {} as Record<string, FilterValue>;
    for (const key of paramKeys) {
      const value = searchParams.get(key);
      result[key] = value ?? defaults?.[key] ?? undefined;
    }
    return result as T;
  }, [searchParams, paramKeys, defaults]);

  const setFilter = useCallback(
    (key: keyof T & string, value: FilterValue) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        // Clear all tracked keys first
        for (const key of paramKeys) {
          next.delete(key);
        }
        // Set new values
        for (const [key, value] of Object.entries(newFilters)) {
          if (value) {
            next.set(key, value);
          }
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams, paramKeys]
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const key of paramKeys) {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams, paramKeys]);

  const hasActiveFilters = useMemo(
    () => paramKeys.some((key) => searchParams.has(key)),
    [searchParams, paramKeys]
  );

  const searchParamsString = searchParams.toString();

  return { filters, setFilter, setFilters, clearFilters, hasActiveFilters, searchParamsString };
}
