'use client';

import { useState, useCallback } from 'react';
import { exportToJSON, exportToCSV, exportToClipboard, ExportOptions, ExportFormat } from './exporters';

interface UseExportResult {
  isExporting: boolean;
  error: Error | null;
  exportJSON: (data: Record<string, unknown>[], options?: ExportOptions) => void;
  exportCSV: (data: Record<string, unknown>[], options?: ExportOptions) => void;
  copyToClipboard: (data: Record<string, unknown>[], format?: 'json' | 'csv') => Promise<void>;
}

export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportJSON = useCallback((data: Record<string, unknown>[], options?: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      exportToJSON(data, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportCSV = useCallback((data: Record<string, unknown>[], options?: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      exportToCSV(data, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (data: Record<string, unknown>[], format: 'json' | 'csv' = 'json') => {
    setIsExporting(true);
    setError(null);

    try {
      await exportToClipboard(data, format);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Copy failed'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportJSON,
    exportCSV,
    copyToClipboard,
  };
}
