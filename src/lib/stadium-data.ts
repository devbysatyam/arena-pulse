// Stadium data: sections, gates, amenities, waypoint graph for pathfinding
// All positions are in a normalized coordinate system (-1 to 1 each axis)
// The pitch is in the center — paths MUST go around the concourse

export interface Section {
  id: string;
  label: string;
  color: string;          // crowd density color
  occupancy: number;      // 0–100
  capacity: number;
  angle: number;          // degrees from North (clockwise)
  highlight?: boolean;
}

export interface Gate {
  id: string;
  label: string;
  x: number; y: number;   // SVG coords in viewBox 0 0 400 340
  open: boolean;
  queue: 'low' | 'moderate' | 'high';
}

export interface Amenity {
  id: string;
  type: 'food' | 'wc' | 'firstaid' | 'info' | 'atm' | 'merch';
  label: string;
  level: number;           // floor
  sectionNear: string;
  x: number; y: number;   // SVG coords
  queue?: 'low' | 'moderate' | 'high';
  waitMin?: number;
  category?: 'food' | 'drink' | 'snack' | 'all';
}

export interface WaypointNode {
  id: string;
  x: number; y: number;   // SVG coords
  type: 'concourse-outer' | 'concourse-inner' | 'gate' | 'section-entry' | 'stair' | 'amenity';
  label?: string;
  accessible?: boolean;
}

export interface WaypointEdge {
  from: string;
  to: string;
  weight: number;          // estimated walk time in seconds
  restricted?: boolean;    // cannot traverse (pitch, private area)
}

// ─── SVG ViewBox: 0 0 400 340 ───────────────────────────────────────────────
// Stadium center: (200, 170)
// Outer concourse radius: ~155 x ~130
// Inner concourse radius: ~110 x ~88
// Pitch block: ~90 x ~70 (absolute no-go)

const CX = 200, CY = 170;
const OR = { rx: 155, ry: 128 }; // outer concourse
const IR = { rx: 108, ry: 88 };  // inner concourse (section entries)

// Convert polar (angle in degrees CCW from North) to SVG coords on ellipse
function ellipsePoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + rx * Math.cos(rad),
    y: cy + ry * Math.sin(rad),
  };
}

// Outer concourse waypoints (12 clock positions)
const OUTER_ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];
// Inner concourse waypoints (12 positions)
const INNER_ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];

export const WAYPOINTS: WaypointNode[] = [
  // Outer concourse ring
  ...OUTER_ANGLES.map((a, i) => {
    const p = ellipsePoint(CX, CY, OR.rx, OR.ry, a);
    return { id: `O${i}`, x: p.x, y: p.y, type: 'concourse-outer' as const, label: `Outer-${a}°` };
  }),
  // Inner concourse ring (section entries)
  ...INNER_ANGLES.map((a, i) => {
    const p = ellipsePoint(CX, CY, IR.rx, IR.ry, a);
    return { id: `I${i}`, x: p.x, y: p.y, type: 'concourse-inner' as const, label: `Inner-${a}°` };
  }),
  // Gates (outer perimeter)
  { id: 'GA', x: 200, y: 30, type: 'gate', label: 'Gate A (North)' },
  { id: 'GB', x: 334, y: 80, type: 'gate', label: 'Gate B (NE)' },
  { id: 'GC', x: 360, y: 170, type: 'gate', label: 'Gate C4 (East)' },
  { id: 'GD', x: 334, y: 262, type: 'gate', label: 'Gate D (SE)' },
  { id: 'GE', x: 200, y: 310, type: 'gate', label: 'Gate E (South)' },
  { id: 'GF', x: 66,  y: 262, type: 'gate', label: 'Gate F (SW)' },
  { id: 'GG', x: 40,  y: 170, type: 'gate', label: 'Gate G (West)' },
  { id: 'GH', x: 66,  y: 80,  type: 'gate', label: 'Gate H (NW)' },
  // Section entries (inner ring access points)
  { id: 'SA0',  x: 200, y: 90,  type: 'section-entry', label: 'Block A Entry N' },
  { id: 'SA1',  x: 295, y: 115, type: 'section-entry', label: 'Block B Entry NE' },
  { id: 'SA2',  x: 305, y: 170, type: 'section-entry', label: 'Block C Entry E' },
  { id: 'SA3',  x: 295, y: 225, type: 'section-entry', label: 'Block D Entry SE' },
  { id: 'SA4',  x: 200, y: 252, type: 'section-entry', label: 'Block E Entry S' },
  { id: 'SA5',  x: 105, y: 225, type: 'section-entry', label: 'Block F Entry SW' },
  { id: 'SA6',  x: 95,  y: 170, type: 'section-entry', label: 'Block G Entry W' },
  { id: 'SA7',  x: 105, y: 115, type: 'section-entry', label: 'Block H Entry NW' },
  // Stairs
  { id: 'STN1', x: 183, y: 55, type: 'stair', label: 'North Stairs L1' },
  { id: 'STE1', x: 348, y: 155, type: 'stair', label: 'East Stairs L1' },
  { id: 'STS1', x: 183, y: 295, type: 'stair', label: 'South Stairs L1' },
  { id: 'STW1', x: 52,  y: 155, type: 'stair', label: 'West Stairs L1' },
];

// Concourse edge graph — ALL edges follow the concourse rings (no pitch cross)
export const EDGES: WaypointEdge[] = [
  // Outer ring connections (clockwise chain)
  { from:'O0',  to:'O1',  weight:15 },
  { from:'O1',  to:'O2',  weight:15 },
  { from:'O2',  to:'O3',  weight:15 },
  { from:'O3',  to:'O4',  weight:15 },
  { from:'O4',  to:'O5',  weight:15 },
  { from:'O5',  to:'O6',  weight:15 },
  { from:'O6',  to:'O7',  weight:15 },
  { from:'O7',  to:'O8',  weight:15 },
  { from:'O8',  to:'O9',  weight:15 },
  { from:'O9',  to:'O10', weight:15 },
  { from:'O10', to:'O11', weight:15 },
  { from:'O11', to:'O0',  weight:15 },

  // Inner ring connections (clockwise)
  { from:'I0',  to:'I1',  weight:12 },
  { from:'I1',  to:'I2',  weight:12 },
  { from:'I2',  to:'I3',  weight:12 },
  { from:'I3',  to:'I4',  weight:12 },
  { from:'I4',  to:'I5',  weight:12 },
  { from:'I5',  to:'I6',  weight:12 },
  { from:'I6',  to:'I7',  weight:12 },
  { from:'I7',  to:'I8',  weight:12 },
  { from:'I8',  to:'I9',  weight:12 },
  { from:'I9',  to:'I10', weight:12 },
  { from:'I10', to:'I11', weight:12 },
  { from:'I11', to:'I0',  weight:12 },

  // Radial corridors (outer ↔ inner) — these are access corridors NOT across pitch
  { from:'O0',  to:'I0',  weight:8 },
  { from:'O1',  to:'I1',  weight:8 },
  { from:'O2',  to:'I2',  weight:8 },
  { from:'O3',  to:'I3',  weight:8 },
  { from:'O4',  to:'I4',  weight:8 },
  { from:'O5',  to:'I5',  weight:8 },
  { from:'O6',  to:'I6',  weight:8 },
  { from:'O7',  to:'I7',  weight:8 },
  { from:'O8',  to:'I8',  weight:8 },
  { from:'O9',  to:'I9',  weight:8 },
  { from:'O10', to:'I10', weight:8 },
  { from:'O11', to:'I11', weight:8 },

  // Gate connections to outer ring
  { from:'GA',  to:'O0',  weight:5 },
  { from:'GB',  to:'O2',  weight:5 },
  { from:'GC',  to:'O3',  weight:5 },
  { from:'GD',  to:'O4',  weight:5 },
  { from:'GE',  to:'O6',  weight:5 },
  { from:'GF',  to:'O8',  weight:5 },
  { from:'GG',  to:'O9',  weight:5 },
  { from:'GH',  to:'O10', weight:5 },

  // Section entries to inner ring
  { from:'SA0', to:'I0',  weight:5 },
  { from:'SA1', to:'I2',  weight:5 },
  { from:'SA2', to:'I3',  weight:5 },
  { from:'SA3', to:'I4',  weight:5 },
  { from:'SA4', to:'I6',  weight:5 },
  { from:'SA5', to:'I8',  weight:5 },
  { from:'SA6', to:'I9',  weight:5 },
  { from:'SA7', to:'I10', weight:5 },

  // Stairs
  { from:'STN1', to:'O0', weight:6 },
  { from:'STE1', to:'O3', weight:6 },
  { from:'STS1', to:'O6', weight:6 },
  { from:'STW1', to:'O9', weight:6 },
];

// Adjacency list for fast lookup
export const GRAPH: Record<string, Array<{ node: string; weight: number }>> = {};
for (const edge of EDGES) {
  if (!GRAPH[edge.from]) GRAPH[edge.from] = [];
  if (!GRAPH[edge.to])   GRAPH[edge.to]   = [];
  GRAPH[edge.from].push({ node: edge.to,   weight: edge.weight });
  GRAPH[edge.to]  .push({ node: edge.from, weight: edge.weight });
}

// ─── Sections ────────────────────────────────────────────────────────────────
export const SECTIONS: Section[] = [
  { id:'A', label:'North (A)', color:'#00ff9d', occupancy: 42, capacity:8000, angle:0 },
  { id:'B', label:'NE (B)',    color:'#ffb800', occupancy: 64, capacity:5000, angle:45 },
  { id:'C', label:'East (C)',  color:'#ff8c00', occupancy: 78, capacity:7500, angle:90 },
  { id:'D', label:'SE (D)',    color:'#ff4d6a', occupancy: 91, capacity:5000, angle:135 },
  { id:'E', label:'South (E)', color:'#ff4d6a', occupancy: 88, capacity:8000, angle:180 },
  { id:'F', label:'SW (F)',    color:'#ff8c00', occupancy: 72, capacity:5000, angle:225 },
  { id:'G', label:'West (G)',  color:'#ffb800', occupancy: 55, capacity:7500, angle:270 },
  { id:'H', label:'NW (H)',    color:'#00ff9d', occupancy: 31, capacity:5000, angle:315 },
];

export function getCrowdColor(occ: number): string {
  if (occ < 36) return '#00ff9d';
  if (occ < 61) return '#ffb800';
  if (occ < 81) return '#ff8c00';
  return '#ff4d6a';
}

export function getCrowdLabel(occ: number): string {
  if (occ < 36) return 'Clear';
  if (occ < 61) return 'Moderate';
  if (occ < 81) return 'Busy';
  return 'Peak';
}

// ─── Gates ───────────────────────────────────────────────────────────────────
export const GATES: Gate[] = [
  { id:'GA', label:'Gate A', x:200, y:30,  open:true,  queue:'low' },
  { id:'GB', label:'Gate B', x:334, y:80,  open:true,  queue:'moderate' },
  { id:'GC', label:'Gate C4',x:365, y:170, open:true,  queue:'high' },
  { id:'GD', label:'Gate D', x:334, y:262, open:true,  queue:'moderate' },
  { id:'GE', label:'Gate E2',x:200, y:310, open:true,  queue:'low' },
  { id:'GF', label:'Gate F', x:66,  y:262, open:false, queue:'low' },
  { id:'GG', label:'Gate G', x:35,  y:170, open:true,  queue:'low' },
  { id:'GH', label:'Gate H', x:66,  y:80,  open:true,  queue:'low' },
];

// ─── Amenities ───────────────────────────────────────────────────────────────
export const AMENITIES: Amenity[] = [
  // Food stalls (amber dots)
  { id:'F1',  type:'food', category:'food',   label:'Stall B3 — Gourmet Burgers',   level:1, sectionNear:'C', x:305, y:128, queue:'low',      waitMin:8 },
  { id:'F2',  type:'food', category:'drink',  label:'Brew & Craft — Draft Beer',   level:1, sectionNear:'A', x:150, y:46,  queue:'moderate', waitMin:14 },
  { id:'F3',  type:'food', category:'food',   label:'Pizza Palace — SE Stand',     level:1, sectionNear:'D', x:305, y:215, queue:'high',     waitMin:22 },
  { id:'F4',  type:'food', category:'snack',  label:'Pop & Crunch — Snacks',       level:1, sectionNear:'G', x:55,  y:155, queue:'low',      waitMin:6 },
  { id:'F5',  type:'food', category:'drink',  label:'Liquid Gold — Cocktails',     level:1, sectionNear:'E', x:160, y:296, queue:'moderate', waitMin:12 },
  { id:'F6',  type:'food', category:'snack',  label:'Treat Hub — NW Stand',        level:1, sectionNear:'H', x:95,  y:55,  queue:'low',      waitMin:5 },
  // WC (blue dots)
  { id:'W1',  type:'wc',      label:'WC Block North',              level:1, sectionNear:'A', x:200, y:55,  },
  { id:'W2',  type:'wc',      label:'WC Block East',               level:1, sectionNear:'C', x:347, y:170, },
  { id:'W3',  type:'wc',      label:'WC Block South',              level:1, sectionNear:'E', x:200, y:285, },
  { id:'W4',  type:'wc',      label:'WC Block West',               level:1, sectionNear:'G', x:55,  y:170, },
  // First Aid
  { id:'FA1', type:'firstaid',label:'First Aid — NE',              level:1, sectionNear:'B', x:316, y:94,  },
  { id:'FA2', type:'firstaid',label:'First Aid — SW',              level:1, sectionNear:'F', x:86,  y:248, },
  // Info
  { id:'IN1', type:'info',    label:'Info Point — North',          level:0, sectionNear:'A', x:200, y:42,  },
  { id:'IN2', type:'info',    label:'Info Point — South',          level:0, sectionNear:'E', x:200, y:298, },
  // ATM
  { id:'AT1', type:'atm',     label:'ATM — East Concourse',        level:1, sectionNear:'C', x:350, y:145, },
  // Merch
  { id:'M1',  type:'merch',   label:'Official Store — South',      level:0, sectionNear:'E', x:240, y:300, },
];

export type AmenityType = Amenity['type'];

export const AMENITY_ICONS: Record<AmenityType, string> = {
  food:     '🍔',
  wc:       '🚻',
  firstaid: '🏥',
  info:     'ℹ️',
  atm:      '💳',
  merch:    '🛍️',
};

export const AMENITY_COLORS: Record<AmenityType, string> = {
  food:     '#ffb800',
  wc:       '#378add',
  firstaid: '#ff4d6a',
  info:     '#00d4ff',
  atm:      '#00ff9d',
  merch:    '#c070de',
};

// Nearest waynode to an amenity/gate/section (for pathfinding)
export const LOCATION_NODE_MAP: Record<string, string> = {
  // Gates → waypoint IDs
  GA: 'GA', GB: 'GB', GC: 'GC', GD: 'GD',
  GE: 'GE', GF: 'GF', GG: 'GG', GH: 'GH',
  // Sections → section entry waypoints
  A: 'SA0', B: 'SA1', C: 'SA2', D: 'SA3',
  E: 'SA4', F: 'SA5', G: 'SA6', H: 'SA7',
  // Amenities → nearest outer node
  F1:'O3', F2:'O11', F3:'O4', F4:'O9', F5:'O7', F6:'O10',
  W1:'O0', W2:'O3',  W3:'O6', W4:'O9',
  FA1:'O2', FA2:'O8', IN1:'O0', IN2:'O6',
  AT1:'O3', M1:'O6',
};

// Event data
export const MATCH = {
  homeTeam:  'Chelsea FC',
  awayTeam:  'Arsenal FC',
  date:      'April 16, 2026',
  kickoff:   '15:00',
  venue:     'Wembley Stadium',
  attendance: 58240,
  capacity:   90000,
  score:     '1 - 0',
  minute:    67,
  status:    'live' as const,
};

export const USER_SEAT = {
  section: 'C',
  block:   'B14',
  row:     '22',
  seat:    '7',
  gate:    'GC',
  entryNode: 'SA2',
};
