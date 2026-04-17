/**
 * Unit tests for src/lib/rate-limit.ts
 *
 * Validates the token-bucket rate limiter behaviour:
 * - Token consumption and depletion
 * - Refill after interval
 * - Pre-configured limiter instances
 */

import { RateLimiter, aiChatLimiter, orderLimiter } from '@/lib/rate-limit';

// ── RateLimiter.consume() ─────────────────────────────────────────────────────

describe('RateLimiter — basic consumption', () => {
  it('allows requests up to maxTokens without throttling', () => {
    const limiter = new RateLimiter({ maxTokens: 3, refillIntervalMs: 60000 });
    expect(limiter.consume().allowed).toBe(true);
    expect(limiter.consume().allowed).toBe(true);
    expect(limiter.consume().allowed).toBe(true);
  });

  it('blocks the request after maxTokens are exhausted', () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillIntervalMs: 60000 });
    limiter.consume();
    limiter.consume();
    const result = limiter.consume();
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('decrements remaining tokens correctly', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 60000 });
    limiter.consume();
    limiter.consume();
    const result = limiter.consume();
    expect(result.remaining).toBe(2); // 5 - 3 consumed = 2
  });

  it('returns retryAfterMs > 0 when throttled', () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillIntervalMs: 5000 });
    limiter.consume(); // Depletes the one token
    const result = limiter.consume();
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(5000);
  });

  it('returns retryAfterMs = 0 when allowed', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 5000 });
    const result = limiter.consume();
    expect(result.retryAfterMs).toBe(0);
  });
});

// ── RateLimiter.reset() ───────────────────────────────────────────────────────

describe('RateLimiter.reset()', () => {
  it('restores the limiter to full capacity', () => {
    const limiter = new RateLimiter({ maxTokens: 3, refillIntervalMs: 60000 });
    limiter.consume();
    limiter.consume();
    limiter.consume();
    expect(limiter.consume().allowed).toBe(false);
    limiter.reset();
    expect(limiter.consume().allowed).toBe(true);
  });

  it('makes full maxTokens available again after reset', () => {
    const limiter = new RateLimiter({ maxTokens: 4, refillIntervalMs: 60000 });
    limiter.consume();
    limiter.consume();
    limiter.reset();
    expect(limiter.getAvailableTokens()).toBe(4);
  });
});

// ── RateLimiter.getAvailableTokens() ─────────────────────────────────────────

describe('RateLimiter.getAvailableTokens()', () => {
  it('returns maxTokens on a fresh limiter', () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillIntervalMs: 60000 });
    expect(limiter.getAvailableTokens()).toBe(10);
  });

  it('does not consume a token when called', () => {
    const limiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 60000 });
    const before = limiter.getAvailableTokens();
    const after = limiter.getAvailableTokens();
    expect(before).toBe(after);
  });
});

// ── Refill behaviour ──────────────────────────────────────────────────────────

describe('RateLimiter — refill over time', () => {
  it('refills tokens after the refill interval passes', async () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillIntervalMs: 50 });
    limiter.consume();
    limiter.consume();
    expect(limiter.consume().allowed).toBe(false);

    // Wait for refill
    await new Promise(r => setTimeout(r, 70));

    expect(limiter.consume().allowed).toBe(true);
  });

  it('does not exceed maxTokens after multiple refill intervals', async () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillIntervalMs: 50 });

    await new Promise(r => setTimeout(r, 300)); // Wait for many refill intervals

    expect(limiter.getAvailableTokens()).toBe(2); // Should not exceed max
  });
});

// ── Pre-configured limiters ───────────────────────────────────────────────────

describe('Pre-configured rate limiters', () => {
  beforeEach(() => {
    aiChatLimiter.reset();
    orderLimiter.reset();
  });

  it('aiChatLimiter starts with tokens available', () => {
    expect(aiChatLimiter.getAvailableTokens()).toBeGreaterThan(0);
  });

  it('orderLimiter starts with tokens available', () => {
    expect(orderLimiter.getAvailableTokens()).toBeGreaterThan(0);
  });

  it('aiChatLimiter limits after maxTokens are consumed', () => {
    // Drain all tokens
    let result = aiChatLimiter.consume();
    while (result.allowed) result = aiChatLimiter.consume();
    expect(result.allowed).toBe(false);
  });
});
