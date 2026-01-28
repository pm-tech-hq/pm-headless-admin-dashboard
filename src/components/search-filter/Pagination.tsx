'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showTotalCount?: boolean;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showTotalCount = true,
  className = '',
}: PaginationProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Adjust range if at edges
      if (page <= 3) {
        end = Math.min(totalPages - 1, maxVisible);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - maxVisible + 1);
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page Size Selector & Count */}
      <div className="flex items-center gap-4 text-sm text-neutral-600">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-neutral-200 rounded-lg px-2 py-1 text-sm
                       focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}

        {showTotalCount && (
          <span>
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
            <strong>{total}</strong>
          </span>
        )}
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-2">
            {getPageNumbers().map((pageNum, index) =>
              pageNum === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="w-8 text-center text-neutral-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors
                            ${page === pageNum
                              ? 'bg-neutral-900 text-white'
                              : 'hover:bg-neutral-100 text-neutral-700'
                            }`}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
            className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Pagination;
