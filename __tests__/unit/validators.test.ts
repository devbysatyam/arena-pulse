/**
 * Unit tests for src/lib/validators.ts
 *
 * Tests input sanitisation and validation logic used across
 * AI chat, admin broadcast forms, and user-facing inputs.
 */

import {
  validateAIMessage,
  validateAdminBroadcast,
  sanitizeText,
  isValidEmail,
  ValidationResult,
} from '@/lib/validators';

describe('sanitizeText()', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('strips HTML tags to prevent XSS', () => {
    expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('strips anchor tags', () => {
    expect(sanitizeText('<a href="evil.com">click</a> text')).toBe('click text');
  });

  it('returns empty string for null-like input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('preserves normal text unchanged', () => {
    expect(sanitizeText('Where is the food stall?')).toBe('Where is the food stall?');
  });
});

describe('validateAIMessage()', () => {
  it('returns valid for a normal question', () => {
    const result: ValidationResult = validateAIMessage('Where is the nearest exit?');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns invalid for empty string', () => {
    const result = validateAIMessage('');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  it('returns invalid for whitespace-only input', () => {
    const result = validateAIMessage('   ');
    expect(result.valid).toBe(false);
  });

  it('returns invalid when message exceeds 500 characters', () => {
    const longMessage = 'A'.repeat(501);
    const result = validateAIMessage(longMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it('returns valid for exactly 500 characters', () => {
    const maxMessage = 'A'.repeat(500);
    const result = validateAIMessage(maxMessage);
    expect(result.valid).toBe(true);
  });
});

describe('validateAdminBroadcast()', () => {
  it('returns valid for a proper broadcast', () => {
    const result = validateAdminBroadcast({
      title: 'Gate Update',
      body: 'Gate C4 is now open for entry.',
      priority: 'info',
    });
    expect(result.valid).toBe(true);
  });

  it('returns invalid when title is empty', () => {
    const result = validateAdminBroadcast({
      title: '',
      body: 'Some body text',
      priority: 'info',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/title/i);
  });

  it('returns invalid when body is empty', () => {
    const result = validateAdminBroadcast({
      title: 'A title',
      body: '',
      priority: 'info',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/body/i);
  });

  it('returns invalid for an unknown priority', () => {
    const result = validateAdminBroadcast({
      title: 'Title',
      body: 'Body text',
      priority: 'unknown' as any,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/priority/i);
  });

  it('rejects titles with HTML injection', () => {
    const result = validateAdminBroadcast({
      title: '<script>alert(1)</script>',
      body: 'Body',
      priority: 'info',
    });
    // Should sanitize → title becomes empty → invalid
    expect(result.valid).toBe(false);
  });
});

describe('isValidEmail()', () => {
  it('returns true for a well-formed email', () => {
    expect(isValidEmail('fan@stadium.com')).toBe(true);
  });

  it('returns false for missing @', () => {
    expect(isValidEmail('fanstadium.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false for plaintext with @', () => {
    expect(isValidEmail('not-email@')).toBe(false);
  });
});
