/**
 * @module firestore-service
 * @description Centralised Firestore data access layer for NexArena.
 *
 * All Firestore reads/writes go through this module — never directly
 * in components. This makes the data layer independently testable
 * and ensures consistent error handling.
 *
 * ## Collection Structure
 * ```
 * crowd/{stadiumId}
 *   └── sections: Record<string, number>   ← sectionId → occupancy %
 *       updatedAt: Timestamp
 *
 * notifications/{notifId}
 *   └── title, body, priority, targetStadiumId, ts, read
 *
 * stalls/{stallId}
 *   └── name, category, waitMin, isOpen, items: StallItem[]
 *
 * orders/{orderId}
 *   └── userId, stallId, stallLabel, items, total, status, placedAt
 *
 * incidents/{incidentId}
 *   └── title, zone, severity, reportedBy, ts, resolved
 *
 * admins/{uid}
 *   └── email, role: 'admin'   ← checked after Firebase Auth sign-in
 * ```
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import logger from './logger';

// ── Type Definitions ─────────────────────────────────────────────────────────

export interface CrowdData {
  sections: Record<string, number>; // sectionId → 0–100
  updatedAt: number;                // milliseconds
}

export interface FSNotification {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'critical';
  targetStadiumId: string | null;
  ts: number;
  read: boolean;
}

export interface StallItem {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  available: boolean;
  category: 'food' | 'drink' | 'snack';
}

export interface Stall {
  id: string;
  name: string;
  category: 'Indian' | 'Fast Food' | 'Beverages' | 'Snacks' | 'International';
  waitMin: number;
  isOpen: boolean;
  items: StallItem[];
  location: string;
}

export interface FSOrder {
  id: string;
  userId: string;
  stallId: string;
  stallLabel: string;
  items: { itemId: string; name: string; qty: number; price: number }[];
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'collected';
  placedAt: number;
  readyEtaMin?: number;
}

export interface Incident {
  id: string;
  title: string;
  zone: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  ts: number;
  resolved: boolean;
}

// ── Guards ───────────────────────────────────────────────────────────────────

/** Returns null with a warning if Firestore is not initialised (SSR / no config). */
function getDb() {
  if (!db) {
    logger.warn('Firestore not initialised — check Firebase env vars');
    return null;
  }
  return db;
}

// ── CROWD DATA ───────────────────────────────────────────────────────────────

/**
 * Subscribes to live crowd density data for a stadium.
 * Updates whenever an admin changes section values.
 *
 * @param stadiumId - Stadium ID (e.g., 'wankhede')
 * @param onUpdate - Callback with the latest CrowdData
 * @returns Unsubscribe function to cancel the listener
 */
export function subscribeToCrowd(
  stadiumId: string,
  onUpdate: (data: CrowdData) => void
): Unsubscribe {
  const db = getDb();
  if (!db) return () => {};

  const ref = doc(db, 'crowd', stadiumId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      onUpdate({
        sections: d.sections ?? {},
        updatedAt: (d.updatedAt as Timestamp)?.toMillis?.() ?? Date.now(),
      });
    }
  }, (err) => logger.error('subscribeToCrowd error', { stadiumId, msg: err.message }));
}

/**
 * Admin: Updates the occupancy percentage for a single section.
 *
 * @param stadiumId - Stadium ID
 * @param sectionId - Section ID (e.g., 'N', 'S', 'E', 'W')
 * @param occupancy - 0–100
 */
export async function updateCrowdSection(
  stadiumId: string,
  sectionId: string,
  occupancy: number
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const clamped = Math.max(0, Math.min(100, Math.round(occupancy)));
  const ref = doc(db, 'crowd', stadiumId);
  await setDoc(ref, {
    [`sections.${sectionId}`]: clamped,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  logger.info('Crowd section updated', { stadiumId, sectionId, occupancy: clamped });
}

/**
 * Admin: Writes all section data at once (used for initial seeding).
 */
export async function setCrowdData(
  stadiumId: string,
  sections: Record<string, number>
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await setDoc(doc(db, 'crowd', stadiumId), {
    sections,
    updatedAt: serverTimestamp(),
  });
}

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────

/**
 * Subscribes to the latest 20 notifications (newest first).
 *
 * @param onUpdate - Callback with the notification array
 * @returns Unsubscribe function
 */
export function subscribeToNotifications(
  onUpdate: (notifs: FSNotification[]) => void
): Unsubscribe {
  const db = getDb();
  if (!db) return () => {};

  const q = query(
    collection(db, 'notifications'),
    orderBy('ts', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const notifs: FSNotification[] = snap.docs.map(d => ({
      id:              d.id,
      title:           d.data().title,
      body:            d.data().body,
      priority:        d.data().priority ?? 'info',
      targetStadiumId: d.data().targetStadiumId ?? null,
      ts:              (d.data().ts as Timestamp)?.toMillis?.() ?? Date.now(),
      read:            d.data().read ?? false,
    }));
    onUpdate(notifs);
  }, (err) => logger.error('subscribeToNotifications error', { msg: err.message }));
}

/**
 * Admin: Broadcasts a notification to all fans.
 *
 * @param payload - Title, body, priority, and optional target stadium
 * @returns The Firestore document ID of the created notification
 */
export async function broadcastNotification(payload: {
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'critical';
  targetStadiumId: string | null;
}): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not available');

  const ref = await addDoc(collection(db, 'notifications'), {
    ...payload,
    ts:   serverTimestamp(),
    read: false,
  });
  logger.info('Notification broadcast', { id: ref.id, title: payload.title });
  return ref.id;
}

// ── STALLS ───────────────────────────────────────────────────────────────────

/**
 * Subscribes to live stall data for a stadium.
 * Admins can update wait times and availability in real-time.
 */
export function subscribeToStalls(
  stadiumId: string,
  onUpdate: (stalls: Stall[]) => void
): Unsubscribe {
  const db = getDb();
  if (!db) return () => {};

  const q = query(collection(db, `stadiums/${stadiumId}/stalls`));
  return onSnapshot(q, (snap) => {
    const stalls: Stall[] = snap.docs.map(d => ({
      id:       d.id,
      ...(d.data() as Omit<Stall, 'id'>),
    }));
    onUpdate(stalls);
  }, (err) => logger.error('subscribeToStalls error', { msg: err.message }));
}

/**
 * Admin: Updates the wait time and open status for a stall.
 */
export async function updateStall(
  stadiumId: string,
  stallId: string,
  updates: Partial<Pick<Stall, 'waitMin' | 'isOpen'>>
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await updateDoc(doc(db, `stadiums/${stadiumId}/stalls`, stallId), updates);
}

// ── ORDERS ───────────────────────────────────────────────────────────────────

/**
 * Places an order in Firestore. Returns the assigned order ID.
 */
export async function placeOrder(payload: Omit<FSOrder, 'id' | 'status' | 'placedAt'>): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not available');

  const ref = await addDoc(collection(db, 'orders'), {
    ...payload,
    status:   'placed',
    placedAt: serverTimestamp(),
  });
  logger.info('Order placed', { id: ref.id, total: payload.total });
  return ref.id;
}

/**
 * Subscribes to a single order's status updates.
 */
export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: FSOrder) => void
): Unsubscribe {
  const db = getDb();
  if (!db) return () => {};

  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      onUpdate({
        id:          snap.id,
        userId:      d.userId,
        stallId:     d.stallId,
        stallLabel:  d.stallLabel,
        items:       d.items ?? [],
        total:       d.total,
        status:      d.status,
        placedAt:    (d.placedAt as Timestamp)?.toMillis?.() ?? Date.now(),
        readyEtaMin: d.readyEtaMin,
      });
    }
  });
}

/**
 * Admin: Updates an order's status.
 */
export async function updateOrderStatus(
  orderId: string,
  status: FSOrder['status']
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await updateDoc(doc(db, 'orders', orderId), { status });
  logger.info('Order status updated', { orderId, status });
}

// ── INCIDENTS ────────────────────────────────────────────────────────────────

/**
 * Subscribes to open (unresolved) incidents at a stadium.
 */
export function subscribeToIncidents(
  stadiumId: string,
  onUpdate: (incidents: Incident[]) => void
): Unsubscribe {
  const db = getDb();
  if (!db) return () => {};

  const q = query(
    collection(db, `stadiums/${stadiumId}/incidents`),
    orderBy('ts', 'desc'),
    limit(10)
  );

  return onSnapshot(q, (snap) => {
    const incidents: Incident[] = snap.docs.map(d => ({
      id:         d.id,
      title:      d.data().title,
      zone:       d.data().zone,
      severity:   d.data().severity ?? 'low',
      reportedBy: d.data().reportedBy,
      ts:         (d.data().ts as Timestamp)?.toMillis?.() ?? Date.now(),
      resolved:   d.data().resolved ?? false,
    }));
    onUpdate(incidents.filter(i => !i.resolved));
  });
}

/**
 * Admin: Reports a new incident.
 */
export async function reportIncident(
  stadiumId: string,
  payload: Omit<Incident, 'id' | 'ts' | 'resolved'>
): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Firestore not available');

  const ref = await addDoc(collection(db, `stadiums/${stadiumId}/incidents`), {
    ...payload,
    ts:       serverTimestamp(),
    resolved: false,
  });
  return ref.id;
}

// ── ADMIN ROLE CHECK ─────────────────────────────────────────────────────────

/**
 * Checks if a Firebase Auth UID has admin role in the `admins` collection.
 * Called after successful Firebase Auth sign-in.
 *
 * @param uid - Firebase Auth user UID
 * @returns true if user is an admin
 */
export async function checkAdminRole(uid: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() && snap.data()?.role === 'admin';
  } catch (err: any) {
    logger.error('Admin role check failed', { uid, msg: err.message });
    return false;
  }
}
