/**
 * @module rate-limit
 * @description Client-side rate limiting utility for NexArena.
 *
 * Implements a token-bucket algorithm to throttle actions
 * (e.g., AI chat sends, food order submissions) on the client
 * before they ever hit the network.
 *
 * Usage:
 * - Create one RateLimiter per resource (AI, orders, etc.)
 * - Call .consume() before each action
 * - If it returns false, show the user a wait message
 */

/** Options for creating a RateLimiter instance */
export interface RateLimiterOptions {
  /** Maximum number of tokens (requests) in the bucket */
  maxTokens: number;
  /** Milliseconds until one token is replenished */
  refillIntervalMs: number;
}

/** Result of a .consume() call */
export interface ConsumeResult {
  allowed: boolean;
  /** Remaining tokens after this consume call */
  remaining: number;
  /** Milliseconds until the next token is available (0 if allowed) */
  retryAfterMs: number;
}

/**
 * Token-bucket rate limiter.
 * Thread-safe for single-threaded JS environments.
 *
 * @example
 * const aiLimiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 2000 });
 *
 * if (!aiLimiter.consume().allowed) {
 *   showToast('Please wait a moment before sending another message.');
 *   return;
 * }
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxTokens;
    this.refillIntervalMs = options.refillIntervalMs;
    this.tokens = options.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refills tokens based on elapsed time since the last refill.
   * @internal
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now - (elapsed % this.refillIntervalMs);
    }
  }

  /**
   * Attempt to consume one token.
   * Returns allowed=true if the action is permitted, false if throttled.
   */
  consume(): ConsumeResult {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return { allowed: true, remaining: this.tokens, retryAfterMs: 0 };
    }
    const retryAfterMs = this.refillIntervalMs - (Date.now() - this.lastRefillTime);
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  /**
   * Returns the current number of available tokens without consuming one.
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Resets the limiter to full capacity.
   * Useful for testing or after a successful admin override.
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }
}

/** Pre-configured limiter for the AI chat (5 messages per 10 seconds) */
export const aiChatLimiter = new RateLimiter({ maxTokens: 5, refillIntervalMs: 2000 });

/** Pre-configured limiter for food order submissions (3 per 30 seconds) */
export const orderLimiter = new RateLimiter({ maxTokens: 3, refillIntervalMs: 10000 });
