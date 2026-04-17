'use client';
import { useAppStore } from '@/store/app-store';

const tabs = [
  { id: 'home',      icon: 'home',             label: 'Home'     },
  { id: 'stadiums',  icon: 'stadium',           label: 'Stadiums' },
  { id: 'food',      icon: 'fastfood',          label: 'Food'     },
  { id: 'ticket',    icon: 'confirmation_number', label: 'Ticket' },
  { id: 'profile',   icon: 'person',            label: 'Profile'  },
] as const;

export default function BottomNav() {
  const { screen, navigate, cart, unreadCount } = useAppStore();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const notifCount = unreadCount();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around px-2"
      style={{
        background: 'rgba(10,11,20,0.92)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px 24px 0 0',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        paddingTop: '0.6rem',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {tabs.map(tab => {
        const active = screen === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => navigate(tab.id as any)}
            className="relative flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200"
          >
            {/* Cart badge on Food */}
            {tab.id === 'food' && cartCount > 0 && (
              <span className="absolute -top-1 right-2 w-5 h-5 rounded-full bg-amber-400 text-[#2a1a00] text-[10px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
            {/* Notification badge on Profile */}
            {tab.id === 'profile' && notifCount > 0 && (
              <span className="absolute -top-1 right-2 w-5 h-5 rounded-full bg-[#ff4d6a] text-white text-[10px] font-black flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
            <span
              className="material-symbols-outlined transition-all duration-200"
              style={{
                fontSize: 24,
                color: active ? 'var(--color-cyan, #00d4ff)' : 'rgba(255,255,255,0.35)',
                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                filter: active ? 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' : 'none',
              }}
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider leading-none"
              style={{ color: active ? '#00d4ff' : 'rgba(255,255,255,0.35)' }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
