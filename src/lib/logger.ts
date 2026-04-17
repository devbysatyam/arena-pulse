/**
 * @module logger
 * @description Structured logging utility for NexArena.
 *
 * Wraps console.* with:
 * - Log levels (debug, info, warn, error)
 * - Structured context objects (userId, stadiumId, screen)
 * - Production suppression of debug logs
 * - Consistent prefix format: [NexArena][LEVEL] message
 *
 * @example
 * logger.info('AI query sent', { screen: 'ai', charCount: 42 });
 * logger.error('Gemini key exhausted', { keyIndex: 2 });
 */

/** All possible log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured context attached to each log entry */
export interface LogContext {
  screen?: string;
  userId?: string;
  stadiumId?: string;
  keyIndex?: number;
  charCount?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const PREFIX = '[NexArena]';
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Format a log line for output.
 * @internal
 */
function format(level: LogLevel, message: string, context?: LogContext): string {
  const ts = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : '';
  return `${PREFIX}[${level.toUpperCase()}][${ts}] ${message}${ctx}`;
}

const logger = {
  /**
   * Log a debug-level message. Suppressed in production.
   * @param message - Human-readable description
   * @param context - Optional structured context
   */
  debug(message: string, context?: LogContext): void {
    if (!IS_PROD) {
      console.debug(format('debug', message, context));
    }
  },

  /**
   * Log an informational message.
   * @param message - Human-readable description
   * @param context - Optional structured context
   */
  info(message: string, context?: LogContext): void {
    console.info(format('info', message, context));
  },

  /**
   * Log a warning — non-fatal but notable.
   * @param message - Human-readable description
   * @param context - Optional structured context
   */
  warn(message: string, context?: LogContext): void {
    console.warn(format('warn', message, context));
  },

  /**
   * Log an error — should be investigated.
   * @param message - Human-readable description
   * @param context - Optional structured context
   */
  error(message: string, context?: LogContext): void {
    console.error(format('error', message, context));
  },
};

export { logger };
export default logger;
