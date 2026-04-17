/**
 * Unit tests for the Gemini AI module (src/lib/gemini.ts)
 *
 * Tests the fallback response logic and key rotation mechanisms
 * without making real API calls.
 */

// We need to mock the fetch globally before importing the module
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock process.env with test API keys
process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key-1';
process.env.NEXT_PUBLIC_GEMINI_API_KEY_2 = 'test-key-2';
process.env.NEXT_PUBLIC_GEMINI_API_KEY_3 = 'test-key-3';

import { askGemini } from '@/lib/gemini';

// ── Fallback response tests ───────────────────────────────────────────────────

describe('askGemini() — successful API response', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: 'Your seat is in Section C.' }] } },
        ],
      }),
    });
  });

  it('returns the AI response text', async () => {
    const result = await askGemini('Where is my seat?', []);
    expect(result).toBe('Your seat is in Section C.');
  });

  it('includes conversation history in the request', async () => {
    const history = [
      { role: 'user', text: 'hello' },
      { role: 'ai', text: 'Hi there!' },
    ];
    await askGemini('Where is food?', history);
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.contents.length).toBeGreaterThanOrEqual(2);
  });

  it('maps "ai" role to "model" in API request', async () => {
    const history = [{ role: 'ai', text: 'Hi!' }];
    await askGemini('Test', history);
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const roles = callBody.contents.map((c: any) => c.role);
    expect(roles).toContain('model'); // ai → model
    expect(roles).not.toContain('ai');
  });

  it('handles empty response candidates (e.g. safety filter trigger) by using fallback', async () => {
    // API returns OK but no candidates (common when safety filters block output)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [] }),
    });

    const result = await askGemini('unsafe prompt', []);
    expect(result).toMatch(/help|directions|food|score/i); // Should return generic fallback
  });
});

// ── Rate limit / key rotation tests ──────────────────────────────────────────

describe('askGemini() — key rotation on 429', () => {
  it('tries the next key when first key returns 429', async () => {
    // First call = 429 (rate limited), second call = success
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Fallback key response' }] } }],
        }),
      });

    const result = await askGemini('Any question', []);
    // Should have made 2 fetch calls (key 1 failed, key 2 succeeded)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toBe('Fallback key response');
  });

  it('returns a fallback response when all keys are exhausted', async () => {
    // All 3 keys return 429 — triggers retry delays before fallback
    mockFetch.mockResolvedValue({ ok: false, status: 429 });

    const result = await askGemini('food', []);
    // Should return a fallback string, not throw
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 15000); 

  it('triggers fallback immediately on 500 error after all retries', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
    
    // We expect it to try all keys then fallback
    const result = await askGemini('Where is gate A?', []);
    expect(result).toMatch(/gate|A|🗺️/i);
  }, 15000);
});

// ── Fallback response content tests ──────────────────────────────────────────

describe('askGemini() — intelligent fallback responses', () => {
  beforeEach(() => {
    // Simulate total API failure to force fallback
    mockFetch.mockRejectedValue(new Error('Network error'));
  });

  it('provides a food-related fallback for food queries', async () => {
    const result = await askGemini('I am hungry, where is food?', []);
    expect(result).toMatch(/stall|food|🍔/i);
  });

  it('provides an exit-related fallback for exit queries', async () => {
    const result = await askGemini('How do I exit?', []);
    expect(result).toMatch(/gate|exit|🚪/i);
  });

  it('provides a seat-related fallback for seat queries', async () => {
    const result = await askGemini('Where is my seat?', []);
    expect(result).toMatch(/seat|section|block/i);
  });

  it('provides a toilet fallback for bathroom queries', async () => {
    const result = await askGemini('I need the bathroom', []);
    expect(result).toMatch(/wc|toilet|bathroom|🚻/i);
  });

  it('provides a crowd fallback for crowd queries', async () => {
    const result = await askGemini('Is it crowded?', []);
    expect(result).toMatch(/crowd|stand|%/i);
  });

  it('provides a score fallback for match queries', async () => {
    const result = await askGemini('What is the score?', []);
    expect(result).toMatch(/chelsea|arsenal|⚽/i);
  });

  it('provides a generic helpful fallback for unrecognised queries', async () => {
    const result = await askGemini('blah blah unrelated xyz', []);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });
});
