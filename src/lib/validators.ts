/**
 * @module validators
 * @description Input validation and sanitization utilities for NexArena.
 *
 * All user-facing inputs pass through this module before being used in:
 * - Gemini AI requests
 * - Firebase write operations
 * - Admin broadcast forms
 *
 * Design principles:
 * - Never throw — always return a ValidationResult
 * - Sanitize before validate
 * - Provide actionable error messages
 */

/** Result of a validation check */
export interface ValidationResult {
  valid: boolean;
  /** Human-readable error message, only present when valid is false */
  error?: string;
  /** Sanitized single-value string (used by single-field validators) */
  sanitized?: string;
}

/** Typed result for multi-field broadcast validation — standalone type (not an extension) */
export type BroadcastValidationResult = {
  valid: boolean;
  error?: string;
  /** Sanitized fields — only present when valid is true */
  sanitized?: {
    title: string;
    body: string;
  };
};

/** Admin broadcast message shape */
export interface BroadcastInput {
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'critical';
}

/** Valid broadcast priority levels */
const VALID_PRIORITIES: BroadcastInput['priority'][] = ['info', 'warning', 'critical'];


/** Maximum allowed AI chat message length (characters) */
const MAX_AI_MESSAGE_LENGTH = 500;

/** Maximum allowed broadcast title length */
const MAX_TITLE_LENGTH = 80;

/** Maximum allowed broadcast body length */
const MAX_BODY_LENGTH = 300;

/**
 * Strips HTML tags and their inner content (for dangerous tags like script/style)
 * from a string to prevent XSS injection. Also trims surrounding whitespace.
 *
 * @param input - Raw text to sanitize
 * @returns Cleaned text string
 *
 * @example
 * sanitizeText('<script>alert(1)</script>hello') // → 'hello'
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    // Remove script and style tags including their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all remaining HTML tags (self-closing and open/close)
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validates an AI chat message entered by the user.
 *
 * Rules:
 * - Must not be empty or whitespace-only
 * - Must not exceed 500 characters
 * - Will be sanitized before return
 *
 * @param message - Raw user input from the AI chat box
 * @returns ValidationResult with sanitized message if valid
 *
 * @example
 * validateAIMessage('Where is my seat?')
 * // → { valid: true, sanitized: 'Where is my seat?' }
 */
export function validateAIMessage(message: string): ValidationResult {
  const sanitized = sanitizeText(message);

  if (!sanitized || sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (sanitized.length > MAX_AI_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${MAX_AI_MESSAGE_LENGTH} characters or fewer. Current: ${sanitized.length}.`,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validates an admin broadcast message before writing to Firebase.
 *
 * Rules:
 * - Title and body must not be empty
 * - Priority must be one of: 'info', 'warning', 'critical'
 * - Title and body are sanitized before validation to catch HTML injection
 *
 * @param input - Raw broadcast form data
 * @returns ValidationResult
 *
 * @example
 * validateAdminBroadcast({ title: 'Gate Update', body: 'Gate C now open', priority: 'info' })
 * // → { valid: true }
 */
export function validateAdminBroadcast(input: BroadcastInput): BroadcastValidationResult {
  const sanitizedTitle = sanitizeText(input.title);
  const sanitizedBody = sanitizeText(input.body);

  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return { valid: false, error: 'Broadcast title cannot be empty.' };
  }

  if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  }

  if (!sanitizedBody || sanitizedBody.length === 0) {
    return { valid: false, error: 'Broadcast body cannot be empty.' };
  }

  if (sanitizedBody.length > MAX_BODY_LENGTH) {
    return { valid: false, error: `Body must be ${MAX_BODY_LENGTH} characters or fewer.` };
  }

  if (!VALID_PRIORITIES.includes(input.priority)) {
    return {
      valid: false,
      error: `Invalid priority "${input.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}.`,
    };
  }

  return {
    valid: true,
    sanitized: { title: sanitizedTitle, body: sanitizedBody },
  };
}

/**
 * Validates an email address format.
 *
 * @param email - Email string to validate
 * @returns true if the email is syntactically valid, false otherwise
 *
 * @example
 * isValidEmail('fan@stadium.com') // → true
 * isValidEmail('not-an-email')    // → false
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // RFC 5322 simplified regex: must have local@domain.tld structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Alias for isValidEmail — used throughout the codebase for consistency.
 * @param email - Email string to validate
 */
export const validateEmail = isValidEmail;
