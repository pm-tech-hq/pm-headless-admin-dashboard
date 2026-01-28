// Regex patterns for schema detection

/**
 * Email pattern - basic RFC 5322 compliant
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL pattern - http/https URLs
 */
export const URL_PATTERN = /^https?:\/\/[^\s]+$/;

/**
 * UUID pattern - RFC 4122 compliant (v1-5)
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * ISO 8601 DateTime pattern
 */
export const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * ISO 8601 Date pattern (YYYY-MM-DD)
 */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Time pattern (HH:MM or HH:MM:SS)
 */
export const TIME_PATTERN = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9](:[0-5][0-9])?$/;

/**
 * Common date format patterns
 */
export const DATE_FORMAT_PATTERNS = {
  // US format: MM/DD/YYYY
  'us-date': /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/,
  // EU format: DD/MM/YYYY
  'eu-date': /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/,
  // Dash format: DD-MM-YYYY or YYYY-MM-DD
  'dash-date': /^(\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])|(0?[1-9]|[12]\d|3[01])-(0?[1-9]|1[0-2])-\d{4})$/,
  // Dot format: DD.MM.YYYY
  'dot-date': /^(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])\.\d{4}$/,
} as const;

/**
 * Foreign key field name patterns (suffix)
 */
export const FOREIGN_KEY_SUFFIX_PATTERN = /^.+(_id|Id|ID|_ID)$/;

/**
 * Foreign key field name patterns (prefix)
 */
export const FOREIGN_KEY_PREFIX_PATTERN = /^(id_|fk_|ref_).+$/i;

/**
 * Primary key field name patterns
 */
export const PRIMARY_KEY_NAME_PATTERN = /^(id|_id|ID|pk|primary_key|uuid|guid|key)$/i;

/**
 * MongoDB ObjectId pattern
 */
export const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/**
 * Numeric string pattern (for detecting numbers stored as strings)
 */
export const NUMERIC_STRING_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Integer string pattern
 */
export const INTEGER_STRING_PATTERN = /^-?\d+$/;

/**
 * Phone number patterns (various formats)
 */
export const PHONE_PATTERNS = {
  // International: +1-234-567-8900 or +1 234 567 8900
  international: /^\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
  // US: (123) 456-7890 or 123-456-7890
  us: /^(\(\d{3}\)\s?|\d{3}[-.])\d{3}[-.]?\d{4}$/,
} as const;

/**
 * IP address patterns
 */
export const IP_PATTERNS = {
  // IPv4: 192.168.1.1
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  // IPv6: simplified pattern
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
} as const;

/**
 * Hex color pattern
 */
export const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Slug pattern (URL-friendly strings)
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Common pagination parameter names
 */
export const PAGINATION_PARAMS = {
  offset: ['offset', 'skip', 'start', 'from'],
  limit: ['limit', 'per_page', 'perPage', 'pageSize', 'page_size', 'size', 'count', 'take'],
  page: ['page', 'pageNumber', 'page_number', 'p', 'pageNum'],
  cursor: ['cursor', 'after', 'before', 'next', 'continuation', 'nextToken', 'next_token'],
} as const;

/**
 * Common response data path names
 */
export const DATA_PATH_NAMES = [
  'data',
  'results',
  'items',
  'records',
  'content',
  'rows',
  'list',
  'entries',
  'objects',
  'documents',
  'users',
  'posts',
  'products',
] as const;

/**
 * Common total count path names
 */
export const TOTAL_PATH_NAMES = [
  'total',
  'totalCount',
  'total_count',
  'count',
  'totalRecords',
  'total_records',
  'totalItems',
  'total_items',
  'meta.total',
  'pagination.total',
  '_meta.total',
] as const;

/**
 * Common "has more" indicator path names
 */
export const HAS_MORE_PATH_NAMES = [
  'hasMore',
  'has_more',
  'hasNext',
  'has_next',
  'more',
  'moreAvailable',
  'meta.hasMore',
  'pagination.hasMore',
  'pagination.has_next',
] as const;

/**
 * Common cursor/next token path names
 */
export const CURSOR_PATH_NAMES = [
  'nextCursor',
  'next_cursor',
  'cursor',
  'nextPageToken',
  'next_page_token',
  'continuationToken',
  'continuation_token',
  'links.next',
  'paging.next',
  'meta.next_cursor',
] as const;

/**
 * All patterns grouped by category
 */
export const PATTERNS = {
  EMAIL: EMAIL_PATTERN,
  URL: URL_PATTERN,
  UUID: UUID_PATTERN,
  ISO_DATETIME: ISO_DATETIME_PATTERN,
  ISO_DATE: ISO_DATE_PATTERN,
  TIME: TIME_PATTERN,
  DATE_FORMATS: DATE_FORMAT_PATTERNS,
  FOREIGN_KEY_SUFFIX: FOREIGN_KEY_SUFFIX_PATTERN,
  FOREIGN_KEY_PREFIX: FOREIGN_KEY_PREFIX_PATTERN,
  PRIMARY_KEY_NAMES: PRIMARY_KEY_NAME_PATTERN,
  OBJECT_ID: OBJECT_ID_PATTERN,
  NUMERIC_STRING: NUMERIC_STRING_PATTERN,
  INTEGER_STRING: INTEGER_STRING_PATTERN,
  PHONE: PHONE_PATTERNS,
  IP: IP_PATTERNS,
  HEX_COLOR: HEX_COLOR_PATTERN,
  SLUG: SLUG_PATTERN,
} as const;
