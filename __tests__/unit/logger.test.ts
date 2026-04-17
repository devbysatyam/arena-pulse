/**
 * Unit tests for src/lib/logger.ts
 *
 * Validates structured log formatting, log level suppression,
 * and context serialisation within the NexArena logging utility.
 */

import logger, { LogLevel } from '@/lib/logger';

// Spy on console methods before each test
let consoleDebugSpy: jest.SpyInstance;
let consoleInfoSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleDebugSpy  = jest.spyOn(console, 'debug').mockImplementation(() => {});
  consoleInfoSpy   = jest.spyOn(console, 'info').mockImplementation(() => {});
  consoleWarnSpy   = jest.spyOn(console, 'warn').mockImplementation(() => {});
  consoleErrorSpy  = jest.spyOn(console, 'error').mockImplementation(() => {});
  // Ensure we're in non-production for debug tests
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── logger.info() ─────────────────────────────────────────────────────────────

describe('logger.info()', () => {
  it('calls console.info with a formatted message', () => {
    logger.info('AI query sent');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    const output = consoleInfoSpy.mock.calls[0][0];
    expect(output).toContain('[NexArena]');
    expect(output).toContain('[INFO]');
    expect(output).toContain('AI query sent');
  });

  it('includes serialised context in the log output', () => {
    logger.info('Fan navigating', { screen: 'map', userId: 'user_123' });
    const output = consoleInfoSpy.mock.calls[0][0];
    expect(output).toContain('screen');
    expect(output).toContain('map');
    expect(output).toContain('user_123');
  });

  it('includes an ISO 8601 timestamp', () => {
    logger.info('Event');
    const output = consoleInfoSpy.mock.calls[0][0];
    // ISO timestamps contain a 'T' and end with 'Z'
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('does not call other console methods', () => {
    logger.info('Test message');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

// ── logger.warn() ─────────────────────────────────────────────────────────────

describe('logger.warn()', () => {
  it('calls console.warn with [WARN] prefix', () => {
    logger.warn('Key rotation triggered', { keyIndex: 1 });
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const output = consoleWarnSpy.mock.calls[0][0];
    expect(output).toContain('[WARN]');
    expect(output).toContain('Key rotation triggered');
  });

  it('serialises numeric context values', () => {
    logger.warn('High occupancy', { charCount: 500, durationMs: 1200 });
    const output = consoleWarnSpy.mock.calls[0][0];
    expect(output).toContain('500');
    expect(output).toContain('1200');
  });
});

// ── logger.error() ────────────────────────────────────────────────────────────

describe('logger.error()', () => {
  it('calls console.error with [ERROR] prefix', () => {
    logger.error('All Gemini keys exhausted');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const output = consoleErrorSpy.mock.calls[0][0];
    expect(output).toContain('[ERROR]');
  });

  it('includes stadium context if provided', () => {
    logger.error('Firebase write failed', { stadiumId: 'wankhede' });
    const output = consoleErrorSpy.mock.calls[0][0];
    expect(output).toContain('wankhede');
  });
});

// ── logger.debug() ────────────────────────────────────────────────────────────

describe('logger.debug()', () => {
  it('calls console.debug in non-production environments', () => {
    logger.debug('Pathfinding step', { screen: 'map' });
    // In test env (non-production), should log
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    const output = consoleDebugSpy.mock.calls[0][0];
    expect(output).toContain('[DEBUG]');
  });

  it('contains [NexArena] prefix even for debug messages', () => {
    logger.debug('Debug message');
    const output = consoleDebugSpy.mock.calls[0][0];
    expect(output).toContain('[NexArena]');
  });
});

// ── Format consistency ────────────────────────────────────────────────────────

describe('log format consistency', () => {
  it('all levels include the [NexArena] prefix', () => {
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    [consoleInfoSpy, consoleWarnSpy, consoleErrorSpy].forEach(spy => {
      expect(spy.mock.calls[0][0]).toContain('[NexArena]');
    });
  });

  it('does not include contextField if no context passed', () => {
    logger.info('No context message');
    const output = consoleInfoSpy.mock.calls[0][0];
    // Should not have dangling JSON brace
    expect(output).not.toContain('{}');
  });
});
