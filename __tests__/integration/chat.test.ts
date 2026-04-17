/**
 * Chat conversation history integration tests
 *
 * Validates the conversation history management:
 * - Message ordering
 * - Role assignment
 * - History pruning to prevent token overflow
 * - Message sanitization before sending
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'chat-integration-key';

import { askGemini } from '@/lib/gemini';

function successResponse(text: string) {
  return {
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  };
}

describe('Chat history management', () => {
  beforeEach(() => mockFetch.mockReset());

  it('sends messages in correct chronological order', async () => {
    mockFetch.mockResolvedValue(successResponse('Response'));
    const history = [
      { role: 'user', text: 'First message' },
      { role: 'ai',   text: 'First response' },
      { role: 'user', text: 'Second message' },
    ];
    await askGemini('Third message', history);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const texts = body.contents.map((c: any) => c.parts[0].text);
    // History messages come first, then current
    expect(texts[texts.length - 1]).toBe('Third message');
  });

  it('correctly maps roles: user → user, ai → model', async () => {
    mockFetch.mockResolvedValue(successResponse('Mapped!'));
    const history = [
      { role: 'user', text: 'Q1' },
      { role: 'ai',   text: 'A1' },
    ];
    await askGemini('Q2', history);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const roles = body.contents.map((c: any) => c.role);
    expect(roles).not.toContain('ai'); // 'ai' must be mapped to 'model'
    expect(roles).toContain('model');
    expect(roles).toContain('user');
  });

  it('always appends the current user message at the end', async () => {
    mockFetch.mockResolvedValue(successResponse('End'));
    await askGemini('Current query', [
      { role: 'user', text: 'Old message' },
    ]);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const last = body.contents[body.contents.length - 1];
    expect(last.role).toBe('user');
    expect(last.parts[0].text).toBe('Current query');
  });

  it('prunes history to avoid token overflow (max 6 historical messages)', async () => {
    mockFetch.mockResolvedValue(successResponse('Pruned'));
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'ai',
      text: `Message ${i}`,
    }));
    await askGemini('New', history);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Max 6 history + 1 current = 7
    expect(body.contents.length).toBeLessThanOrEqual(7);
  });

  it('handles empty history (first message in a new session)', async () => {
    mockFetch.mockResolvedValue(successResponse('First!'));
    await askGemini('Hello AI', []);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].parts[0].text).toBe('Hello AI');
  });
});

describe('Chat fallback behaviour', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns a string response even when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));
    const result = await askGemini('Where is food?', []);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('fallback responses are contextually relevant', async () => {
    mockFetch.mockRejectedValue(new Error('Offline'));
    const exitResult = await askGemini('Which exit should I use?', []);
    expect(exitResult).toMatch(/gate|exit|🚪/i);
  });

  it('always resolves — never rejects — regardless of API state', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network error'));
    await expect(askGemini('Test', [])).resolves.toBeDefined();
  });
});
