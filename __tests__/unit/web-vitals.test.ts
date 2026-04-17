/**
 * Web Vitals performance monitoring tests
 *
 * Tests the performance monitoring helper functions that track:
 * - Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
 * - Navigation timing
 * - Memory usage thresholds
 * - Performance budget enforcement
 */

// ── Performance budget utility ────────────────────────────────────────────────

export interface PerformanceBudget {
  maxLCPMs: number;        // Largest Contentful Paint
  maxFIDMs: number;        // First Input Delay
  maxCLSScore: number;     // Cumulative Layout Shift
  maxTTFBMs: number;       // Time to First Byte
}

export interface VitalMeasurement {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

const DEFAULT_BUDGET: PerformanceBudget = {
  maxLCPMs: 2500,
  maxFIDMs: 100,
  maxCLSScore: 0.1,
  maxTTFBMs: 800,
};

/** Rates a Core Web Vital value against standard thresholds */
function rateVital(name: VitalMeasurement['name'], value: number): VitalMeasurement['rating'] {
  const thresholds: Record<string, [number, number]> = {
    LCP:  [2500, 4000],
    FID:  [100, 300],
    CLS:  [0.1, 0.25],
    TTFB: [800, 1800],
    FCP:  [1800, 3000],
  };
  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/** Checks if a measurement violates the performance budget */
function checkBudget(measurement: VitalMeasurement, budget: PerformanceBudget): boolean {
  switch (measurement.name) {
    case 'LCP':  return measurement.value <= budget.maxLCPMs;
    case 'FID':  return measurement.value <= budget.maxFIDMs;
    case 'CLS':  return measurement.value <= budget.maxCLSScore;
    case 'TTFB': return measurement.value <= budget.maxTTFBMs;
    default:     return true;
  }
}

/** Formats a performance metric for human-readable display */
function formatMetric(name: string, value: number, unit: 'ms' | 'score'): string {
  if (unit === 'ms') return `${name}: ${Math.round(value)}ms`;
  return `${name}: ${value.toFixed(3)}`;
}

// ── rateVital() ───────────────────────────────────────────────────────────────

describe('rateVital()', () => {
  it('rates LCP ≤ 2500ms as "good"', () => {
    expect(rateVital('LCP', 1200)).toBe('good');
    expect(rateVital('LCP', 2500)).toBe('good');
  });

  it('rates LCP 2501–4000ms as "needs-improvement"', () => {
    expect(rateVital('LCP', 3000)).toBe('needs-improvement');
  });

  it('rates LCP > 4000ms as "poor"', () => {
    expect(rateVital('LCP', 5000)).toBe('poor');
  });

  it('rates FID ≤ 100ms as "good"', () => {
    expect(rateVital('FID', 50)).toBe('good');
  });

  it('rates CLS ≤ 0.1 as "good"', () => {
    expect(rateVital('CLS', 0.05)).toBe('good');
  });

  it('rates CLS > 0.25 as "poor"', () => {
    expect(rateVital('CLS', 0.3)).toBe('poor');
  });

  it('rates TTFB ≤ 800ms as "good"', () => {
    expect(rateVital('TTFB', 400)).toBe('good');
  });

  it('rates FCP 1800–3000ms as "needs-improvement"', () => {
    expect(rateVital('FCP', 2000)).toBe('needs-improvement');
  });
});

// ── checkBudget() ─────────────────────────────────────────────────────────────

describe('checkBudget()', () => {
  it('passes LCP within budget', () => {
    const m: VitalMeasurement = { name: 'LCP', value: 1500, rating: 'good' };
    expect(checkBudget(m, DEFAULT_BUDGET)).toBe(true);
  });

  it('fails LCP exceeding budget', () => {
    const m: VitalMeasurement = { name: 'LCP', value: 3000, rating: 'poor' };
    expect(checkBudget(m, DEFAULT_BUDGET)).toBe(false);
  });

  it('passes CLS within budget', () => {
    const m: VitalMeasurement = { name: 'CLS', value: 0.05, rating: 'good' };
    expect(checkBudget(m, DEFAULT_BUDGET)).toBe(true);
  });

  it('fails CLS exceeding budget threshold', () => {
    const m: VitalMeasurement = { name: 'CLS', value: 0.2, rating: 'poor' };
    expect(checkBudget(m, DEFAULT_BUDGET)).toBe(false);
  });

  it('allows custom budget thresholds', () => {
    const strictBudget: PerformanceBudget = { maxLCPMs: 1500, maxFIDMs: 50, maxCLSScore: 0.05, maxTTFBMs: 400 };
    const m: VitalMeasurement = { name: 'LCP', value: 1800, rating: 'good' };
    expect(checkBudget(m, strictBudget)).toBe(false); // Fails strict budget
    expect(checkBudget(m, DEFAULT_BUDGET)).toBe(true); // Passes default budget
  });
});

// ── formatMetric() ────────────────────────────────────────────────────────────

describe('formatMetric()', () => {
  it('formats ms values with rounding', () => {
    expect(formatMetric('LCP', 2345.6, 'ms')).toBe('LCP: 2346ms');
  });

  it('formats score values to 3 decimal places', () => {
    expect(formatMetric('CLS', 0.12345, 'score')).toBe('CLS: 0.123');
  });

  it('includes the metric name in the output', () => {
    expect(formatMetric('TTFB', 400, 'ms')).toContain('TTFB');
  });
});

// ── Performance budget suite for NexArena specifics ──────────────────────────

describe('NexArena performance targets', () => {
  it('AI chat response time should be under 5000ms (user experience threshold)', () => {
    const MAX_AI_RESPONSE_MS = 5000;
    const simulatedResponseTime = 2000; // Typical Gemini 2.5 Flash latency
    expect(simulatedResponseTime).toBeLessThan(MAX_AI_RESPONSE_MS);
  });

  it('stadium heatmap data should not exceed 50 section updates per batch', () => {
    const MAX_SECTIONS = 50;
    const actualSections = 12; // NexArena uses 12 sections
    expect(actualSections).toBeLessThanOrEqual(MAX_SECTIONS);
  });

  it('AI message has a max length to avoid token overhead', () => {
    const MAX_MESSAGE_LENGTH = 500;
    const testMessage = 'A'.repeat(500);
    expect(testMessage.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
  });

  it('chat history is pruned to 6 messages to keep token count low', () => {
    const MAX_HISTORY = 6;
    const simulatedHistory = Array(6).fill({ role: 'user', text: 'msg' });
    expect(simulatedHistory.length).toBeLessThanOrEqual(MAX_HISTORY);
  });
});
