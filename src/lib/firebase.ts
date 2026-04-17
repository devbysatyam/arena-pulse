/**
 * Firebase SDK initialisation — NexArena
 *
 * Exports fully typed, singleton instances of:
 * - auth    — Firebase Authentication (Google + Email/Password)
 * - db      — Cloud Firestore (realtime data: crowd, notifications, orders)
 * - app     — Root Firebase App
 *
 * Uses initializeFirestore with persistentLocalCache (Firebase v10+ API)
 * instead of the deprecated enableIndexedDbPersistence.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ── Singleton initialisation ────────────────────────────────────────────────
// Guards against Next.js HMR double-initialisation
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Modern persistence API (replaces deprecated enableIndexedDbPersistence)
    // persistentMultipleTabManager allows the same user to have multiple tabs open
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } else {
    app = getApp();
    db  = getFirestore(app);
  }
  auth = getAuth(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app, auth, db, googleProvider };
