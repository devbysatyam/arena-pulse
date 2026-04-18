/**
 * Unit tests for Google Analytics 4 event tracking (src/lib/analytics.ts)
 *
 * Validates that all event tracking functions call gtag() with the
 * correct event names and parameters. Uses a global gtag spy to
 * avoid real network calls.
 */

// Mock window.gtag before importing the module
const mockGtag = jest.fn();

beforeAll(() => {
  Object.defineProperty(global, 'window', {
    value: { gtag: mockGtag },
    writable: true,
  });
});

import {
  trackAIQuery,
  trackMapView,
  trackFoodOrder,
  trackStadiumView,
  trackAdminLogin,
  trackAdminBroadcast,
  GA_MEASUREMENT_ID,
} from '@/lib/analytics';

beforeEach(() => {
  mockGtag.mockClear();
});

// ── GA_MEASUREMENT_ID ─────────────────────────────────────────────────────────

describe('GA_MEASUREMENT_ID', () => {
  it('exports a string (may be empty if env var not set)', () => {
    expect(typeof GA_MEASUREMENT_ID).toBe('string');
  });
});

// ── trackAIQuery() ────────────────────────────────────────────────────────────

describe('trackAIQuery()', () => {
  it('calls gtag with "ai_query_sent" event', () => {
    trackAIQuery(42);
    expect(mockGtag).toHaveBeenCalledWith('event', 'ai_query_sent', expect.any(Object));
  });

  it('includes the query length in the event params', () => {
    trackAIQuery(100);
    const params = mockGtag.mock.calls[0][2];
    expect(params.value).toBe(100);
  });

  it('passes used_fallback = false by default', () => {
    trackAIQuery(50);
    const params = mockGtag.mock.calls[0][2];
    expect(params.used_fallback).toBe(false);
  });

  it('passes used_fallback = true when specified', () => {
    trackAIQuery(50, true);
    const params = mockGtag.mock.calls[0][2];
    expect(params.used_fallback).toBe(true);
  });

  it('sends the event with category "AI Concierge"', () => {
    trackAIQuery(30);
    const params = mockGtag.mock.calls[0][2];
    expect(params.event_category).toBe('AI Concierge');
  });
});

// ── trackMapView() ────────────────────────────────────────────────────────────

describe('trackMapView()', () => {
  it('calls gtag with "map_view_opened"', () => {
    trackMapView('2d');
    expect(mockGtag).toHaveBeenCalledWith('event', 'map_view_opened', expect.any(Object));
  });

  it('includes map_type in the params', () => {
    trackMapView('3d');
    const params = mockGtag.mock.calls[0][2];
    expect(params.map_type).toBe('3d');
  });

  it('works for all valid map types: 2d, 3d, ar', () => {
    (['2d', '3d', 'ar'] as const).forEach(type => {
      trackMapView(type);
    });
    expect(mockGtag).toHaveBeenCalledTimes(3);
  });
});

// ── trackFoodOrder() ──────────────────────────────────────────────────────────

describe('trackFoodOrder()', () => {
  it('calls gtag with "food_order_placed"', () => {
    trackFoodOrder('stall_b3', 2, 450);
    expect(mockGtag).toHaveBeenCalledWith('event', 'food_order_placed', expect.any(Object));
  });

  it('includes stall_id, item_count, and value in params', () => {
    trackFoodOrder('stall_a7', 3, 675);
    const params = mockGtag.mock.calls[0][2];
    expect(params.stall_id).toBe('stall_a7');
    expect(params.item_count).toBe(3);
    expect(params.value).toBe(675);
  });

  it('always sets currency to INR', () => {
    trackFoodOrder('stall_g1', 1, 200);
    const params = mockGtag.mock.calls[0][2];
    expect(params.currency).toBe('INR');
  });
});

// ── trackStadiumView() ────────────────────────────────────────────────────────

describe('trackStadiumView()', () => {
  it('calls gtag with "stadium_selected"', () => {
    trackStadiumView('wankhede', 'Wankhede Stadium');
    expect(mockGtag).toHaveBeenCalledWith('event', 'stadium_selected', expect.any(Object));
  });

  it('includes both stadium_id and stadium_name', () => {
    trackStadiumView('eden_gardens', 'Eden Gardens');
    const params = mockGtag.mock.calls[0][2];
    expect(params.stadium_id).toBe('eden_gardens');
    expect(params.stadium_name).toBe('Eden Gardens');
  });
});

// ── trackAdminLogin() ─────────────────────────────────────────────────────────

describe('trackAdminLogin()', () => {
  it('records a successful login', () => {
    trackAdminLogin(true);
    const params = mockGtag.mock.calls[0][2];
    expect(params.success).toBe(true);
  });

  it('records a failed login attempt', () => {
    trackAdminLogin(false);
    const params = mockGtag.mock.calls[0][2];
    expect(params.success).toBe(false);
  });
});

// ── trackAdminBroadcast() ─────────────────────────────────────────────────────

describe('trackAdminBroadcast()', () => {
  it('calls gtag with "admin_broadcast_sent"', () => {
    trackAdminBroadcast('critical', 'wankhede');
    expect(mockGtag).toHaveBeenCalledWith('event', 'admin_broadcast_sent', expect.any(Object));
  });

  it('sets target to "all" when no stadium is specified', () => {
    trackAdminBroadcast('info', null);
    const params = mockGtag.mock.calls[0][2];
    expect(params.target).toBe('all');
  });

  it('sets target to the stadium ID when specified', () => {
    trackAdminBroadcast('warning', 'eden_gardens');
    const params = mockGtag.mock.calls[0][2];
    expect(params.target).toBe('eden_gardens');
  });
});

// ── trackError() ──────────────────────────────────────────────────────────────

describe('trackError()', () => {
  it('calls gtag with "exception" event', () => {
    const { trackError } = require('@/lib/analytics');
    trackError('Gemini API unreachable');
    expect(mockGtag).toHaveBeenCalledWith('event', 'exception', expect.any(Object));
  });

  it('sets fatal=false by default', () => {
    const { trackError } = require('@/lib/analytics');
    trackError('Minor error');
    const params = mockGtag.mock.calls[0][2];
    expect(params.fatal).toBe(false);
  });

  it('sets fatal=true when explicitly passed', () => {
    const { trackError } = require('@/lib/analytics');
    trackError('Critical failure', true);
    const params = mockGtag.mock.calls[0][2];
    expect(params.fatal).toBe(true);
  });
});

// ── trackPerformance() ────────────────────────────────────────────────────────

describe('trackPerformance()', () => {
  it('calls gtag with "performance_metric" event', () => {
    const { trackPerformance } = require('@/lib/analytics');
    trackPerformance('ai_response_time', 312.7);
    expect(mockGtag).toHaveBeenCalledWith('event', 'performance_metric', expect.any(Object));
  });

  it('rounds the value to the nearest integer', () => {
    const { trackPerformance } = require('@/lib/analytics');
    trackPerformance('lcp', 1234.9);
    const params = mockGtag.mock.calls[0][2];
    expect(params.value).toBe(1235);
  });

  it('includes the metric name', () => {
    const { trackPerformance } = require('@/lib/analytics');
    trackPerformance('fcp', 800);
    const params = mockGtag.mock.calls[0][2];
    expect(params.metric_name).toBe('fcp');
  });
});
