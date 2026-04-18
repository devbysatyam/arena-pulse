/**
 * Unit tests for src/components/ui/ErrorBoundary.tsx
 *
 * Validates that the ErrorBoundary class component correctly:
 * - Catches render errors without crashing the app
 * - Shows a graceful fallback UI
 * - Calls the optional onError callback
 * - Resets state on "Try Again" click
 * - Renders children normally when no error occurs
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Component that throws on first render, then succeeds
let shouldThrow = false;

function BrokenComponent(): React.ReactElement {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div>Healthy component</div>;
}

// Suppress console.error noise from React's error boundary logs during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

beforeEach(() => {
  shouldThrow = false;
});

// ── Normal render (no error) ──────────────────────────────────────────────────

describe('ErrorBoundary — normal rendering', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Healthy component')).toBeInTheDocument();
  });

  it('does not show fallback UI when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('ErrorBoundary — error caught', () => {
  beforeEach(() => {
    shouldThrow = true;
  });

  it('renders the default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('fallback UI has role="alert" for screen reader announcement', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('shows a "Try Again" button in the fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls the optional onError callback when an error is caught', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test render error');
  });
});

// ── Custom fallback ───────────────────────────────────────────────────────────

describe('ErrorBoundary — custom fallback', () => {
  beforeEach(() => {
    shouldThrow = true;
  });

  it('renders a custom fallback node when provided', () => {
    render(
      <ErrorBoundary fallback={<p>Custom error message</p>}>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});

// ── Reset ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary — reset on Try Again', () => {
  it('clears the error state and re-renders children on reset', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Simulate fixing the error, then clicking Try Again
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Healthy component')).toBeInTheDocument();
  });
});
