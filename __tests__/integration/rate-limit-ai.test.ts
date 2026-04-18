/**
 * Integration test: Rate Limiter + AI Chat flow
 *
 * Tests that the token-bucket rate limiter correctly guards the AI chat
 * pipeline — the same way it works in production via AISheet.tsx.
 *
 * Validates:
 * 1. Requests are allowed within the rate limit
 * 2. Requests are blocked once the limit is exhausted
 * 3. After a block, the AI function is NOT called (no wasted API quota)
 * 4. The blocked result contains a meaningful retryAfterMs value
 * 5. Resetting the limiter restores full capacity
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'ratelimit-integration-test-key';

import { RateLimiter } from '@/lib/rate-limit';
import { askGemini } from '@/lib/gemini';

const successResponse = (text: string) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

// ── Full pipeline simulation ──────────────────────────────────────────────────

describe('Rate Limiter + AI pipeline integration', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    mockFetch.mockReset();
    // Create a tight limiter: 2 messages, slow refill (60s)
    limiter = new RateLimiter({ maxTokens: 2, refillIntervalMs: 60000 });
  });

  it('allows the first message through and calls the AI', async () => {
    mockFetch.mockResolvedValue(successResponse('Hello!'));
    const result = limiter.consume();

    expect(result.allowed).toBe(true);

    if (result.allowed) {
      const response = await askGemini('Where is my seat?', []);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }
  });

  it('allows the second message through', async () => {
    mockFetch.mockResolvedValue(successResponse('Your seat is in Section B.'));
    limiter.consume(); // First message
    const result = limiter.consume(); // Second message

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blocks the third message and does NOT call the AI', async () => {
    mockFetch.mockResolvedValue(successResponse('Should not be called'));
    limiter.consume(); // 1st
    limiter.consume(); // 2nd — drains limit
    const result = limiter.consume(); // 3rd — should be blocked

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);

    // The app should NOT call askGemini when rate-limited
    // Simulating the guard that AISheet.tsx implements:
    if (result.allowed) {
      await askGemini('This should not run', []);
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('retryAfterMs is within the refill interval when blocked', () => {
    limiter.consume();
    limiter.consume();
    const result = limiter.consume();

    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(60000);
  });

  it('restores full capacity after reset and allows AI calls again', async () => {
    mockFetch.mockResolvedValue(successResponse('Back to full capacity!'));

    limiter.consume();
    limiter.consume();
    expect(limiter.consume().allowed).toBe(false);

    limiter.reset();

    const result = limiter.consume();
    expect(result.allowed).toBe(true);

    const response = await askGemini('Am I rate limited?', []);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(response).toBe('Back to full capacity!');
  });

  it('getAvailableTokens is consistent with consume results', () => {
    expect(limiter.getAvailableTokens()).toBe(2);
    limiter.consume();
    expect(limiter.getAvailableTokens()).toBe(1);
    limiter.consume();
    expect(limiter.getAvailableTokens()).toBe(0);
  });
});
