'use client';
import { useAppStore } from '@/store/app-store';
import { MATCH, SECTIONS, getCrowdColor, AMENITIES } from '@/lib/stadium-data';

export default function HomeScreen() {
  const { navigate, user, aiSheetOpen } = useAppStore();

  const stats = [
    { label:'Attending',  value:'58,240', icon:'groups',     color:'#00d4ff' },
    { label:'Capacity',   value:'90,000', icon:'stadium',    color:'#a78bfa' },
    { label:'Match Min',  value:`${MATCH.minute}'`, icon:'timer', color:'#ffb800' },
    { label:'Avg Wait',   value:'9 min',  icon:'hourglass_top', color:'#00ff9d' },
  ];

  const quickActions = [
    { id:'map2d',     icon:'map',                  label:'Find Seat',   color:'#00d4ff' },
    { id:'food',      icon:'fastfood',              label:'Order Food',  color:'#ffb800' },
    { id:'ticket',    icon:'confirmation_number',   label:'My Ticket',  color:'#a78bfa' },
    { id:'ar-nav',    icon:'view_in_ar',            label:'AR Navigate',color:'#00ff9d' },
    { id:'heatmap',   icon:'sensors',               label:'Heatmap',    color:'#f472b6' },
    { id:'venue-map', icon:'location_on',           label:'Venue Map',  color:'#4285F4' },
  ];


  const nearbyFood = AMENITIES.filter(a => a.type === 'food').slice(0,3);

  return (
    <div className="min-h-dvh bg-[#0a0b14] overflow-y-auto pb-28">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.4)' }}>Good afternoon,</p>
          <h1 className="font-headline font-black text-xl text-white">{user?.name?.split(' ')[0] ?? 'Fan'} 👋</h1>
        </div>
        <button onClick={() => navigate('profile' as any)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/30">
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{background:'linear-gradient(135deg,#7c5ff0,#00d4ff)'}}><span className="text-white font-bold text-sm">{user?.name?.[0]??'F'}</span></div>
          }
        </button>
      </header>

      {/* Live Match Banner */}
      <div className="mx-5 mb-5 rounded-3xl overflow-hidden relative"
        style={{ background:'linear-gradient(135deg,rgba(124,95,240,0.2),rgba(0,212,255,0.1))', border:'1px solid rgba(124,95,240,0.3)' }}>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400">LIVE — {MATCH.minute}&apos;</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-white/50 mb-1">Chelsea FC</p>
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 mx-auto flex items-center justify-center text-2xl">🔵</div>
            </div>
            <div className="text-center px-4">
              <div className="font-headline font-black text-5xl text-white">{MATCH.score}</div>
              <div className="text-xs mt-1" style={{ color:'rgba(255,255,255,0.4)' }}>2nd Half</div>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-white/50 mb-1">Arsenal FC</p>
              <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 mx-auto flex items-center justify-center text-2xl">🔴</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)' }} />
      </div>

      {/* Stats row */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <span className="material-symbols-outlined text-lg" style={{ color:s.color, fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
              <p className="font-headline font-black text-sm text-white">{s.value}</p>
              <p className="text-[10px] text-center leading-tight" style={{ color:'rgba(255,255,255,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'rgba(255,255,255,0.4)' }}>
          QUICK ACTIONS
        </p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(a => (
            <button key={a.id}
              onClick={() => navigate(a.id as any)}
              className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}
              aria-label={a.label}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background:`${a.color}18` }}>
                <span className="material-symbols-outlined text-2xl" style={{ color:a.color,fontVariationSettings:"'FILL' 1" }}>{a.icon}</span>
              </div>
              <p className="text-xs font-bold text-white text-center leading-tight">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Crowd Alert */}
      <div className="mx-5 mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.25)' }}>
        <span className="material-symbols-outlined text-red-400 text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
        <div className="flex-1">
          <p className="font-bold text-sm text-white">South Stand — Peak Crowd (91%)</p>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>Avoid Gate E until density drops. Use Gate A instead.</p>
        </div>
        <button onClick={() => navigate('heatmap')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ color:'#ff4d6a', background:'rgba(255,77,106,0.15)' }}>
          View Map
        </button>
      </div>

      {/* Nearby Food */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.4)' }}>NEAREST FOOD</p>
          <button onClick={() => navigate('food')} className="text-xs font-bold" style={{ color:'#00d4ff' }}>See all →</button>
        </div>
        <div className="space-y-2.5">
          {nearbyFood.map(f => (
            <button key={f.id} onClick={() => navigate('food')}
              className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98]"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background:'rgba(255,184,0,0.15)' }}>🍔</div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm text-white">{f.label}</p>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.45)' }}>{f.level === 1 ? 'Level 1' : 'Ground'} · {f.waitMin}min wait</p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: f.queue==='low'?'rgba(0,255,157,0.15)':f.queue==='moderate'?'rgba(255,184,0,0.15)':'rgba(255,77,106,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.queue==='low'?'#00ff9d':f.queue==='moderate'?'#ffb800':'#ff4d6a' }} />
                <span className="text-[10px] font-bold capitalize" style={{ color: f.queue==='low'?'#00ff9d':f.queue==='moderate'?'#ffb800':'#ff4d6a' }}>{f.queue}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="mx-5 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer"
        style={{ background:'linear-gradient(135deg,rgba(124,95,240,0.12),rgba(0,212,255,0.06))', border:'1px solid rgba(124,95,240,0.25)' }}
        onClick={aiSheetOpen} role="button" aria-label="Open AI assistant">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#7c5ff0,#00d4ff)' }}>
          <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-white">Arena AI Tip</p>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>West concourse is clearest right now. Best time to visit Stall G1! 🍔</p>
        </div>
        <span className="material-symbols-outlined text-white/30 text-sm">chevron_right</span>
      </div>
    </div>
  );
}
