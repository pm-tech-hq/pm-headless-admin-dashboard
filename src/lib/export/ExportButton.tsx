'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Loader2, ChevronDown } from 'lucide-react';
import { useExport } from './hooks';
import { ExportOptions } from './exporters';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  options?: ExportOptions;
  className?: string;
}

export function ExportButton({
  data,
  filename,
  options = {},
  className = '',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isExporting, exportJSON, exportCSV, copyToClipboard } = useExport();

  const mergedOptions = { ...options, filename };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    await copyToClipboard(data, 'json');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || data.length === 0}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                 text-neutral-700 bg-white border border-neutral-200 rounded-lg
                 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed
                 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700
                 dark:hover:bg-neutral-700"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border
                      border-neutral-200 shadow-lg py-1 z-50
                      dark:bg-neutral-800 dark:border-neutral-700">
          <button
            onClick={() => {
              exportJSON(data, mergedOptions);
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700
                     hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <FileJson className="w-4 h-4" />
            Export as JSON
          </button>
          <button
            onClick={() => {
              exportCSV(data, mergedOptions);
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700
                     hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export as CSV
          </button>
          <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-700
                     hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
