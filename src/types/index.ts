/**
 * @module types
 * @description Shared TypeScript types and interfaces for NexArena.
 *
 * Re-exports domain types from their canonical modules so consumers
 * can import from a single location without tight coupling to
 * implementation files.
 */

export type { Screen, CartItem, Order, User, AppState, AppNotification } from '@/store/app-store';
export type { PathResult } from '@/lib/pathfinding';
export type { ValidationResult, BroadcastValidationResult, BroadcastInput } from '@/lib/validators';
export type { LogLevel, LogContext } from '@/lib/logger';
export type { RateLimiterOptions, ConsumeResult } from '@/lib/rate-limit';
