'use client';

import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { formatShortcut, useShortcut } from './useShortcuts';

interface ShortcutItem {
  shortcut: string;
  description: string;
  category?: string;
}

interface ShortcutsHelpProps {
  shortcuts: ShortcutItem[];
  triggerShortcut?: string;
}

export function ShortcutsHelp({
  shortcuts,
  triggerShortcut = 'shift+?',
}: ShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Register the help shortcut
  useShortcut(triggerShortcut, () => setIsOpen(true));

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-2xl
                    max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b
                      border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-neutral-500 hover:text-neutral-700
                     dark:text-neutral-400 dark:hover:text-neutral-200
                     hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400
                           uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {item.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-neutral-100
                                  dark:bg-neutral-700 text-neutral-600
                                  dark:text-neutral-300 rounded border
                                  border-neutral-200 dark:border-neutral-600">
                      {formatShortcut(item.shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border-t
                      border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700
                                rounded text-neutral-600 dark:text-neutral-300">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

// Default shortcuts for the application
export const defaultShortcuts: ShortcutItem[] = [
  { shortcut: 'shift+?', description: 'Show keyboard shortcuts', category: 'General' },
  { shortcut: 'ctrl+s', description: 'Save changes', category: 'General' },
  { shortcut: 'ctrl+k', description: 'Open command palette', category: 'Navigation' },
  { shortcut: 'g+d', description: 'Go to Dashboard', category: 'Navigation' },
  { shortcut: 'g+s', description: 'Go to Settings', category: 'Navigation' },
  { shortcut: 'n', description: 'Create new item', category: 'Actions' },
  { shortcut: 'e', description: 'Edit selected item', category: 'Actions' },
  { shortcut: 'delete', description: 'Delete selected item', category: 'Actions' },
  { shortcut: 'escape', description: 'Close modal / Cancel', category: 'General' },
];

export default ShortcutsHelp;
