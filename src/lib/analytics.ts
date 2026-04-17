/**
 * @module analytics
 * @description Google Analytics 4 event tracking for NexArena.
 *
 * Wraps the gtag() global function with typed event helpers.
 * All tracking is no-op if gtag is not loaded (e.g., during
 * server-side rendering or if the script is blocked).
 *
 * Key events tracked:
 * - Page views (automatic via Next.js integration)
 * - AI queries
 * - Food orders placed
 * - Map views opened
 * - Admin actions
 * - Stadium selections
 * - Error monitoring
 * - Web Vitals / Performance
 */

/** Google Analytics 4 Measurement ID */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

/**
 * Safely call the global gtag function.
 * No-op if gtag is not available (SSR, blocked by adblocker, etc.)
 */
function gtag(...args: any[]): void {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag(...args);
  }
}

/**
 * Track an AI concierge query event.
 *
 * @param queryLength - Number of characters in the message
 * @param usedFallback - Whether the fallback response was used (API down)
 */
export function trackAIQuery(queryLength: number, usedFallback = false): void {
  gtag('event', 'ai_query_sent', {
    event_category: 'AI Concierge',
    value: queryLength,
    used_fallback: usedFallback,
  });
}

/**
 * Track when a user views the Map screen.
 *
 * @param mapType - The type of map opened: '2d', '3d', or 'ar'
 */
export function trackMapView(mapType: '2d' | '3d' | 'ar'): void {
  gtag('event', 'map_view_opened', {
    event_category: 'Navigation',
    map_type: mapType,
  });
}

/**
 * Track a food order placement.
 *
 * @param stallId - The stall ID from which the order was placed
 * @param itemCount - Number of items in the order
 * @param totalValue - Total value in INR
 */
export function trackFoodOrder(stallId: string, itemCount: number, totalValue: number): void {
  gtag('event', 'food_order_placed', {
    event_category: 'Catering',
    stall_id: stallId,
    item_count: itemCount,
    value: totalValue,
    currency: 'INR',
  });
}

/**
 * Track when a user selects a stadium to view.
 *
 * @param stadiumId - The stadium ID from the STADIUMS data array
 * @param stadiumName - Human-readable stadium name
 */
export function trackStadiumView(stadiumId: string, stadiumName: string): void {
  gtag('event', 'stadium_selected', {
    event_category: 'Stadium Browser',
    stadium_id: stadiumId,
    stadium_name: stadiumName,
  });
}

/**
 * Track admin panel login.
 *
 * @param success - Whether the login was successful
 */
export function trackAdminLogin(success: boolean): void {
  gtag('event', 'admin_login_attempt', {
    event_category: 'Admin',
    success,
  });
}

/**
 * Track when an admin broadcasts a notification.
 *
 * @param priority - Broadcast priority level
 * @param targetStadiumId - Stadium ID targeted, or null for all
 */
export function trackAdminBroadcast(priority: string, targetStadiumId: string | null): void {
  gtag('event', 'admin_broadcast_sent', {
    event_category: 'Admin',
    priority,
    target: targetStadiumId ?? 'all',
  });
}

/**
 * Track an application error.
 * Useful for monitoring production stability via GA4.
 */
export function trackError(message: string, fatal = false): void {
  gtag('event', 'exception', {
    description: message,
    fatal: fatal,
  });
}

/**
 * Track a custom performance metric (e.g. AI response time).
 */
export function trackPerformance(name: string, value: number): void {
  gtag('event', 'performance_metric', {
    metric_name: name,
    value: Math.round(value),
  });
}
