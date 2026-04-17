/**
 * Jest global setup file.
 * Runs after the test framework is installed in the environment.
 * Extends Jest matchers with DOM-specific assertions.
 */
import '@testing-library/jest-dom';

// Mock next/router since it doesn't work in jsdom
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Silence specific console warnings that are noisy in tests
const originalWarn = console.warn.bind(console);
beforeAll(() => {
  console.warn = (msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('Warning: ReactDOM.render')) return;
    originalWarn(msg, ...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
