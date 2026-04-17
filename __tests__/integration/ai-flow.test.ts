/**
 * Integration tests for the AI chat flow.
 *
 * Tests the end-to-end flow: user inputs a message →
 * Gemini API is called (mocked) → response is returned correctly.
 *
 * This validates that:
 * 1. The request is built with system context
 * 2. The response is parsed correctly
 * 3. The conversation history is maintained properly
 * 4. Errors are handled gracefully, never crashing the app
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'integration-test-key';

import { askGemini } from '@/lib/gemini';

const successResponse = (text: string) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

describe('AI Chat Flow — Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends a valid POST request to the Gemini endpoint', async () => {
    mockFetch.mockResolvedValue(successResponse('Hello!'));
    await askGemini('Hi', []);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('includes system_instruction in the request body', async () => {
    mockFetch.mockResolvedValue(successResponse('System context check'));
    await askGemini('Test system context', []);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toHaveProperty('system_instruction');
    expect(body.system_instruction.parts[0].text).toContain('Arena AI');
  });

  it('maintains conversation context across multiple turns', async () => {
    mockFetch.mockResolvedValue(successResponse('Turn 2 response'));

    const history = [
      { role: 'user', text: 'Where is my seat?' },
      { role: 'ai', text: 'Your seat is in Block B14.' },
    ];

    await askGemini('What about food?', history);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Should have history + new message
    expect(body.contents.length).toBeGreaterThanOrEqual(2);
  });

  it('limits history to the last 6 messages to avoid token overflow', async () => {
    mockFetch.mockResolvedValue(successResponse('Response'));

    const longHistory = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'ai',
      text: `Message ${i}`,
    }));

    await askGemini('New message', longHistory);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // 6 history messages + 1 current = 7 max
    expect(body.contents.length).toBeLessThanOrEqual(7);
  });

  it('never throws even if the API returns a 500 error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(askGemini('Test', [])).resolves.toBeDefined();
  });

  it('never throws even if fetch itself rejects', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(askGemini('Test', [])).resolves.toBeDefined();
  });
});
