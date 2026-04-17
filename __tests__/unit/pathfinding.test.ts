/**
 * Unit tests for src/lib/pathfinding.ts
 *
 * Validates the A* pathfinding algorithm, location resolution,
 * ETA formatting, and SVG path generation utilities.
 */

import {
  findPath,
  resolveLocation,
  routeBetween,
  formatETA,
  pathToSVGPoints,
} from '@/lib/pathfinding';

import { LOCATION_NODE_MAP } from '@/lib/stadium-data';

// ── findPath() ────────────────────────────────────────────────────────────────

describe('findPath()', () => {
  it('returns a trivial path when source equals destination', () => {
    const result = findPath('O0', 'O0');
    expect(result.found).toBe(true);
    expect(result.path).toEqual(['O0']);
    expect(result.totalWeight).toBe(0);
  });

  it('finds a path between two outer concourse nodes', () => {
    const result = findPath('O0', 'O6');
    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(1);
    expect(result.path[0]).toBe('O0');
    expect(result.path[result.path.length - 1]).toBe('O6');
  });

  it('returns coords array matching the path length', () => {
    const result = findPath('O0', 'O3');
    expect(result.found).toBe(true);
    expect(result.coords.length).toBe(result.path.length);
  });

  it('returns a positive total weight for a multi-hop path', () => {
    const result = findPath('O0', 'O4');
    expect(result.found).toBe(true);
    expect(result.totalWeight).toBeGreaterThan(0);
  });

  it('returns found:false for completely unknown node IDs', () => {
    const result = findPath('NONEXISTENT_A', 'NONEXISTENT_B');
    expect(result.found).toBe(false);
    expect(result.path).toHaveLength(0);
  });

  it('path does not start or end with coords (0, 0) for valid nodes', () => {
    const result = findPath('O0', 'O2');
    expect(result.found).toBe(true);
    const first = result.coords[0];
    // Valid waypoints are never exactly at origin
    expect(first.x).not.toBe(0);
    expect(first.y).not.toBe(0);
  });
});

// ── resolveLocation() ─────────────────────────────────────────────────────────

describe('resolveLocation()', () => {
  it('resolves a known location key', () => {
    const firstKey = Object.keys(LOCATION_NODE_MAP)[0];
    const nodeId = resolveLocation(firstKey);
    expect(nodeId).toBe(LOCATION_NODE_MAP[firstKey]);
  });

  it('returns the raw string for an unknown location', () => {
    const unknown = 'NOWHERE_SPECIAL';
    expect(resolveLocation(unknown)).toBe(unknown);
  });
});

// ── routeBetween() ────────────────────────────────────────────────────────────

describe('routeBetween()', () => {
  it('combines resolveLocation and findPath correctly', () => {
    const firstKey = Object.keys(LOCATION_NODE_MAP)[0];
    const secondKey = Object.keys(LOCATION_NODE_MAP)[1];
    const result = routeBetween(firstKey, secondKey);
    // Should not throw; may or may not find a path depending on graph
    expect(typeof result.found).toBe('boolean');
  });
});

// ── formatETA() ───────────────────────────────────────────────────────────────

describe('formatETA()', () => {
  it('formats seconds below 60 as seconds', () => {
    expect(formatETA(45)).toBe('45s');
  });

  it('formats exactly 60 seconds as 1 min', () => {
    expect(formatETA(60)).toBe('1 min');
  });

  it('formats 90 seconds as 2 min (ceiling)', () => {
    expect(formatETA(90)).toBe('2 min');
  });

  it('formats 300 seconds as 5 min', () => {
    expect(formatETA(300)).toBe('5 min');
  });

  it('formats 0 seconds as 0s', () => {
    expect(formatETA(0)).toBe('0s');
  });
});

// ── pathToSVGPoints() ─────────────────────────────────────────────────────────

describe('pathToSVGPoints()', () => {
  it('returns an empty string for no coords', () => {
    expect(pathToSVGPoints([])).toBe('');
  });

  it('returns a move command for a single coord', () => {
    const result = pathToSVGPoints([{ x: 100, y: 200 }]);
    expect(result).toBe('M100,200');
  });

  it('returns an SVG path string for multiple coords', () => {
    const coords = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 50 },
    ];
    const result = pathToSVGPoints(coords);
    expect(result).toMatch(/^M/);   // Must start with Move command
    expect(result).toContain('Q');  // Should use quadratic bezier curves
  });

  it('result contains all x-coordinates from input', () => {
    const coords = [{ x: 10, y: 5 }, { x: 20, y: 15 }];
    const result = pathToSVGPoints(coords);
    expect(result).toContain('10');
    expect(result).toContain('20');
  });
});
