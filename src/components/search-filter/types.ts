// Search and Filter Types

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  id: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean' | 'text';
  label: string;
  field: string;
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: unknown;
}

export interface ActiveFilter {
  filterId: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
  | 'eq'       // equals
  | 'neq'      // not equals
  | 'gt'       // greater than
  | 'gte'      // greater than or equal
  | 'lt'       // less than
  | 'lte'      // less than or equal
  | 'contains' // string contains
  | 'startsWith'
  | 'endsWith'
  | 'in'       // value in array
  | 'between'  // between two values
  | 'isNull'
  | 'isNotNull';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchFilterState {
  search: string;
  filters: ActiveFilter[];
  sort: SortConfig | null;
  page: number;
  pageSize: number;
}

export interface SearchFilterActions {
  setSearch: (search: string) => void;
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (filterId: string) => void;
  updateFilter: (filterId: string, value: unknown) => void;
  clearFilters: () => void;
  setSort: (sort: SortConfig | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}
