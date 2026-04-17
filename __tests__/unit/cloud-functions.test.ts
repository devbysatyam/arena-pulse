/**
 * Cloud function / async operation tests
 *
 * Tests async patterns used in NexArena:
 * - Admin notification broadcasting
 * - Crowd data update batching
 * - Error recovery and retry patterns
 * - Async rate limiting
 */

import { RateLimiter } from '@/lib/rate-limit';
import { validateAdminBroadcast } from '@/lib/validators';

// ── Simulated async broadcast pipeline ────────────────────────────────────────

/** Simulates the admin broadcast → Firebase write pipeline */
async function simulateBroadcast(
  payload: { title: string; body: string; priority: 'info' | 'warning' | 'critical' },
  writeFn: (doc: object) => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  const validation = validateAdminBroadcast(payload);
  if (!validation.valid) return { success: false, error: validation.error };

  try {
    await writeFn({ ...payload, timestamp: Date.now() });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

describe('Admin broadcast pipeline', () => {
  it('succeeds with valid payload and a working writer', async () => {
    const mockWrite = jest.fn().mockResolvedValue(undefined);
    const result = await simulateBroadcast(
      { title: 'Gate Update', body: 'Gate C now open', priority: 'info' },
      mockWrite
    );
    expect(result.success).toBe(true);
    expect(mockWrite).toHaveBeenCalledTimes(1);
  });

  it('fails validation before calling Firebase for empty title', async () => {
    const mockWrite = jest.fn();
    const result = await simulateBroadcast(
      { title: '', body: 'Body text', priority: 'info' },
      mockWrite
    );
    expect(result.success).toBe(false);
    expect(mockWrite).not.toHaveBeenCalled(); // Firebase never hit
    expect(result.error).toMatch(/title/i);
  });

  it('handles Firebase write failure gracefully', async () => {
    const failingWrite = jest.fn().mockRejectedValue(new Error('Permission denied'));
    const result = await simulateBroadcast(
      { title: 'Alert', body: 'Emergency', priority: 'critical' },
      failingWrite
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });

  it('includes a timestamp in the written document', async () => {
    let writtenDoc: any;
    const captureWrite = jest.fn().mockImplementation(async (doc) => { writtenDoc = doc; });
    const before = Date.now();
    await simulateBroadcast(
      { title: 'Test', body: 'Test body', priority: 'warning' },
      captureWrite
    );
    const after = Date.now();
    expect(writtenDoc.timestamp).toBeGreaterThanOrEqual(before);
    expect(writtenDoc.timestamp).toBeLessThanOrEqual(after);
  });
});

// ── Crowd data update batching ────────────────────────────────────────────────

/** Simulate batching multiple crowd updates before writing */
async function batchCrowdUpdates(
  updates: Record<string, number>[],
  writeFn: (batch: Record<string, number>) => Promise<void>
): Promise<number> {
  const merged = Object.assign({}, ...updates);
  await writeFn(merged);
  return Object.keys(merged).length;
}

describe('Crowd data batch updates', () => {
  it('merges multiple section updates into one write call', async () => {
    const mockWrite = jest.fn().mockResolvedValue(undefined);
    const updates = [{ north: 45 }, { south: 88 }, { east: 61 }] as Record<string, number>[];
    const count = await batchCrowdUpdates(updates, mockWrite);

    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(count).toBe(3);
  });

  it('later updates overwrite earlier ones for the same section', async () => {
    let written: Record<string, number> = {};
    const captureWrite = jest.fn().mockImplementation(async (d) => { written = d; });
    await batchCrowdUpdates([{ north: 30 }, { north: 95 }], captureWrite);
    expect(written.north).toBe(95); // Last value wins
  });

  it('handles an empty update array without errors', async () => {
    const mockWrite = jest.fn().mockResolvedValue(undefined);
    const count = await batchCrowdUpdates([], mockWrite);
    expect(count).toBe(0);
    expect(mockWrite).toHaveBeenCalledTimes(1);
  });
});

// ── Rate-limited async operations ────────────────────────────────────────────

describe('Rate-limited async operations', () => {
  it('allows burst of requests up to the token limit', async () => {
    const limiter = new RateLimiter({ maxTokens: 3, refillIntervalMs: 60000 });
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(limiter.consume().allowed);
    }
    expect(results.filter(Boolean).length).toBe(3); // Only 3 allowed
    expect(results.filter(r => !r).length).toBe(2);  // 2 blocked
  });

  it('refills tokens after waiting', async () => {
    const limiter = new RateLimiter({ maxTokens: 1, refillIntervalMs: 50 });
    limiter.consume(); // Deplete
    expect(limiter.consume().allowed).toBe(false);

    await new Promise(r => setTimeout(r, 60)); // Wait for 1 refill

    expect(limiter.consume().allowed).toBe(true);
  });
});

// ── Retry pattern ─────────────────────────────────────────────────────────────

/** Generic exponential backoff retry utility */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: Error = new Error('No attempts made');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

describe('Retry pattern (withRetry)', () => {
  it('succeeds on first attempt if operation works', async () => {
    const op = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(op, 3, 10);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds eventually', async () => {
    const op = jest.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('success');
    const result = await withRetry(op, 3, 5);
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all attempts', async () => {
    const op = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(op, 3, 5)).rejects.toThrow('always fails');
    expect(op).toHaveBeenCalledTimes(3);
  });
});
