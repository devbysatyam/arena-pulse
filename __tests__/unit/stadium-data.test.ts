/**
 * Unit tests for src/lib/stadium-data.ts
 *
 * Validates the data integrity of stadium sections, gates, amenities,
 * and the waypoint graph used for pathfinding.
 */

import {
  SECTIONS,
  GATES,
  AMENITIES,
  WAYPOINTS,
  GRAPH,
  LOCATION_NODE_MAP,
} from '@/lib/stadium-data';

// ── SECTIONS ──────────────────────────────────────────────────────────────────

describe('SECTIONS data integrity', () => {
  it('exports a non-empty array of sections', () => {
    expect(Array.isArray(SECTIONS)).toBe(true);
    expect(SECTIONS.length).toBeGreaterThan(0);
  });

  it('every section has required fields', () => {
    SECTIONS.forEach(section => {
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('label');
      expect(section).toHaveProperty('occupancy');
      expect(section).toHaveProperty('capacity');
      expect(section).toHaveProperty('color');
    });
  });

  it('all section IDs are unique', () => {
    const ids = SECTIONS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all section occupancies are within 0–100', () => {
    SECTIONS.forEach(section => {
      expect(section.occupancy).toBeGreaterThanOrEqual(0);
      expect(section.occupancy).toBeLessThanOrEqual(100);
    });
  });

  it('all section capacities are positive integers', () => {
    SECTIONS.forEach(section => {
      expect(section.capacity).toBeGreaterThan(0);
      expect(Number.isInteger(section.capacity)).toBe(true);
    });
  });
});

// ── GATES ─────────────────────────────────────────────────────────────────────

describe('GATES data integrity', () => {
  it('exports a non-empty array of gates', () => {
    expect(Array.isArray(GATES)).toBe(true);
    expect(GATES.length).toBeGreaterThan(0);
  });

  it('every gate has required fields', () => {
    GATES.forEach(gate => {
      expect(gate).toHaveProperty('id');
      expect(gate).toHaveProperty('label');
      expect(gate).toHaveProperty('x');
      expect(gate).toHaveProperty('y');
      expect(gate).toHaveProperty('open');
      expect(gate).toHaveProperty('queue');
    });
  });

  it('all gate queue values are valid', () => {
    const validQueues = new Set(['low', 'moderate', 'high']);
    GATES.forEach(gate => {
      expect(validQueues.has(gate.queue)).toBe(true);
    });
  });

  it('all gate coordinates are within the SVG viewBox (0–400 x 0–340)', () => {
    GATES.forEach(gate => {
      expect(gate.x).toBeGreaterThanOrEqual(0);
      expect(gate.x).toBeLessThanOrEqual(400);
      expect(gate.y).toBeGreaterThanOrEqual(0);
      expect(gate.y).toBeLessThanOrEqual(340);
    });
  });
});

// ── AMENITIES ─────────────────────────────────────────────────────────────────

describe('AMENITIES data integrity', () => {
  it('exports a non-empty array of amenities', () => {
    expect(Array.isArray(AMENITIES)).toBe(true);
    expect(AMENITIES.length).toBeGreaterThan(0);
  });

  it('every amenity has required fields', () => {
    AMENITIES.forEach(amenity => {
      expect(amenity).toHaveProperty('id');
      expect(amenity).toHaveProperty('type');
      expect(amenity).toHaveProperty('label');
      expect(amenity).toHaveProperty('level');
    });
  });

  it('all amenity types are valid', () => {
    const validTypes = new Set(['food', 'wc', 'firstaid', 'info', 'atm', 'merch']);
    AMENITIES.forEach(amenity => {
      expect(validTypes.has(amenity.type)).toBe(true);
    });
  });

  it('food amenities have wait times', () => {
    const foodAmenities = AMENITIES.filter(a => a.type === 'food');
    // At least some food amenities should have wait times
    const withWaitTimes = foodAmenities.filter(a => a.waitMin !== undefined);
    expect(withWaitTimes.length).toBeGreaterThan(0);
  });

  it('all amenity IDs are unique', () => {
    const ids = AMENITIES.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ── WAYPOINTS ─────────────────────────────────────────────────────────────────

describe('WAYPOINTS data integrity', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(WAYPOINTS)).toBe(true);
    expect(WAYPOINTS.length).toBeGreaterThan(0);
  });

  it('all waypoint IDs are unique', () => {
    const ids = WAYPOINTS.map(w => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all waypoints have valid type fields', () => {
    const validTypes = new Set([
      'concourse-outer', 'concourse-inner', 'gate', 'section-entry', 'stair', 'amenity',
    ]);
    WAYPOINTS.forEach(wp => {
      expect(validTypes.has(wp.type)).toBe(true);
    });
  });
});

// ── GRAPH ─────────────────────────────────────────────────────────────────────

describe('GRAPH adjacency list integrity', () => {
  it('exports a non-empty object', () => {
    expect(typeof GRAPH).toBe('object');
    expect(Object.keys(GRAPH).length).toBeGreaterThan(0);
  });

  it('every graph node key corresponds to a waypoint ID', () => {
    const waypointIds = new Set(WAYPOINTS.map(w => w.id));
    Object.keys(GRAPH).forEach(nodeId => {
      expect(waypointIds.has(nodeId)).toBe(true);
    });
  });

  it('all edge weights are positive numbers', () => {
    Object.values(GRAPH).forEach(edges => {
      edges.forEach(edge => {
        expect(edge.weight).toBeGreaterThan(0);
        expect(typeof edge.weight).toBe('number');
      });
    });
  });

  it('every edge target node exists in waypoints', () => {
    const waypointIds = new Set(WAYPOINTS.map(w => w.id));
    Object.values(GRAPH).forEach(edges => {
      edges.forEach(edge => {
        expect(waypointIds.has(edge.node)).toBe(true);
      });
    });
  });
});

// ── LOCATION_NODE_MAP ─────────────────────────────────────────────────────────

describe('LOCATION_NODE_MAP', () => {
  it('exports a non-empty object', () => {
    expect(typeof LOCATION_NODE_MAP).toBe('object');
    expect(Object.keys(LOCATION_NODE_MAP).length).toBeGreaterThan(0);
  });

  it('all mapped node IDs exist in WAYPOINTS', () => {
    const waypointIds = new Set(WAYPOINTS.map(w => w.id));
    Object.values(LOCATION_NODE_MAP).forEach(nodeId => {
      expect(waypointIds.has(nodeId)).toBe(true);
    });
  });
});
