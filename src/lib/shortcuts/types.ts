// Keyboard Shortcuts Types

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

export interface ShortcutDefinition {
  key: string;
  modifiers?: ModifierKey[];
  description: string;
  action: () => void;
  scope?: string;
  enabled?: boolean;
}

export interface ShortcutConfig {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface ShortcutMatch {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}
