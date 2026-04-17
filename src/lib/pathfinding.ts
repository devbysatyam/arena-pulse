// A* pathfinding on the concourse graph
// Guarantees paths NEVER cross the pitch area
import { GRAPH, WAYPOINTS, LOCATION_NODE_MAP, WaypointNode } from './stadium-data';

interface HeapNode { id: string; f: number; }

class MinHeap {
  private data: HeapNode[] = [];
  push(n: HeapNode) {
    this.data.push(n);
    this.data.sort((a, b) => a.f - b.f); // simple sort; graph is small
  }
  pop(): HeapNode | undefined { return this.data.shift(); }
  get size() { return this.data.length; }
}

const nodeMap = new Map<string, WaypointNode>(
  WAYPOINTS.map(n => [n.id, n])
);

function heuristic(a: string, b: string): number {
  const na = nodeMap.get(a);
  const nb = nodeMap.get(b);
  if (!na || !nb) return 0;
  return Math.hypot(na.x - nb.x, na.y - nb.y) * 0.3; // scale to seconds
}

export interface PathResult {
  path: string[];           // node IDs
  totalWeight: number;      // seconds
  coords: { x: number; y:number }[];
  found: boolean;
}

export function findPath(fromId: string, toId: string): PathResult {
  if (fromId === toId) {
    const n = nodeMap.get(fromId);
    return { path: [fromId], totalWeight: 0, coords: n ? [{ x: n.x, y: n.y }] : [], found: true };
  }

  const open = new MinHeap();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(fromId, 0);
  fScore.set(fromId, heuristic(fromId, toId));
  open.push({ id: fromId, f: fScore.get(fromId)! });

  while (open.size > 0) {
    const current = open.pop()!;
    if (current.id === toId) {
      // Reconstruct path
      const path: string[] = [];
      let cur: string | undefined = toId;
      while (cur) {
        path.unshift(cur);
        cur = cameFrom.get(cur);
      }
      const coords = path.map(id => {
        const n = nodeMap.get(id);
        return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
      });
      return { path, totalWeight: gScore.get(toId) ?? 0, coords, found: true };
    }

    const neighbors = GRAPH[current.id] ?? [];
    for (const { node: next, weight } of neighbors) {
      const tentative = (gScore.get(current.id) ?? Infinity) + weight;
      if (tentative < (gScore.get(next) ?? Infinity)) {
        cameFrom.set(next, current.id);
        gScore.set(next, tentative);
        const f = tentative + heuristic(next, toId);
        fScore.set(next, f);
        open.push({ id: next, f });
      }
    }
  }

  return { path: [], totalWeight: 0, coords: [], found: false };
}

// Resolve human-readable location → node ID
export function resolveLocation(loc: string): string {
  return LOCATION_NODE_MAP[loc] ?? loc;
}

// Route between two human-friendly locations
export function routeBetween(from: string, to: string): PathResult {
  return findPath(resolveLocation(from), resolveLocation(to));
}

// ETAString
export function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}

// Build extremely smooth Spline path over the coordinates so paths gracefully loop around pitch
export function pathToSVGPoints(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M${coords[0].x},${coords[0].y}`;
  
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const curr = coords[i];
    // Smooth quadratic bezier to next point (makes circular navigation visually pleasing)
    if (i < coords.length - 1) {
       const xc = (coords[i].x + coords[i+1].x) / 2;
       const yc = (coords[i].y + coords[i+1].y) / 2;
       d += ` Q${curr.x},${curr.y} ${xc},${yc}`;
    } else {
       d += ` T${curr.x},${curr.y}`;
    }
  }
  return d;
}
