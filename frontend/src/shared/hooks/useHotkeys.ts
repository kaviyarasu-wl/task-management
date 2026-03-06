import { useEffect, useCallback } from 'react';

type ModifierKey = 'meta' | 'ctrl' | 'shift' | 'alt';

interface HotkeyOptions {
  /** Key to listen for (e.g., 'k', '/', '?', 'Escape') */
  key: string;
  /** Required modifier keys */
  modifiers?: ModifierKey[];
  /** Callback on key press */
  handler: (event: KeyboardEvent) => void;
  /** Only fire when no input/textarea is focused (default: true) */
  ignoreInputs?: boolean;
  /** Whether the shortcut is currently active (default: true) */
  enabled?: boolean;
}

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  if (INPUT_TAGS.has(activeElement.tagName)) return true;
  if ((activeElement as HTMLElement).isContentEditable) return true;
  return false;
}

function checkModifiers(event: KeyboardEvent, modifiers: ModifierKey[]): boolean {
  const requiresMeta = modifiers.includes('meta');
  const requiresCtrl = modifiers.includes('ctrl');
  const requiresShift = modifiers.includes('shift');
  const requiresAlt = modifiers.includes('alt');

  // Cross-platform: Cmd on Mac = Ctrl on Windows/Linux
  const hasMetaOrCtrl = event.metaKey || event.ctrlKey;

  if (requiresMeta || requiresCtrl) {
    if (!hasMetaOrCtrl) return false;
  } else {
    if (event.metaKey || event.ctrlKey) return false;
  }

  if (requiresShift !== event.shiftKey) return false;
  if (requiresAlt !== event.altKey) return false;

  return true;
}

export function useHotkeys(shortcuts: HotkeyOptions[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const {
          key,
          modifiers = [],
          handler,
          ignoreInputs = true,
          enabled = true,
        } = shortcut;

        if (!enabled) continue;

        const pressedKey = event.key.toLowerCase();
        const targetKey = key.toLowerCase();

        if (pressedKey !== targetKey) continue;
        if (!checkModifiers(event, modifiers)) continue;
        if (ignoreInputs && isInputFocused()) continue;

        event.preventDefault();
        handler(event);
        return;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export type { HotkeyOptions, ModifierKey };
