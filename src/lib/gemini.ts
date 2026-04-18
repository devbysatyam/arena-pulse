'use client';
import { useState } from 'react';

// ── API Key Pool ─────────────────────────────────────────────────────────────
// Primary key + 2 backups. On rate-limit (429) the next key is tried automatically.
const API_KEYS: string[] = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY    ?? '',
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_2  ?? '',
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_3  ?? '',
].filter(Boolean); // drop any empty slots

/** Using Gemini 2.5 Flash — the latest stable fast model as of 2025.
 *  Chosen for: better spatial reasoning, 1M token context, and instruction-following.
 *  @see https://ai.google.dev/gemini-api/docs/models
 */
const GEMINI_MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── System Context ────────────────────────────────────────────────────────────
const SYSTEM_CONTEXT = `You are Arena AI, the premium digital concierge for Arena Pulse. The current match is Chelsea vs Arsenal (Score: Chelsea 1-0 Arsenal, 67').

STADIUM DATA:
- USER SEAT: Section C, Block B14, Row 22, Seat 7 (Entrance: Gate C4 East).
- STALLS: 🍔 Stall B3 East (8min wait, low queue), Stall A7 North (14min, moderate), Stall G1 West (6min, clear).
- FACILITIES: WCs located at North, East, South, West concourse blocks. Nearest WC is East Block.
- CROWD HEATMAP: South stand is at PEAK (91%). North stand is CLEAR (42%). 
- NAVIGATION: Always guide fans through the concourse rings. NEVER suggest crossing the pitch.
- EXIT: Recommended exit for the user is Gate E2 (South) due to low crowd density (28%).

GUIDELINES:
- Be helpful, premium, and concise (2-3 sentences max).
- Use formatting (like **bolding** key locations) to make info scannable.
- Use emojis like 🏟️, ⚽, 🍔, 🚻, 🚪 appropriately.
- You are "Arena AI". Never identify as a chatbot or large language model.`;

// ── Key-rotating fetch ────────────────────────────────────────────────────────
async function fetchWithKeyRotation(
  body: object,
  attempt = 0,
  keyIndex = 0
): Promise<string> {
  // If all keys are exhausted, use fallback
  if (keyIndex >= API_KEYS.length) {
    throw new Error('ALL_KEYS_EXHAUSTED');
  }

  const key = API_KEYS[keyIndex];
  const url = `${BASE_URL}?key=${key}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    // Network error — try next key
    console.warn(`Gemini network error on key[${keyIndex}], trying next key…`);
    return fetchWithKeyRotation(body, 0, keyIndex + 1);
  }

  if (res.ok) {
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  // 429 / 503 → rotate to next key after a short delay
  if (res.status === 429 || res.status === 503) {
    if (keyIndex + 1 < API_KEYS.length) {
      const delay = 500 + Math.random() * 500;
      console.warn(
        `Gemini key[${keyIndex}] hit ${res.status} — switching to key[${keyIndex + 1}] in ${Math.round(delay)}ms`
      );
      await new Promise(r => setTimeout(r, delay));
      return fetchWithKeyRotation(body, 0, keyIndex + 1);
    }
    // All keys rate-limited — do one exponential retry on last key
    if (attempt < 2) {
      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`All keys rate-limited. Retrying key[${keyIndex}] in ${Math.round(delay)}ms (attempt ${attempt + 1})`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithKeyRotation(body, attempt + 1, keyIndex);
    }
    throw new Error('RATE_LIMITED');
  }

  throw new Error(`API_ERROR_${res.status}`);
}

// ── Main API function ─────────────────────────────────────────────────────────
export async function askGemini(
  userMessage: string,
  history: { role: string; text: string }[]
): Promise<string> {
  if (API_KEYS.length === 0) {
    return generateFallbackResponse(userMessage);
  }

  const contents = [
    ...history.slice(-6).map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_CONTEXT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
  };

  try {
    const text = await fetchWithKeyRotation(requestBody);
    return text || generateFallbackResponse(userMessage);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Gemini error (all keys failed):', message);
    return generateFallbackResponse(userMessage);
  }
}

// ── Smart offline fallback ────────────────────────────────────────────────────
function generateFallbackResponse(msg: string): string {
  const m = msg.toLowerCase();

  if (m.includes('seat') || m.includes('section') || m.includes('block'))
    return '🪑 Your seat is **Block B14, Row 22, Seat 7** in the East Stand (Section C). Head to the inner concourse via **Gate C4** and follow signs to B14.';

  if (m.includes('food') || m.includes('eat') || m.includes('hungry') || m.includes('burger'))
    return '🍔 Nearest stall: **Stall B3 East** — only 8 min wait, low queue right now! Head along the outer concourse from Section C.';

  if (m.includes('wc') || m.includes('toilet') || m.includes('bathroom'))
    return '🚻 Closest WC is the **East Block**, about 2 min along the concourse. The North Block is also available and less busy.';

  if (m.includes('exit') || m.includes('leave') || m.includes('go home'))
    return '🚪 Best exit is **Gate E2 South** — only 28% crowd density vs 91% at South Stand. Head anti-clockwise on the outer concourse.';

  if (m.includes('crowd') || m.includes('busy') || m.includes('pack'))
    return '📊 Live: South Stand peak (91%), East busy (78%), West moderate (55%), North clear (42%). Head to **North or West** concourses right now.';

  if (m.includes('score') || m.includes('match') || m.includes('goal'))
    return '⚽ **Chelsea 1–0 Arsenal**, 67 minutes. Chelsea scored in the 43rd minute. 2nd half in full swing!';

  if (m.includes('parking') || m.includes('car'))
    return '🅿️ Wembley has 4 car parks (P1–P4). **P1 at North** is closest to Gate A. Roads can be congested post-match — consider Wembley Park Tube.';

  if (m.includes('first aid') || m.includes('medical') || m.includes('help'))
    return '🏥 First Aid: **NE corner** (near Gate B) and **SW corner** (near Gate F). For emergencies, call stadium security via the SOS button in your app.';

  if (m.includes('navigate') || m.includes('direction') || m.includes('how do i get'))
    return '🗺️ Tap the **Map** tab → select your destination → I\'ll route you through the concourse. **AR mode** gives you live overlay navigation!';

  if (m.includes('admin') || m.includes('staff'))
    return '🔒 Admin features are restricted to Arena Pulse operations staff. If you need assistance, flag down a steward in your section.';

  return '🏟️ I can help with **directions, food stalls, crowd levels**, or the **live match score**. What do you need?';
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [keyCount] = useState(API_KEYS.length);

  const sendMessage = async (
    msg: string,
    history: { role: string; text: string }[],
    onResponse: (text: string) => void
  ) => {
    setLoading(true);
    try {
      const text = await askGemini(msg, history);
      onResponse(text);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, keyCount };
}
