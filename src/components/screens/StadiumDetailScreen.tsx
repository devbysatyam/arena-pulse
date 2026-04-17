'use client';
import { useAppStore } from '@/store/app-store';
import { STADIUMS, STADIUM_MATCHES, getStadiumById, getMatchesForStadium, getLiveMatchForStadium } from '@/lib/stadiums-data';

export default function StadiumDetailScreen() {
  const { navigate, selectedStadiumId, setSelectedStadiumId } = useAppStore();
  const stadium = selectedStadiumId ? getStadiumById(selectedStadiumId) : null;

  if (!stadium) {
    navigate('stadiums');
    return null;
  }

  const matches = getMatchesForStadium(stadium.id);
  const liveMatch = getLiveMatchForStadium(stadium.id);
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const completed = matches.filter(m => m.status === 'completed');

  const occupancyPct = liveMatch?.attendance
    ? Math.round((liveMatch.attendance / stadium.capacity) * 100)
    : null;

  const quickActions = [
    { icon: 'view_in_ar_new', label: '3D View', screen: 'stadium3d', color: '#00d4ff' },
    { icon: 'sensors', label: 'Heatmap', screen: 'heatmap', color: '#f472b6' },
    { icon: 'map', label: 'Find Seat', screen: 'map2d', color: '#a78bfa' },
    { icon: 'view_in_ar', label: 'AR Nav', screen: 'ar-nav', color: '#00ff9d' },
    { icon: 'fastfood', label: 'Order Food', screen: 'food', color: '#ffb800' },
    { icon: 'exit_to_app', label: 'Exit Plan', screen: 'exit-plan', color: '#fb923c' },
  ];

  return (
    <div className="min-h-dvh bg-[#0a0b14] overflow-y-auto pb-10">
      {/* Hero */}
      <div className="relative h-56"
        style={{ background: `linear-gradient(160deg, ${stadium.gradient[0]}44, ${stadium.gradient[1]}22, #0a0b14)` }}>
        
        <div className="absolute inset-0 flex items-center justify-end pr-10 opacity-15">
          <span className="text-[10rem] leading-none">{stadium.emoji}</span>
        </div>

        {/* Back */}
        <button onClick={() => navigate('stadiums')}
          className="absolute top-14 left-5 w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-xl"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        {/* Share */}
        <button className="absolute top-14 right-5 w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-xl"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-white">share</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0a0b14)' }} />

        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            {liveMatch && (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1"
                style={{ background: '#ff4d6a', color: 'white' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Match
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              {stadium.sport}
            </span>
          </div>
          <h1 className="font-headline font-black text-2xl text-white leading-tight">{stadium.name}</h1>
          <p className="text-sm text-white/50 mt-0.5">{stadium.city}, {stadium.state}</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { label: 'Capacity', value: stadium.capacity.toLocaleString(), icon: 'groups', color: '#00d4ff' },
            { label: 'Gates', value: String(stadium.gates), icon: 'sensor_door', color: '#a78bfa' },
            { label: 'Since', value: String(stadium.openedYear), icon: 'history', color: '#ffb800' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-headline font-black text-sm text-white">{s.value}</p>
              <p className="text-[10px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live Match Card */}
        {liveMatch && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,77,106,0.15), rgba(255,77,106,0.05))', border: '1px solid rgba(255,77,106,0.3)' }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4d6a] animate-pulse" />
                <span className="text-[10px] font-black text-[#ff4d6a] uppercase tracking-widest">Live Now · {liveMatch.league}</span>
              </div>
              {liveMatch.minute && (
                <span className="text-[10px] font-black text-white/50">{liveMatch.minute}&apos;</span>
              )}
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center flex-1">
                  <div className="text-3xl mb-1">{liveMatch.homeEmoji}</div>
                  <p className="text-xs font-bold text-white leading-tight">{liveMatch.homeTeam}</p>
                </div>
                <div className="px-4">
                  <p className="font-headline font-black text-2xl text-white">{liveMatch.score}</p>
                </div>
                <div className="text-center flex-1">
                  <div className="text-3xl mb-1">{liveMatch.awayEmoji}</div>
                  <p className="text-xs font-bold text-white leading-tight">{liveMatch.awayTeam}</p>
                </div>
              </div>
              {occupancyPct && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                    <div className="h-full rounded-full bg-[#ff4d6a]" style={{ width: `${occupancyPct}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-white/50">{liveMatch.attendance?.toLocaleString()} fans · {occupancyPct}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => navigate(a.screen as any)}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${a.color}18` }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: a.color, fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                </div>
                <p className="text-[11px] font-bold text-white text-center leading-tight">{a.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Matches */}
        {upcoming.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Upcoming at {stadium.shortName}</p>
            <div className="space-y-2">
              {upcoming.map(m => (
                <div key={m.id}
                  className="rounded-2xl px-4 py-3 flex items-center gap-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-2xl">{m.homeEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-wide">{m.league}</p>
                    <p className="text-sm font-bold text-white truncate">{m.homeTeam} vs {m.awayTeam}</p>
                    <p className="text-xs text-white/40">{m.date} · {m.time}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-[#00d4ff]">{m.ticketPrice}</p>
                    <button className="mt-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-black bg-white active:scale-95">
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stadium Info */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">About</p>
          <p className="text-sm text-white/60 leading-relaxed">{stadium.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Surface', value: stadium.surface },
              { label: 'Parking', value: `${stadium.parkingSpots.toLocaleString()} spots` },
            ].map(i => (
              <div key={i.label}>
                <p className="text-[10px] text-white/30 uppercase">{i.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
