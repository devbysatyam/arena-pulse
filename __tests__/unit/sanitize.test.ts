/**
 * Dedicated sanitization tests (src/lib/validators.ts — sanitizeText)
 *
 * Tests a broader range of XSS attack vectors, injection payloads,
 * and edge cases to ensure robust input security.
 */

import { sanitizeText } from '@/lib/validators';

describe('sanitizeText() — XSS prevention', () => {
  it('removes basic script tags and their content', () => {
    expect(sanitizeText('<script>alert(1)</script>')).toBe('');
  });

  it('removes script tags with attributes', () => {
    expect(sanitizeText('<script type="text/javascript">evil()</script>')).toBe('');
  });

  it('removes inline event handlers (onclick, onerror, etc.)', () => {
    // After removing the img tag the text remains empty
    const result = sanitizeText('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  it('removes style tags and their content', () => {
    expect(sanitizeText('<style>body { display: none }</style>clean')).toBe('clean');
  });

  it('removes iframe injection attempts', () => {
    expect(sanitizeText('<iframe src="evil.com"></iframe>')).toBe('');
  });

  it('removes anchor tags while preserving inner text', () => {
    const result = sanitizeText('<a href="evil.com">click here</a>');
    expect(result).toContain('click here');
    expect(result).not.toContain('<a');
    expect(result).not.toContain('href');
  });

  it('handles mixed content: text + tags', () => {
    const result = sanitizeText('Hello <b>World</b>! How are you?');
    expect(result).toBe('Hello World! How are you?');
  });
});

describe('sanitizeText() — edge cases', () => {
  it('handles empty string input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('handles strings with only whitespace', () => {
    expect(sanitizeText('   ')).toBe('');
  });

  it('preserves numbers and special characters (non-HTML)', () => {
    expect(sanitizeText('Gate B14, Row 22! 🏟️')).toBe('Gate B14, Row 22! 🏟️');
  });

  it('handles nested tags', () => {
    const result = sanitizeText('<div><span>text</span></div>');
    expect(result).toBe('text');
  });

  it('handles malformed HTML gracefully', () => {
    const result = sanitizeText('<unclosed-tag This is text');
    expect(typeof result).toBe('string');
  });

  it('preserves emoji and unicode characters', () => {
    const text = '🍔 Order from Stall B3 — ₹250';
    expect(sanitizeText(text)).toBe(text);
  });

  it('handles very long strings without hanging', () => {
    const long = `<b>${'A'.repeat(10000)}</b>`;
    const start = Date.now();
    sanitizeText(long);
    expect(Date.now() - start).toBeLessThan(1000); // Should complete in < 1s
  });
});

describe('sanitizeText() — SQL-style injection (should pass through as plain text issues)', () => {
  it('strips < and > from SQL-style injections', () => {
    // SQL doesn't use HTML tags, but if someone wraps it in tags:
    const payload = '<script>DROP TABLE users</script>';
    expect(sanitizeText(payload)).not.toContain('<script>');
  });

  it('allows harmless quotes and apostrophes', () => {
    const text = "Where's the nearest gate? That's what I'm asking.";
    expect(sanitizeText(text)).toBe(text);
  });
});
