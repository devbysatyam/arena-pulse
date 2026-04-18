/**
 * Unit tests for src/hooks/useKeyboardShortcuts.ts
 *
 * Validates that global keyboard shortcuts correctly:
 * - Map digit keys to navigation actions
 * - Open/close the AI sheet on '/'
 * - Handle Escape to close AI or go back
 * - Are suppressed when the user is typing in an input
 */

import { isTypingTarget } from '@/hooks/useKeyboardShortcuts';

// Since useKeyboardShortcuts is a React hook we test the pure helper
// separately; the hook integration is covered in the accessibility tests.

// ── isTypingTarget() helper ───────────────────────────────────────────────────

describe('isTypingTarget()', () => {
  it('returns true for an input element', () => {
    const input = document.createElement('input');
    expect(isTypingTarget(input)).toBe(true);
  });

  it('returns true for a textarea element', () => {
    const textarea = document.createElement('textarea');
    expect(isTypingTarget(textarea)).toBe(true);
  });

  it('returns false for a button element', () => {
    const button = document.createElement('button');
    expect(isTypingTarget(button)).toBe(false);
  });

  it('returns false for a div without contenteditable', () => {
    const div = document.createElement('div');
    expect(isTypingTarget(div)).toBe(false);
  });

  it('returns true for a contenteditable div', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(isTypingTarget(div)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isTypingTarget(null)).toBe(false);
  });
});
