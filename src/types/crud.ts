// CRUD Operations Type Definitions
// Auto-generated forms and data management

import { SchemaField, FieldType } from './schema';

/**
 * CRUD input types for form fields
 */
export type CrudInputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'textarea'
  | 'richtext'
  | 'file'
  | 'image'
  | 'reference'
  | 'json'
  | 'hidden'
  | 'color'
  | 'range';

/**
 * Validation rule types
 */
export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'unique'
  | 'custom';

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  field: string;
  type: ValidationRuleType;
  value?: unknown;
  message: string;
  customValidator?: string;   // Function name or code
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: string;
}

/**
 * Reference field configuration for foreign key relationships
 */
export interface ReferenceConfig {
  schemaId: string;
  displayField: string;
  valueField: string;
  searchFields?: string[];
  filterBy?: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
}

/**
 * CRUD field configuration
 */
export interface CrudFieldConfig {
  fieldName: string;
  schemaField?: SchemaField;

  // Visibility
  showInList: boolean;
  showInDetail: boolean;
  showInCreate: boolean;
  showInEdit: boolean;
  showInSearch: boolean;

  // Display
  displayName?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  width?: string;             // Column width in list view
  order?: number;             // Display order

  // Form configuration
  inputType: CrudInputType;
  defaultValue?: unknown;
  options?: { label: string; value: unknown; disabled?: boolean }[];

  // Reference configuration
  referenceConfig?: ReferenceConfig;

  // Validation
  required: boolean;
  readonly: boolean;
  disabled?: boolean;
  validation?: FieldValidation;

  // Formatting
  format?: string;            // Display format (e.g., 'currency', 'date:short')
  render?: 'text' | 'badge' | 'link' | 'image' | 'boolean' | 'json' | 'custom';
  customRenderer?: string;

  // Conditional display
  showIf?: {
    field: string;
    operator: 'eq' | 'neq' | 'in' | 'notIn';
    value: unknown;
  };
}

/**
 * CRUD permissions configuration
 */
export interface CrudPermissions {
  create: string[];           // Role IDs
  read: string[];
  update: string[];
  delete: string[];
  bulkCreate: string[];
  bulkUpdate: string[];
  bulkDelete: string[];
  export: string[];
  import: string[];
}

/**
 * CRUD configuration for a schema
 */
export interface CrudConfig {
  id: string;
  schemaId: string;
  dataSourceId: string;

  // Operations enabled
  enableCreate: boolean;
  enableRead: boolean;
  enableUpdate: boolean;
  enableDelete: boolean;
  enableBulk: boolean;
  enableExport: boolean;
  enableImport: boolean;

  // Field configuration
  fields: CrudFieldConfig[];

  // Validation
  validationRules: ValidationRule[];

  // Permissions
  permissions: CrudPermissions;

  // List view settings
  defaultPageSize: number;
  pageSizeOptions: number[];
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  searchableFields: string[];
  filterableFields: string[];

  // Form settings
  formLayout: 'single-column' | 'two-column' | 'tabs';
  formSections?: FormSection[];

  // Hooks
  hooks?: CrudHooks;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form section for organizing fields
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];           // Field names
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * CRUD lifecycle hooks
 */
export interface CrudHooks {
  beforeCreate?: string;
  afterCreate?: string;
  beforeUpdate?: string;
  afterUpdate?: string;
  beforeDelete?: string;
  afterDelete?: string;
  validateCreate?: string;
  validateUpdate?: string;
}

/**
 * Bulk operation request
 */
export interface BulkOperation {
  operation: 'create' | 'update' | 'delete';
  ids?: string[];
  data?: Record<string, unknown>[];
  filter?: Record<string, unknown>;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: { id: string; error: string }[];
}

/**
 * CRUD query parameters
 */
export interface CrudQueryParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
  include?: string[];         // Related schemas to include
  select?: string[];          // Fields to select
}

/**
 * CRUD list response
 */
export interface CrudListResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Form state for CRUD operations
 */
export interface CrudFormState {
  mode: 'create' | 'edit' | 'view';
  data: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Map field type to default input type
 */
export function mapFieldTypeToInputType(fieldType: FieldType): CrudInputType {
  const mapping: Record<FieldType, CrudInputType> = {
    'string': 'text',
    'number': 'number',
    'integer': 'number',
    'boolean': 'checkbox',
    'date': 'date',
    'datetime': 'datetime',
    'time': 'time',
    'email': 'email',
    'url': 'url',
    'uuid': 'text',
    'json': 'json',
    'array': 'multiselect',
    'object': 'json',
    'enum': 'select',
    'reference': 'reference',
    'unknown': 'text',
  };

  return mapping[fieldType] || 'text';
}

/**
 * Generate default CRUD field config from schema field
 */
export function generateFieldConfig(field: SchemaField): CrudFieldConfig {
  const inputType = mapFieldTypeToInputType(field.type);
  const isHiddenField = field.name.toLowerCase().includes('password') ||
                        field.name.toLowerCase().includes('hash') ||
                        field.name.toLowerCase().includes('secret');

  return {
    fieldName: field.name,
    schemaField: field,
    showInList: !isHiddenField && field.type !== 'json' && field.type !== 'object',
    showInDetail: true,
    showInCreate: !field.isPrimaryKey && !field.name.includes('createdAt'),
    showInEdit: !field.isPrimaryKey && !field.name.includes('createdAt'),
    showInSearch: field.type === 'string' || field.type === 'email' || field.type === 'enum',
    displayName: field.displayName || field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    placeholder: field.description || `Enter ${field.name}`,
    inputType: isHiddenField ? 'password' : inputType,
    required: field.isRequired,
    readonly: field.isPrimaryKey,
    validation: {
      minLength: field.minLength,
      maxLength: field.maxLength,
      min: field.min,
      max: field.max,
      pattern: field.pattern,
    },
    options: field.type === 'enum' && field.enumValues
      ? field.enumValues.map(v => ({ label: v, value: v }))
      : undefined,
    referenceConfig: field.isForeignKey && field.referenceTo
      ? {
          schemaId: field.referenceTo,
          displayField: 'name',
          valueField: 'id',
        }
      : undefined,
  };
}
