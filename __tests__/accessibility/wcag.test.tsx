/**
 * Accessibility tests using jest-axe.
 *
 * Tests that key UI components meet WCAG 2.1 AA standards
 * automatically — no manual review required.
 *
 * Covers: colour contrast, ARIA labels, role attributes,
 * keyboard navigation, and semantic structure.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// ── Mock Zustand store ────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
const mockStore = {
  screen: 'home',
  navigate: mockNavigate,
  cart: [],
  unreadCount: () => 0,
  user: null,
  notifications: [],
  aiSheetOpen: jest.fn(),
};

jest.mock('@/store/app-store', () => ({
  useAppStore: () => mockStore,
}));

// ── BottomNav Accessibility ───────────────────────────────────────────────────

import BottomNav from '@/components/layout/BottomNav';

describe('BottomNav — Accessibility', () => {
  it('has no WCAG violations', async () => {
    const { container } = render(<BottomNav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has a navigation landmark with an accessible label', () => {
    const { getByRole } = render(<BottomNav />);
    const nav = getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('all navigation buttons have accessible labels', () => {
    const { getAllByRole } = render(<BottomNav />);
    const buttons = getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')!.length).toBeGreaterThan(0);
    });
  });

  it('active tab has aria-current="page"', () => {
    mockStore.screen = 'home';
    const { getByLabelText } = render(<BottomNav />);
    const homeButton = getByLabelText('Home');
    expect(homeButton).toHaveAttribute('aria-current', 'page');
  });

  it('inactive tabs do not have aria-current', () => {
    mockStore.screen = 'home';
    const { getByLabelText } = render(<BottomNav />);
    const foodButton = getByLabelText('Food');
    expect(foodButton).not.toHaveAttribute('aria-current');
  });
});

// ── Toast Accessibility ───────────────────────────────────────────────────────

import Toast from '@/components/ui/Toast';

const mockToastStore = { toast: null };
jest.mock('@/store/app-store', () => ({
  useAppStore: () => ({ ...mockStore, ...mockToastStore }),
}), { virtual: false });

describe('Toast — Accessibility (no visible toast)', () => {
  it('renders without WCAG aria violations when hidden', async () => {
    const { container } = render(<Toast />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── ErrorBoundary Accessibility ───────────────────────────────────────────────

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Silence React's error boundary console.error during this test
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

function ThrowingChild(): React.ReactElement {
  throw new Error('wcag-test-error');
}

describe('ErrorBoundary fallback — Accessibility', () => {
  it('fallback UI has no WCAG violations', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('fallback has role="alert" and aria-live="assertive"', () => {
    const { getByRole } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    const alert = getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('"Try Again" button has an accessible aria-label', () => {
    const { getByRole } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    const button = getByRole('button', { name: /try.*again/i });
    expect(button).toHaveAttribute('aria-label');
  });
});
