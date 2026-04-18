/**
 * @module useKeyboardShortcuts
 * @description Global keyboard shortcut handler for NexArena.
 *
 * Provides power-user keyboard navigation alongside the tap-based UI,
 * satisfying WCAG 2.1 Success Criterion 2.1.1 (Keyboard) and 2.1.3
 * (Keyboard — No Exception).
 *
 * Shortcuts (Escape, digit keys, slash for AI):
 * - Press `/`        → Open AI concierge
 * - Press `Escape`   → Close AI sheet / go back
 * - Press `1`        → Home
 * - Press `2`        → Map (2D)
 * - Press `3`        → Heatmap
 * - Press `4`        → Food ordering
 * - Press `5`        → My Ticket
 *
 * Shortcuts are suppressed when the user is typing in an input or textarea.
 */

import { useEffect } from 'react';
import { useAppStore, type Screen } from '@/store/app-store';

const SHORTCUT_MAP: Record<string, Screen> = {
  '1': 'home',
  '2': 'map2d',
  '3': 'heatmap',
  '4': 'food',
  '5': 'ticket',
};

export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(): void {
  const { navigate, aiSheetOpen, aiSheetClose, showAISheet, back, isLoggedIn } = useAppStore();

  useEffect(() => {
    if (!isLoggedIn) return;

    function handleKeyDown(e: KeyboardEvent): void {
      // Never intercept shortcuts when user is actively typing
      if (isTypingTarget(document.activeElement)) return;

      switch (e.key) {
        case '/':
          // Prevent browser's find-in-page from opening
          e.preventDefault();
          if (showAISheet) {
            aiSheetClose();
          } else {
            aiSheetOpen();
          }
          break;

        case 'Escape':
          if (showAISheet) {
            aiSheetClose();
          } else {
            back();
          }
          break;

        default: {
          const target = SHORTCUT_MAP[e.key];
          if (target && !e.metaKey && !e.ctrlKey && !e.altKey) {
            navigate(target);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, aiSheetOpen, aiSheetClose, showAISheet, back, isLoggedIn]);
}
