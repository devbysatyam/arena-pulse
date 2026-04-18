'use client';
import { useState } from 'react';
import { useAppStore, User } from '@/store/app-store';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function AuthScreen() {
  const { navigate, loginUser, loginAsGuest } = useAppStore();
  const [tab, setTab] = useState<'login'|'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name:'', email:'', password:'' });

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // Mocking email login for demo (unless real Firebase Email logic is requested)
      await new Promise(r => setTimeout(r, 800));
      const user: User = {
        uid: 'user_' + Date.now(),
        name: form.name || form.email.split('@')[0] || 'Fan',
        email: form.email,
        isGuest: false,
        hasTicket: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.email}`,
      };
      loginUser(user);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setError(null);
    if (!auth) {
      console.error("Firebase not initialized");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      loginUser({
        uid: user.uid,
        name: user.displayName || 'Fan',
        email: user.email || '',
        isGuest: false,
        hasTicket: true,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      });
    } catch (e: unknown) {
      console.error('SSO Error:', e);
      const code = (e as { code?: string }).code;
      setError(code === 'auth/configuration-not-found'
        ? 'Firebase not configured. Please add your keys to .env'
        : 'Sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse at 50% 0,rgba(124,95,240,0.15) 0%,transparent 60%)' }} />

      {/* Back */}
      <header className="flex items-center gap-3 px-5 pt-14 pb-2 relative z-10">
        <button onClick={() => navigate('welcome')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Go back">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
      </header>

      <main className="flex-1 px-5 pb-8 relative z-10 flex flex-col">
        <div className="mb-8 mt-4">
          <h1 className="font-headline font-black text-3xl text-white">
            {tab === 'login' ? 'Welcome back 👋' : 'Create account'}
          </h1>
          <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.45)' }}>
            {tab === 'login' ? 'Sign in to access your ticket & features' : 'Join Arena Pulse today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 mb-6" style={{ background:'rgba(255,255,255,0.05)' }}>
          {(['login','register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all"
              style={tab===t ? { background:'rgba(124,95,240,0.3)', color:'white', boxShadow:'0 0 16px rgba(124,95,240,0.3)' }
                : { color:'rgba(255,255,255,0.4)' }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Google SSO */}
        <button onClick={handleGoogleSSO}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 mb-5 font-bold text-sm transition-all active:scale-95"
          style={{ background:'white', color:'#1a1a2e', boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}
          aria-label="Sign in with Google">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>or continue with email</span>
          <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-6">
          {tab === 'register' && (
            <input type="text" placeholder="Full name" value={form.name}
              onChange={e => setForm({...form, name:e.target.value})}
              className="w-full h-14 rounded-2xl px-4 text-sm text-white outline-none"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}
              aria-label="Full name" />
          )}
          <input type="email" placeholder="Email address" value={form.email}
            onChange={e => setForm({...form, email:e.target.value})}
            className="w-full h-14 rounded-2xl px-4 text-sm text-white outline-none"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}
            aria-label="Email address" />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password:e.target.value})}
            className="w-full h-14 rounded-2xl px-4 text-sm text-white outline-none"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}
            aria-label="Password" />
        </div>

        <button onClick={handleSubmit} disabled={loading || !form.email || !form.password}
          className="w-full h-14 rounded-2xl font-headline font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ background:'linear-gradient(135deg,#7c5ff0,#5b42c9)', boxShadow:'0 0 32px rgba(124,95,240,0.45)', color:'white' }}
          aria-label={tab === 'login' ? 'Sign in' : 'Create account'}>
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>{tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>arrow_forward</span></>
          )}
        </button>

        <button onClick={loginAsGuest}
          className="mt-4 w-full py-3 text-sm font-bold text-center"
          style={{ color:'rgba(255,255,255,0.35)' }}>
          Continue as guest →
        </button>
      </main>
    </div>
  );
}
