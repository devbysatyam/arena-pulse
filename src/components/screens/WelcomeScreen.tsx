'use client';
import { useAppStore } from '@/store/app-store';

export default function WelcomeScreen() {
  const { navigate, loginAsGuest } = useAppStore();

  const features = [
    { icon:'map',             label:'Stadium Map',   sub:'2D/3D/AR navigation',  available:true,  color:'#00d4ff' },
    { icon:'sensors',         label:'Crowd Heatmap', sub:'Live density tracking', available:true,  color:'#00d4ff' },
    { icon:'fastfood',        label:'Food Ordering', sub:'Order from your seat',  available:false, color:'#ffb800' },
    { icon:'confirmation_number',label:'My Ticket',  sub:'Digital entry pass',    available:false, color:'#a78bfa' },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background:'radial-gradient(circle,rgba(124,95,240,0.12) 0%,transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏟️</span>
          <span className="font-headline font-black text-lg tracking-tight"
            style={{ background:'linear-gradient(90deg,#fff,rgba(255,255,255,0.7))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            ARENA PULSE
          </span>
        </div>
        <button onClick={() => navigate('admin-login')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
          style={{ background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.2)' }}>
          <span className="material-symbols-outlined text-[#ff4d6a] text-sm">admin_panel_settings</span>
          <span className="text-[10px] font-black text-[#ff4d6a] uppercase">Admin</span>
        </button>
      </header>

      <main className="flex-1 px-5 pb-8 relative z-10 overflow-y-auto">
        {/* Venue title */}
        <div className="text-center mb-6">
          <h1 className="font-headline font-black text-3xl text-white tracking-tight">Wembley Stadium</h1>
          <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.5)' }}>Chelsea vs Arsenal · Apr 16 · 15:00</p>
        </div>

        {/* Stadium hero */}
        <div className="relative rounded-3xl overflow-hidden mb-6 animate-float"
          style={{ height:230, boxShadow:'0 0 60px rgba(124,95,240,0.2), 0 0 120px rgba(0,212,255,0.08)' }}>
          <img
            src="/stadium-hero.jpg"
            alt="Cricket Stadium aerial view at night"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
          />
          <div className="absolute inset-0"
            style={{ background:'linear-gradient(to top,rgba(10,11,20,0.95) 0%,rgba(10,11,20,0.3) 60%,transparent 100%)' }} />
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live Now</span>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-full glass border border-cyan-400/30">
              <span className="text-xs font-bold" style={{ color:'#00d4ff' }}>58,240 fans</span>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-headline font-black text-white">1 — 0</p>
              <p className="text-xs text-white/60">67&apos; · Chelsea lead</p>
            </div>
            <div className="flex gap-1">
              {['🔵','🔴'].map((e,i)=><span key={i} className="text-xl">{e}</span>)}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 mb-7">
          <button
            onClick={loginAsGuest}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-headline font-bold text-sm transition-all active:scale-95"
            style={{ border:'2px solid #00d4ff', color:'#00d4ff', background:'rgba(0,212,255,0.06)' }}
            aria-label="Explore without account"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>explore</span>
            EXPLORE (GUEST)
          </button>
          <button
            onClick={() => navigate('auth')}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-headline font-bold text-sm transition-all active:scale-95"
            style={{ background:'linear-gradient(135deg,#7c5ff0,#5b42c9)', boxShadow:'0 0 24px rgba(124,95,240,0.4)', color:'white' }}
            aria-label="Sign in to your account"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>login</span>
            SIGN IN
          </button>
        </div>

        {/* Feature grid */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'rgba(255,255,255,0.35)' }}>
          FEATURES
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.label}
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              {!f.available && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
                  style={{ background:'rgba(10,11,20,0.65)', backdropFilter:'blur(4px)' }}>
                  <span className="material-symbols-outlined text-white/30 text-3xl">lock</span>
                </div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background:`${f.color}18` }}>
                <span className="material-symbols-outlined" style={{ color:f.color, fontVariationSettings:"'FILL' 1" }}>{f.icon}</span>
              </div>
              <p className="font-headline font-bold text-sm text-white">{f.label}</p>
              <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.45)' }}>{f.sub}</p>
              {f.available && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs font-bold text-green-400">Available</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-5 px-6 leading-relaxed" style={{ color:'rgba(255,255,255,0.25)' }}>
          GUEST MODE: MAP & HEATMAP ONLY. SIGN IN FOR FULL FEATURES.
        </p>
      </main>
    </div>
  );
}
