/**
 * Unit tests for src/lib/stadium-utils.ts
 *
 * Tests all pure helper functions for crowd analysis,
 * gate selection, amenity filtering, and display formatting.
 */

import {
  getCrowdLabel,
  getCrowdColor,
  findBestExit,
  getNearbyAmenities,
  computeCrowdReport,
  formatWaitTime,
  getWaitCategory,
  truncatePreview,
} from '@/lib/stadium-utils';

import type { Section, Gate, Amenity } from '@/lib/stadium-data';

// ── Test data fixtures ────────────────────────────────────────────────────────

const mockSections: Section[] = [
  { id: 'south', label: 'South Stand', color: '#ff4444', occupancy: 91, capacity: 8000, angle: 180 },
  { id: 'north', label: 'North Stand', color: '#44ff44', occupancy: 38, capacity: 7000, angle: 0 },
  { id: 'east',  label: 'East Stand',  color: '#ffaa44', occupancy: 72, capacity: 6000, angle: 90 },
];

const mockGates: Gate[] = [
  { id: 'g1', label: 'Gate A', x: 200, y: 10,  open: true,  queue: 'high'     },
  { id: 'g2', label: 'Gate B', x: 390, y: 170, open: true,  queue: 'moderate' },
  { id: 'g3', label: 'Gate C', x: 200, y: 330, open: true,  queue: 'low'      },
  { id: 'g4', label: 'Gate D', x: 10,  y: 170, open: false, queue: 'low'      },
];

const mockAmenities: Amenity[] = [
  { id: 'f1', type: 'food', label: 'Stall B3', level: 1, sectionNear: 'east',  x: 250, y: 100, waitMin: 8  },
  { id: 'f2', type: 'food', label: 'Stall A7', level: 1, sectionNear: 'north', x: 200, y: 30,  waitMin: 14 },
  { id: 'w1', type: 'wc',   label: 'WC North', level: 1, sectionNear: 'north', x: 200, y: 40  },
  { id: 'w2', type: 'wc',   label: 'WC East',  level: 1, sectionNear: 'east',  x: 300, y: 170 },
];

// ── getCrowdLabel() ───────────────────────────────────────────────────────────

describe('getCrowdLabel()', () => {
  it('returns "Peak 🔴" for occupancy ≥ 85', () => {
    expect(getCrowdLabel(85)).toContain('Peak');
    expect(getCrowdLabel(100)).toContain('Peak');
  });

  it('returns "Busy 🟠" for occupancy 65–84', () => {
    expect(getCrowdLabel(65)).toContain('Busy');
    expect(getCrowdLabel(80)).toContain('Busy');
  });

  it('returns "Moderate 🟡" for occupancy 40–64', () => {
    expect(getCrowdLabel(40)).toContain('Moderate');
    expect(getCrowdLabel(60)).toContain('Moderate');
  });

  it('returns "Clear 🟢" for occupancy below 40', () => {
    expect(getCrowdLabel(0)).toContain('Clear');
    expect(getCrowdLabel(39)).toContain('Clear');
  });
});

// ── getCrowdColor() ───────────────────────────────────────────────────────────

describe('getCrowdColor()', () => {
  it('returns an HSL colour string', () => {
    expect(getCrowdColor(50)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('returns red-family colour for high occupancy', () => {
    const color = getCrowdColor(100);
    const hue = parseInt(color.match(/hsl\((\d+)/)?.[1] ?? '999');
    expect(hue).toBeLessThan(10); // Near 0 = red
  });

  it('returns green-family colour for low occupancy', () => {
    const color = getCrowdColor(0);
    const hue = parseInt(color.match(/hsl\((\d+)/)?.[1] ?? '0');
    expect(hue).toBeGreaterThan(100); // Near 120 = green
  });
});

// ── findBestExit() ────────────────────────────────────────────────────────────

describe('findBestExit()', () => {
  it('returns the gate with the lowest queue level', () => {
    const result = findBestExit(mockGates);
    expect(result?.queue).toBe('low');
    expect(result?.label).toBe('Gate C');
  });

  it('ignores closed gates', () => {
    const result = findBestExit(mockGates);
    // Gate D is closed and has 'low' queue — should NOT be returned
    expect(result?.id).not.toBe('g4');
  });

  it('returns null if all gates are closed', () => {
    const closedGates: Gate[] = mockGates.map(g => ({ ...g, open: false }));
    expect(findBestExit(closedGates)).toBeNull();
  });

  it('returns null for an empty gates array', () => {
    expect(findBestExit([])).toBeNull();
  });
});

// ── getNearbyAmenities() ──────────────────────────────────────────────────────

describe('getNearbyAmenities()', () => {
  it('filters by amenity type', () => {
    const food = getNearbyAmenities(mockAmenities, 'food');
    expect(food.every(a => a.type === 'food')).toBe(true);
  });

  it('returns all WC amenities', () => {
    const wcs = getNearbyAmenities(mockAmenities, 'wc');
    expect(wcs.length).toBe(2);
  });

  it('puts the nearby section first when nearSection is provided', () => {
    const food = getNearbyAmenities(mockAmenities, 'food', 'east');
    expect(food[0].sectionNear).toBe('east');
  });

  it('returns empty array when no amenities match type', () => {
    const atms = getNearbyAmenities(mockAmenities, 'atm');
    expect(atms).toHaveLength(0);
  });
});

// ── computeCrowdReport() ──────────────────────────────────────────────────────

describe('computeCrowdReport()', () => {
  it('identifies the peak and clear sections correctly', () => {
    const report = computeCrowdReport(mockSections);
    expect(report.peakSection).toBe('South Stand');
    expect(report.clearSection).toBe('North Stand');
  });

  it('computes average occupancy correctly', () => {
    // (91 + 38 + 72) / 3 = 67
    const report = computeCrowdReport(mockSections);
    expect(report.averageOccupancy).toBe(67);
  });

  it('computes total fans from occupancy × capacity', () => {
    const report = computeCrowdReport(mockSections);
    // south: 91% of 8000 = 7280, north: 38% of 7000 = 2660, east: 72% of 6000 = 4320
    expect(report.totalFans).toBeGreaterThan(0);
  });

  it('handles empty sections gracefully', () => {
    const report = computeCrowdReport([]);
    expect(report.averageOccupancy).toBe(0);
    expect(report.totalFans).toBe(0);
  });
});

// ── formatWaitTime() ──────────────────────────────────────────────────────────

describe('formatWaitTime()', () => {
  it('shows "< 1 min" for sub-minute waits', () => {
    expect(formatWaitTime(0)).toBe('< 1 min');
    expect(formatWaitTime(0.5)).toBe('< 1 min');
  });

  it('shows minutes for waits under an hour', () => {
    expect(formatWaitTime(8)).toBe('~8 min');
    expect(formatWaitTime(14)).toBe('~14 min');
  });

  it('shows hours for waits 60+ minutes', () => {
    expect(formatWaitTime(60)).toBe('~1h');
    expect(formatWaitTime(120)).toBe('~2h');
  });
});

// ── getWaitCategory() ─────────────────────────────────────────────────────────

describe('getWaitCategory()', () => {
  it('returns "low" for 0–7 minutes', () => {
    expect(getWaitCategory(0)).toBe('low');
    expect(getWaitCategory(7)).toBe('low');
  });

  it('returns "moderate" for 8–15 minutes', () => {
    expect(getWaitCategory(8)).toBe('moderate');
    expect(getWaitCategory(15)).toBe('moderate');
  });

  it('returns "high" for > 15 minutes', () => {
    expect(getWaitCategory(16)).toBe('high');
    expect(getWaitCategory(60)).toBe('high');
  });
});

// ── truncatePreview() ─────────────────────────────────────────────────────────

describe('truncatePreview()', () => {
  it('returns the full string when under the limit', () => {
    const short = 'Gate C is now open.';
    expect(truncatePreview(short)).toBe(short);
  });

  it('truncates long strings and appends ellipsis', () => {
    const long = 'A'.repeat(100);
    const result = truncatePreview(long, 80);
    expect(result.length).toBeLessThanOrEqual(81); // 80 chars + ellipsis
    expect(result).toMatch(/…$/);
  });

  it('uses a custom maxLength', () => {
    const text = 'Hello World! This is a notification message.';
    const result = truncatePreview(text, 10);
    expect(result.length).toBeLessThanOrEqual(11);
  });
});
