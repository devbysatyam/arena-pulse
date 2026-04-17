'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. If omitted, a default card is shown. */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary component.
 *
 * Wraps child components to catch rendering errors and display a graceful
 * fallback instead of crashing the entire page. Follows React best
 * practices for error boundary implementation.
 *
 * @example
 * <ErrorBoundary>
 *   <MyComplexMap />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console in development; send to monitoring in production
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center"
          style={{
            background: 'rgba(255,77,106,0.08)',
            border: '1px solid rgba(255,77,106,0.25)',
            borderRadius: '1.5rem',
            margin: '1rem',
          }}
        >
          <span className="text-4xl mb-3" aria-hidden="true">⚠️</span>
          <h2 className="text-white font-bold text-lg mb-1">Something went wrong</h2>
          <p className="text-white/50 text-sm mb-4">
            This section failed to load. The rest of the app is still working.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: 'rgba(0,212,255,0.2)', border: '1px solid rgba(0,212,255,0.3)' }}
            aria-label="Try to reload this section"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
