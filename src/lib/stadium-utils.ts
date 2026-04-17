/**
 * @module stadium-utils
 * @description Utility helpers for stadium data manipulation.
 *
 * Pure functions for computing derived values from stadium events,
 * sections, gates, and crowd data. Designed for testability —
 * no side effects, no network calls.
 */

import type { Section, Gate, Amenity } from './stadium-data';

/** Result of crowd analysis for a set of sections */
export interface CrowdReport {
  peakSection: string;
  clearSection: string;
  averageOccupancy: number;
  totalFans: number;
}

/** Categorised wait time */
export type WaitCategory = 'low' | 'moderate' | 'high';

/**
 * Converts an occupancy percentage (0–100) to a human-readable crowd label.
 *
 * @param occupancy - Value between 0 and 100
 * @returns Crowd descriptor string
 *
 * @example
 * getCrowdLabel(91) // → 'Peak 🔴'
 * getCrowdLabel(42) // → 'Clear 🟢'
 */
export function getCrowdLabel(occupancy: number): string {
  if (occupancy >= 85) return 'Peak 🔴';
  if (occupancy >= 65) return 'Busy 🟠';
  if (occupancy >= 40) return 'Moderate 🟡';
  return 'Clear 🟢';
}

/**
 * Converts an occupancy percentage to a CSS color for the heatmap.
 *
 * @param occupancy - Value between 0 and 100
 * @returns HSL color string suitable for CSS fill
 */
export function getCrowdColor(occupancy: number): string {
  // Green (120) → Yellow (60) → Red (0) based on occupancy
  const hue = Math.round(120 - (occupancy / 100) * 120);
  return `hsl(${hue}, 85%, 55%)`;
}

/**
 * Finds the least occupied open gate from a list.
 *
 * @param gates - Array of gate objects
 * @returns The gate with the lowest queue level, or null if no gates
 */
export function findBestExit(gates: Gate[]): Gate | null {
  const openGates = gates.filter(g => g.open);
  if (openGates.length === 0) return null;

  const queueOrder: Record<string, number> = { low: 1, moderate: 2, high: 3 };
  return openGates.sort((a, b) => queueOrder[a.queue] - queueOrder[b.queue])[0];
}

/**
 * Filters amenities to only those of a specific type near a section.
 *
 * @param amenities - All venue amenities
 * @param type - Amenity type to filter by
 * @param nearSection - Optional section ID to prioritise nearby results
 * @returns Sorted amenities (nearby first)
 */
export function getNearbyAmenities(
  amenities: Amenity[],
  type: Amenity['type'],
  nearSection?: string
): Amenity[] {
  const filtered = amenities.filter(a => a.type === type);
  if (!nearSection) return filtered;

  // Sort: same section first, then others
  return filtered.sort((a, b) => {
    const aClose = a.sectionNear === nearSection ? 0 : 1;
    const bClose = b.sectionNear === nearSection ? 0 : 1;
    return aClose - bClose;
  });
}

/**
 * Computes aggregate crowd statistics for a set of sections.
 *
 * @param sections - Array of stadium sections with occupancy data
 * @returns CrowdReport with peak, clear, average, and total fans
 */
export function computeCrowdReport(sections: Section[]): CrowdReport {
  if (sections.length === 0) {
    return { peakSection: '', clearSection: '', averageOccupancy: 0, totalFans: 0 };
  }

  let peakSection = sections[0];
  let clearSection = sections[0];
  let totalOccupied = 0;
  let totalFans = 0;

  for (const s of sections) {
    if (s.occupancy > peakSection.occupancy) peakSection = s;
    if (s.occupancy < clearSection.occupancy) clearSection = s;
    totalOccupied += s.occupancy;
    totalFans += Math.round((s.occupancy / 100) * s.capacity);
  }

  return {
    peakSection: peakSection.label,
    clearSection: clearSection.label,
    averageOccupancy: Math.round(totalOccupied / sections.length),
    totalFans,
  };
}

/**
 * Formats a food wait time into a user-friendly string.
 *
 * @param minutes - Wait time in minutes
 * @returns Formatted string like "~8 min" or "< 1 min"
 */
export function formatWaitTime(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  return `~${Math.ceil(minutes / 60)}h`;
}

/**
 * Returns the wait category label from a wait time in minutes.
 *
 * @param minutes - Wait time in minutes
 * @returns 'low' | 'moderate' | 'high'
 */
export function getWaitCategory(minutes: number): WaitCategory {
  if (minutes <= 7) return 'low';
  if (minutes <= 15) return 'moderate';
  return 'high';
}

/**
 * Truncates a long message for preview display (e.g. notification cards).
 *
 * @param text - Full text to truncate
 * @param maxLength - Maximum character count (default: 80)
 * @returns Truncated string with ellipsis if needed
 */
export function truncatePreview(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
