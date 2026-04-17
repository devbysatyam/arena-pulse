'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { STADIUMS, STADIUM_MATCHES, STATES, CITIES, filterStadiums, getLiveMatchForStadium } from '@/lib/stadiums-data';

export default function StadiumBrowserScreen() {
  const { navigate, setSelectedStadiumId } = useAppStore();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const cities = useMemo(() =>
    stateFilter ? [...new Set(STADIUMS.filter(s => s.state === stateFilter).map(s => s.city))] : CITIES,
    [stateFilter]
  );

  const filtered = useMemo(() => {
    const base = filterStadiums(stateFilter, '', statusFilter);
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q)
    );
  }, [stateFilter, statusFilter, search]);

  const liveCount = STADIUM_MATCHES.filter(m => m.status === 'live').length;

  return (
    <div className="min-h-dvh bg-[#0a0b14] flex flex-col pb-24">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(0,212,255,0.12) 0%, transparent 55%)' }} />

      {/* Header */}
      <header className="px-5 pt-14 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Explore</p>
            <h1 className="font-headline font-black text-2xl text-white">Stadiums</h1>
          </div>
          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ background: 'rgba(255,77,106,0.15)', border: '1px solid rgba(255,77,106,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6a] animate-pulse" />
                <span className="text-[10px] font-black text-[#ff4d6a] uppercase">{liveCount} Live Now</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 h-12 rounded-2xl mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-white/30 text-xl">search</span>
          <input
            type="text"
            placeholder="Search stadium, city, state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <span className="material-symbols-outlined text-white/30 text-lg">close</span>
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 mb-3">
          {(['all', 'live', 'upcoming'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide transition-all
                ${statusFilter === s
                  ? s === 'live'
                    ? 'bg-[#ff4d6a] text-white'
                    : s === 'upcoming'
                    ? 'bg-[#7c5ff0] text-white'
                    : 'bg-white text-black'
                  : 'bg-white/5 text-white/40 border border-white/8'}`}>
              {s === 'live' ? '🔴 Live' : s === 'upcoming' ? '📅 Upcoming' : 'All'}
            </button>
          ))}
        </div>

        {/* State filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setStateFilter('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all
              ${!stateFilter ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30' : 'bg-white/5 text-white/40'}`}>
            All States
          </button>
          {STATES.map(st => (
            <button key={st} onClick={() => setStateFilter(stateFilter === st ? '' : st)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all
                ${stateFilter === st ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30' : 'bg-white/5 text-white/40'}`}>
              {st}
            </button>
          ))}
        </div>
      </header>

      {/* Stadium Grid */}
      <main className="flex-1 px-5 space-y-4 relative z-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🏟️</span>
            <p className="text-white font-bold">No stadiums found</p>
            <p className="text-white/40 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filtered.map(stadium => {
            const liveMatch = getLiveMatchForStadium(stadium.id);
            const matches = STADIUM_MATCHES.filter(m => m.stadiumId === stadium.id);
            const upcoming = matches.filter(m => m.status === 'upcoming');

            return (
              <button key={stadium.id}
                onClick={() => { setSelectedStadiumId(stadium.id); navigate('stadium-detail'); }}
                className="w-full rounded-3xl overflow-hidden text-left transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Stadium hero bar */}
                <div className="h-28 relative flex items-end p-4"
                  style={{ background: `linear-gradient(135deg, ${stadium.gradient[0]}33, ${stadium.gradient[1]}22)` }}>
                  <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-20">
                    <span className="text-8xl">{stadium.emoji}</span>
                  </div>

                  {/* Live badge */}
                  {liveMatch && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: 'rgba(255,77,106,0.9)', backdropFilter: 'blur(8px)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase">Live</span>
                    </div>
                  )}

                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{stadium.city} · {stadium.state}</p>
                    <h2 className="font-headline font-black text-lg text-white leading-tight">{stadium.name}</h2>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-white/30 text-sm">groups</span>
                      <span className="text-xs font-bold text-white/60">{stadium.capacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-white/30 text-sm">sports</span>
                      <span className="text-xs font-bold text-white/60">{stadium.sport}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-white/30 text-sm">calendar_month</span>
                      <span className="text-xs font-bold text-white/60">{upcoming.length} upcoming</span>
                    </div>
                  </div>

                  {liveMatch ? (
                    <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                      style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)' }}>
                      <div>
                        <p className="text-[9px] font-black text-[#ff4d6a] uppercase mb-0.5">{liveMatch.league}</p>
                        <p className="text-sm font-bold text-white">{liveMatch.homeEmoji} {liveMatch.homeTeam} vs {liveMatch.awayTeam} {liveMatch.awayEmoji}</p>
                        {liveMatch.score && <p className="text-xs font-black text-[#00d4ff] mt-0.5">{liveMatch.score}</p>}
                      </div>
                      <span className="material-symbols-outlined text-white/30">chevron_right</span>
                    </div>
                  ) : upcoming[0] && (
                    <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
                      style={{ background: 'rgba(124,95,240,0.08)', border: '1px solid rgba(124,95,240,0.15)' }}>
                      <div>
                        <p className="text-[9px] font-black text-[#a78bfa] uppercase mb-0.5">Next · {upcoming[0].date} {upcoming[0].time}</p>
                        <p className="text-sm font-bold text-white">{upcoming[0].homeEmoji} {upcoming[0].homeTeam} vs {upcoming[0].awayTeam} {upcoming[0].awayEmoji}</p>
                      </div>
                      <span className="material-symbols-outlined text-white/30">chevron_right</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </main>
    </div>
  );
}
