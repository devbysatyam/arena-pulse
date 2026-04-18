'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { checkAdminRole } from '@/lib/firestore-service';
import { useAppStore } from '@/store/app-store';
import { validateEmail } from '@/lib/validators';
import { trackAdminLogin } from '@/lib/analytics';
import { aiChatLimiter } from '@/lib/rate-limit';

/**
 * AdminLoginScreen — Production Firebase Auth Sign-In
 *
 * Security features:
 * - Real Firebase Authentication (signInWithEmailAndPassword)
 * - Admin role verified against Firestore `admins/{uid}` collection
 * - Rate-limited: 3 attempts before a 30-second lockout
 * - No credentials stored or shown in UI
 * - Input sanitization and email format validation
 * - Error messages are generic (don't reveal if email exists)
 */

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

export default function AdminLoginScreen() {
  const { navigate, setAdmin, setAdminUser, back } = useAppStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [step, setStep]         = useState<'idle' | 'authenticating' | 'verifying'>('idle');

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockSecondsLeft = isLocked
    ? Math.ceil((lockedUntil! - Date.now()) / 1000)
    : 0;

  const emailError = email && !validateEmail(email) ? 'Enter a valid email address' : '';

  const handleLogin = async () => {
    setError('');

    // Lockout check
    if (isLocked) {
      setError(`Too many attempts. Try again in ${lockSecondsLeft}s.`);
      return;
    }

    // Validation
    if (!email.trim() || !password) {
      setError('Please fill in both fields.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (!auth) {
      setError('Authentication service unavailable.');
      return;
    }

    setLoading(true);
    setStep('authenticating');

    try {
      // Step 1: Firebase Auth sign-in
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = credential.user;

      // Step 2: Verify admin role in Firestore
      setStep('verifying');
      const isAdmin = await checkAdminRole(user.uid);

      if (!isAdmin) {
        // User authenticated but not an admin — sign them out immediately
        await auth.signOut();
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        setStep('idle');
        trackAdminLogin(false);
        return;
      }

      // Step 3: Grant admin access
      setAdmin(true);
      setAdminUser({ uid: user.uid, email: user.email ?? email });
      trackAdminLogin(true);
      navigate('admin');
    } catch (err: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`);
      } else {
        // Generic message — don't reveal email existence or specific auth error
        setError(`Sign-in failed. Check credentials. (${MAX_ATTEMPTS - newAttempts} attempts remaining)`);
      }

      trackAdminLogin(false);
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,77,106,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,106,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,77,106,0.15) 0%, transparent 60%)' }} />

      {/* Back */}
      <header className="px-5 pt-14 pb-2 relative z-10">
        <button
          onClick={() => back()}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-10 relative z-10">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-[0_0_40px_rgba(255,77,106,0.4)]"
            style={{ background: 'linear-gradient(135deg, #ff4d6a, #c0392b)' }}>
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <h1 className="font-headline font-black text-3xl text-white">Admin Access</h1>
          <p className="text-sm text-white/40 mt-1">NexArena Operations Center</p>
        </div>

        {/* Security notice */}
        <div className="mb-6 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <span className="material-symbols-outlined text-[#00d4ff] text-base mt-0.5">shield</span>
          <p className="text-xs text-white/50 leading-relaxed">
            This panel requires authorised admin credentials. Unauthorised access attempts are logged.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)' }}>
            <span className="material-symbols-outlined text-[#ff4d6a] text-base">error</span>
            <p className="text-xs text-[#ff4d6a] font-bold">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {/* Email */}
          <div>
            <label htmlFor="admin-email" className="sr-only">Admin email</label>
            <input
              id="admin-email"
              type="email"
              placeholder="Admin email"
              value={email}
              autoComplete="username"
              onChange={e => { setEmail(e.target.value); setError(''); }}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'admin-email-error' : undefined}
              className="w-full h-14 rounded-2xl px-4 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff4d6a]/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: emailError ? '1px solid #ff4d6a' : '1px solid rgba(255,255,255,0.1)' }} />
            {emailError && (
              <p id="admin-email-error" className="text-xs text-[#ff4d6a] mt-1 ml-1">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="admin-password" className="sr-only">Admin password</label>
            <input
              id="admin-password"
              type={showPass ? 'text' : 'password'}
              placeholder="Admin password"
              value={password}
              autoComplete="current-password"
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && !loading && !isLocked && handleLogin()}
              className="w-full h-14 rounded-2xl px-4 pr-12 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff4d6a]/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-white/30 text-xl">
                {showPass ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || isLocked || !!emailError}
          aria-busy={loading}
          className="w-full h-14 rounded-2xl font-headline font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #ff4d6a, #c0392b)', boxShadow: '0 0 30px rgba(255,77,106,0.4)', color: 'white' }}>
          {loading
            ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : isLocked
            ? <>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                LOCKED ({lockSecondsLeft}s)
              </>
            : <>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                ACCESS ADMIN PANEL
              </>
          }
        </button>
      </main>
    </div>
  );
}
