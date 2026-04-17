'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { STADIUMS } from '@/lib/stadiums-data';
import {
  subscribeToNotifications,
  type FSNotification,
} from '@/lib/firestore-service';
import { useFirestoreCollectionSubscription } from '@/hooks/useFirestore';

const ACHIEVEMENTS = [
  { icon: '🏟️', label: 'First Match',   done: true  },
  { icon: '🍔', label: 'First Order',   done: true  },
  { icon: '🗺️', label: 'Navigator',     done: true  },
  { icon: '🤖', label: 'AI Fan',        done: false },
  { icon: '💺', label: 'Season Pass',   done: false },
];

const priorityStyle = {
  info:     { bg: 'rgba(0,212,255,0.1)',    border: 'rgba(0,212,255,0.25)',    text: '#00d4ff',  icon: 'info',    emoji: 'ℹ️' },
  warning:  { bg: 'rgba(255,184,0,0.1)',    border: 'rgba(255,184,0,0.25)',    text: '#ffb800',  icon: 'warning', emoji: '⚠️' },
  critical: { bg: 'rgba(255,77,106,0.12)',  border: 'rgba(255,77,106,0.3)',    text: '#ff4d6a',  icon: 'error',   emoji: '🚨' },
};

type Tab = 'profile' | 'notifications' | 'activity';

export default function ProfileScreen() {
  const { navigate, user, logout, activeOrder, cart, aiSheetOpen } = useAppStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Live Firestore notifications — updates when admin broadcasts
  const { items: liveNotifications, loading: notifsLoading } =
    useFirestoreCollectionSubscription<FSNotification>(
      subscribeToNotifications,
      []
    );

  const unread = liveNotifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try { if (auth && auth.currentUser) await signOut(auth); } catch (_) {}
    logout();
  };

  const handleNotifTab = () => {
    setActiveTab('notifications');
    // Mark read locally (Firestore read tracking would require a write per user)
  };

  if (!user) { navigate('welcome'); return null; }


  return (
    <div className="min-h-dvh bg-[#0a0b14] flex flex-col pb-10">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(124,95,240,0.15) 0%, transparent 55%)' }} />

      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-5 pt-14 pb-4 relative z-10">
        <button onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="font-headline font-black text-xl text-white">My Profile</h1>
        <button onClick={() => navigate('admin-login')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)' }}>
          <span className="material-symbols-outlined text-[#ff4d6a] text-sm">admin_panel_settings</span>
        </button>
      </header>

      {/* Avatar card */}
      <div className="px-5 pb-5 relative z-10">
        <div className="rounded-3xl p-5 flex items-center gap-5"
          style={{ background: 'linear-gradient(135deg, rgba(124,95,240,0.15), rgba(0,212,255,0.08))', border: '1px solid rgba(124,95,240,0.25)' }}>
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-[0_0_20px_rgba(124,95,240,0.4)]">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#7c5ff0,#00d4ff)' }}>
                    {user.name?.[0] ?? 'F'}
                  </div>
              }
            </div>
            {!user.isGuest && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00ff9d] flex items-center justify-center border-2 border-[#0a0b14]">
                <span className="material-symbols-outlined text-black" style={{ fontSize: 12 }}>verified</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-headline font-black text-xl text-white truncate">{user.name}</h2>
            {user.email && <p className="text-xs text-white/50 truncate mt-0.5">{user.email}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase
                ${user.isGuest ? 'bg-white/10 text-white/40' : 'bg-[#7c5ff0]/20 text-[#a78bfa] border border-[#7c5ff0]/30'}`}>
                {user.isGuest ? 'Guest' : 'Fan Member'}
              </span>
              {user.hasTicker && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/25">
                  🎟 Ticket
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inner Tab Bar */}
      <div className="px-5 mb-4 relative z-10">
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
          {(['profile', 'notifications', 'activity'] as Tab[]).map(t => {
            const labels: Record<Tab, string> = { profile: 'Profile', notifications: 'Inbox', activity: 'History' };
            return (
              <button key={t} onClick={t === 'notifications' ? handleNotifTab : () => setActiveTab(t)}
                className={`flex-1 relative py-2 rounded-xl text-[11px] font-black uppercase transition-all
                  ${activeTab === t ? 'bg-[#7c5ff0]/30 text-white shadow-[0_0_12px_rgba(124,95,240,0.3)]' : 'text-white/35 hover:text-white/60'}`}>
                {labels[t]}
                {t === 'notifications' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff4d6a] text-white text-[8px] font-black flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto relative z-10 space-y-4">
        
        {/* ── PROFILE TAB ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Events', value: '1', icon: 'stadium', color: '#7c5ff0' },
                { label: 'Orders', value: activeOrder ? '1' : '0', icon: 'fastfood', color: '#ffb800' },
                { label: 'Cart',   value: String(cart.length), icon: 'shopping_cart', color: '#00d4ff' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <p className="font-headline font-black text-lg text-white">{s.value}</p>
                  <p className="text-[10px] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Achievements</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {ACHIEVEMENTS.map(a => (
                  <div key={a.label}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border
                      ${a.done ? 'bg-[#7c5ff0]/15 border-[#7c5ff0]/30' : 'bg-white/3 border-white/8 opacity-40'}`}>
                    <span className={`text-2xl ${!a.done ? 'grayscale' : ''}`}>{a.icon}</span>
                    <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">{a.label}</span>
                    {a.done && <span className="text-[8px] font-black text-[#00ff9d] uppercase">Earned</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation shortcuts */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Quick Links</p>
              <div className="space-y-2">
                {([
                  { icon: 'confirmation_number', label: 'My Ticket',        sub: 'View & manage your ticket', screen: 'ticket',   action: 'navigate' },
                  { icon: 'shopping_cart',       label: 'Cart & Orders',    sub: `${cart.length} items`,      screen: 'cart',     action: 'navigate' },
                  { icon: 'stadium',             label: 'Browse Stadiums',  sub: '6 venues available',        screen: 'stadiums', action: 'navigate' },
                  { icon: 'smart_toy',           label: 'Arena AI',         sub: 'Chat with your assistant',  screen: '',         action: 'ai-sheet' },
                ] as { icon: string; label: string; sub: string; screen: string; action: string }[]).map(item => (
                  <button key={item.label}
                    onClick={() => item.action === 'ai-sheet' ? aiSheetOpen() : navigate(item.screen as any)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="material-symbols-outlined text-xl text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-white/40">{item.sub}</p>
                    </div>
                    <span className="material-symbols-outlined text-white/20">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            {!showLogoutConfirm ? (
              <button onClick={() => setShowLogoutConfirm(true)}
                className="w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', color: '#ff4d6a' }}>
                <span className="material-symbols-outlined">logout</span> Sign Out
              </button>
            ) : (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.3)' }}>
                <p className="text-sm font-bold text-white mb-1">Confirm Sign Out?</p>
                <p className="text-xs text-white/50 mb-4">You&apos;ll need to log in again to access your ticket.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 h-11 rounded-xl font-bold text-sm text-white/60"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>Cancel</button>
                  <button onClick={handleLogout}
                    className="flex-1 h-11 rounded-xl font-bold text-sm text-white"
                    style={{ background: '#ff4d6a' }}>Sign Out</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── NOTIFICATIONS TAB ──────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="space-y-3" aria-live="polite" aria-label="Notification inbox">
            {notifsLoading ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-8 h-8 rounded-full border border-[#00d4ff] border-t-transparent animate-spin mb-4" />
                <p className="text-white/40 text-sm">Loading notifications…</p>
              </div>
            ) : liveNotifications.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-5xl mb-3">🔔</span>
                <p className="text-white font-bold">No notifications yet</p>
                <p className="text-white/40 text-sm mt-1">Admin broadcasts will appear here in real-time</p>
              </div>
            ) : (
              liveNotifications.map(n => {
                const style = priorityStyle[n.priority];
                const stadium = n.targetStadiumId ? STADIUMS.find(s => s.id === n.targetStadiumId) : null;
                return (
                  <div key={n.id} className="rounded-2xl px-4 py-4 flex gap-3"
                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                    role="article"
                    aria-label={`${n.priority} notification: ${n.title}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: `${style.text}18` }}>
                      {style.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white truncate">{n.title}</p>
                        <span className="text-[9px] font-black uppercase flex-shrink-0"
                          style={{ color: style.text }}>{n.priority}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-white/25 mt-1.5 flex items-center gap-2">
                        <span>{stadium ? `${stadium.emoji} ${stadium.shortName}` : '📡 All Stadiums'}</span>
                        <span>·</span>
                        <time dateTime={new Date(n.ts).toISOString()}>
                          {new Date(n.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}


        {/* ── ACTIVITY TAB ──────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="space-y-2">
            {[
              { icon: 'confirmation_number', label: 'Chelsea vs Arsenal',       sub: 'Seat SA2 · Row 12 · Gate C',          date: 'Today', color: '#7c5ff0' },
              { icon: 'fastfood',           label: 'Ordered: Burger + Fries',   sub: 'Stall G1 · ₹900 · Collected',         date: 'Today', color: '#ffb800' },
              { icon: 'view_in_ar',         label: 'AR Navigation Used',        sub: 'Gate C → Section SA2 · 4 min',        date: 'Today', color: '#00d4ff' },
              { icon: 'sensors',            label: 'Checked Live Heatmap',      sub: 'South Stand 91% · Crowd surge',        date: 'Today', color: '#f472b6' },
              { icon: 'stadium',            label: 'Viewed NM Stadium',         sub: 'Gujarat Titans vs Mumbai Indians',     date: 'Today', color: '#00ff9d' },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${h.color}18` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: h.color, fontVariationSettings: "'FILL' 1" }}>{h.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{h.label}</p>
                  <p className="text-xs text-white/40 truncate">{h.sub}</p>
                </div>
                <span className="text-[10px] text-white/25 flex-shrink-0">{h.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
