'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ShortcutDefinition, ModifierKey, ShortcutMatch, ShortcutConfig } from './types';

const DEFAULT_CONFIG: ShortcutConfig = {
  enabled: true,
  preventDefault: true,
  stopPropagation: false,
};

/**
 * Parse a shortcut string into a match object
 * e.g., "ctrl+s" -> { key: 's', ctrl: true, alt: false, shift: false, meta: false }
 */
function parseShortcut(shortcut: string): ShortcutMatch {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];

  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  };
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, match: ShortcutMatch): boolean {
  return (
    event.key.toLowerCase() === match.key &&
    event.ctrlKey === match.ctrl &&
    event.altKey === match.alt &&
    event.shiftKey === match.shift &&
    event.metaKey === match.meta
  );
}

/**
 * Hook for registering a single keyboard shortcut
 */
export function useShortcut(
  shortcut: string,
  callback: () => void,
  config: ShortcutConfig = {}
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const match = parseShortcut(shortcut);

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if in input/textarea/contenteditable
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      if (matchesShortcut(event, match)) {
        if (mergedConfig.preventDefault) {
          event.preventDefault();
        }
        if (mergedConfig.stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, mergedConfig]);
}

/**
 * Hook for registering multiple keyboard shortcuts
 */
export function useShortcuts(
  shortcuts: Record<string, () => void>,
  config: ShortcutConfig = {}
) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const parsedShortcuts = Object.entries(shortcuts).map(([key, _]) => ({
    key,
    match: parseShortcut(key),
  }));

  useEffect(() => {
    if (!mergedConfig.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if in input/textarea/contenteditable
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      for (const { key, match } of parsedShortcuts) {
        if (matchesShortcut(event, match)) {
          if (mergedConfig.preventDefault) {
            event.preventDefault();
          }
          if (mergedConfig.stopPropagation) {
            event.stopPropagation();
          }
          shortcutsRef.current[key]?.();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [parsedShortcuts, mergedConfig]);
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  return shortcut
    .split('+')
    .map((part) => {
      switch (part.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return isMac ? '⌃' : 'Ctrl';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'meta':
        case 'cmd':
        case 'command':
          return isMac ? '⌘' : 'Win';
        case 'enter':
          return '↵';
        case 'escape':
        case 'esc':
          return 'Esc';
        case 'backspace':
          return '⌫';
        case 'delete':
          return 'Del';
        case 'arrowup':
          return '↑';
        case 'arrowdown':
          return '↓';
        case 'arrowleft':
          return '←';
        case 'arrowright':
          return '→';
        default:
          return part.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');
}
