'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  SearchFilterState,
  SearchFilterActions,
  ActiveFilter,
  SortConfig,
  FilterOperator,
} from './types';

interface UseFiltersOptions {
  initialState?: Partial<SearchFilterState>;
  onStateChange?: (state: SearchFilterState) => void;
}

export function useFilters(options: UseFiltersOptions = {}): SearchFilterState & SearchFilterActions {
  const defaultState: SearchFilterState = {
    search: '',
    filters: [],
    sort: null,
    page: 1,
    pageSize: 10,
  };

  const [state, setState] = useState<SearchFilterState>({
    ...defaultState,
    ...options.initialState,
  });

  const updateState = useCallback(
    (updates: Partial<SearchFilterState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        options.onStateChange?.(newState);
        return newState;
      });
    },
    [options]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateState({ search, page: 1 });
    },
    [updateState]
  );

  const addFilter = useCallback(
    (filter: ActiveFilter) => {
      updateState({
        filters: [...state.filters.filter((f) => f.filterId !== filter.filterId), filter],
        page: 1,
      });
    },
    [state.filters, updateState]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      updateState({
        filters: state.filters.filter((f) => f.filterId !== filterId),
        page: 1,
      });
    },
    [state.filters, updateState]
  );

  const updateFilter = useCallback(
    (filterId: string, value: unknown) => {
      updateState({
        filters: state.filters.map((f) =>
          f.filterId === filterId ? { ...f, value } : f
        ),
        page: 1,
      });
    },
    [state.filters, updateState]
  );

  const clearFilters = useCallback(() => {
    updateState({ filters: [], page: 1 });
  }, [updateState]);

  const setSort = useCallback(
    (sort: SortConfig | null) => {
      updateState({ sort });
    },
    [updateState]
  );

  const setPage = useCallback(
    (page: number) => {
      updateState({ page });
    },
    [updateState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateState({ pageSize, page: 1 });
    },
    [updateState]
  );

  const reset = useCallback(() => {
    setState(defaultState);
    options.onStateChange?.(defaultState);
  }, [defaultState, options]);

  return {
    ...state,
    setSearch,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    reset,
  };
}

// Helper function to filter data client-side
export function filterData<T extends Record<string, unknown>>(
  data: T[],
  state: SearchFilterState,
  searchFields?: (keyof T)[]
): T[] {
  let result = [...data];

  // Apply search
  if (state.search && searchFields && searchFields.length > 0) {
    const searchLower = state.search.toLowerCase();
    result = result.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      })
    );
  }

  // Apply filters
  for (const filter of state.filters) {
    result = result.filter((item) => {
      const value = item[filter.field];
      return applyFilterOperator(value, filter.operator, filter.value);
    });
  }

  // Apply sort
  if (state.sort) {
    const { field, direction } = state.sort;
    result.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

function applyFilterOperator(value: unknown, operator: FilterOperator, filterValue: unknown): boolean {
  switch (operator) {
    case 'eq':
      return value === filterValue;
    case 'neq':
      return value !== filterValue;
    case 'gt':
      return typeof value === 'number' && typeof filterValue === 'number' && value > filterValue;
    case 'gte':
      return typeof value === 'number' && typeof filterValue === 'number' && value >= filterValue;
    case 'lt':
      return typeof value === 'number' && typeof filterValue === 'number' && value < filterValue;
    case 'lte':
      return typeof value === 'number' && typeof filterValue === 'number' && value <= filterValue;
    case 'contains':
      return typeof value === 'string' && typeof filterValue === 'string' &&
        value.toLowerCase().includes(filterValue.toLowerCase());
    case 'startsWith':
      return typeof value === 'string' && typeof filterValue === 'string' &&
        value.toLowerCase().startsWith(filterValue.toLowerCase());
    case 'endsWith':
      return typeof value === 'string' && typeof filterValue === 'string' &&
        value.toLowerCase().endsWith(filterValue.toLowerCase());
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const [min, max] = filterValue;
        return typeof value === 'number' && value >= min && value <= max;
      }
      return false;
    case 'isNull':
      return value === null || value === undefined;
    case 'isNotNull':
      return value !== null && value !== undefined;
    default:
      return true;
  }
}

// Helper to paginate data
export function paginateData<T>(data: T[], page: number, pageSize: number): { data: T[]; total: number; totalPages: number } {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    totalPages,
  };
}

// Helper to build query params from state
export function buildQueryParams(state: SearchFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.search) {
    params.set('q', state.search);
  }

  if (state.filters.length > 0) {
    params.set('filters', JSON.stringify(state.filters));
  }

  if (state.sort) {
    params.set('sortBy', state.sort.field);
    params.set('sortDir', state.sort.direction);
  }

  params.set('page', state.page.toString());
  params.set('pageSize', state.pageSize.toString());

  return params;
}

export default useFilters;
