// Data Export Utilities

export type ExportFormat = 'json' | 'csv' | 'xlsx';

export interface ExportOptions {
  filename?: string;
  format?: ExportFormat;
  columns?: string[];
  headers?: Record<string, string>;
  dateFormat?: string;
}

/**
 * Export data as JSON file
 */
export function exportToJSON<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const filename = options.filename || `export-${Date.now()}`;
  const jsonContent = JSON.stringify(data, null, 2);

  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions = {}
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const filename = options.filename || `export-${Date.now()}`;

  // Get columns - use specified or extract from first row
  const columns = options.columns || Object.keys(data[0]);

  // Create header row
  const headers = columns.map((col) => options.headers?.[col] || col);
  const headerRow = headers.map(escapeCSV).join(',');

  // Create data rows
  const dataRows = data.map((row) =>
    columns.map((col) => escapeCSV(formatValue(row[col], options))).join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

/**
 * Export data to clipboard
 */
export async function exportToClipboard<T extends Record<string, unknown>>(
  data: T[],
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  let content: string;

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
  } else {
    const columns = Object.keys(data[0] || {});
    const headers = columns.join('\t');
    const rows = data.map((row) =>
      columns.map((col) => String(row[col] ?? '')).join('\t')
    );
    content = [headers, ...rows].join('\n');
  }

  await navigator.clipboard.writeText(content);
}

/**
 * Generate a downloadable URL for the data
 */
export function generateExportURL<T extends Record<string, unknown>>(
  data: T[],
  format: ExportFormat = 'json'
): string {
  let content: string;
  let mimeType: string;

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else {
    const columns = Object.keys(data[0] || {});
    const headers = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => escapeCSV(String(row[col] ?? ''))).join(',')
    );
    content = [headers, ...rows].join('\n');
    mimeType = 'text/csv';
  }

  const blob = new Blob([content], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Helper: Download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Helper: Escape CSV value
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If contains comma, newline, or quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Helper: Format value for export
function formatValue(value: unknown, options: ExportOptions): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return options.dateFormat
      ? formatDate(value, options.dateFormat)
      : value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

// Helper: Format date
function formatDate(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return format
    .replace('YYYY', date.getFullYear().toString())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}
