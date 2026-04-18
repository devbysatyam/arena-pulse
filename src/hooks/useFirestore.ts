/**
 * @hook useFirestore
 * @description Generic React hooks for Firestore real-time subscriptions.
 *
 * useFirestoreDoc  — subscribes to a single Firestore document
 * useFirestoreCol  — subscribes to a Firestore collection query
 *
 * Both hooks:
 * - Clean up the listener automatically on unmount
 * - Handle loading and error states
 * - Return typed data
 */

'use client';
import { useState, useEffect, useRef } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import logger from '@/lib/logger';

// ── Generic document subscription ────────────────────────────────────────────

export interface UseFirestoreDocResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to a Firestore resource via a caller-supplied subscribe function.
 * The subscribeFunc should return an Unsubscribe and call onUpdate with data.
 *
 * @example
 * const { data, loading } = useFirestoreSubscription<CrowdData>(
 *   (update) => subscribeToCrowd(stadiumId, update),
 *   [stadiumId]
 * );
 */
export function useFirestoreSubscription<T>(
  subscribeFunc: (onUpdate: (data: T) => void) => Unsubscribe,
  deps: React.DependencyList = []
): UseFirestoreDocResult<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const unsubRef              = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      unsubRef.current = subscribeFunc((newData) => {
        setData(newData);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('useFirestoreSubscription error', { msg });
      setError(msg);
      setLoading(false);
    }

    return () => {
      unsubRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ── Generic collection subscription ──────────────────────────────────────────

export interface UseFirestoreColResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to a Firestore collection via a caller-supplied subscribe function.
 *
 * @example
 * const { items: notifications } = useFirestoreCollectionSubscription<FSNotification>(
 *   (update) => subscribeToNotifications(update)
 * );
 */
export function useFirestoreCollectionSubscription<T>(
  subscribeFunc: (onUpdate: (items: T[]) => void) => Unsubscribe,
  deps: React.DependencyList = []
): UseFirestoreColResult<T> {
  const [items, setItems]     = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const unsubRef              = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      unsubRef.current = subscribeFunc((newItems) => {
        setItems(newItems);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('useFirestoreCollectionSubscription error', { msg });
      setError(msg);
      setLoading(false);
    }

    return () => {
      unsubRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { items, loading, error };
}
