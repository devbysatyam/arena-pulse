'use client';
import { useAppStore } from '@/store/app-store';
import { SECTIONS, getCrowdColor, getCrowdLabel } from '@/lib/stadium-data';
import { subscribeToCrowd, type CrowdData } from '@/lib/firestore-service';
import { useFirestoreSubscription } from '@/hooks/useFirestore';

/**
 * HeatmapScreen — Live crowd density display
 *
 * Subscribes to Firestore `crowd/{stadiumId}` — updates instantly
 * when an admin changes section values in the Admin panel.
 * Falls back to static SECTIONS data if Firestore is unavailable.
 */
export default function HeatmapScreen() {
  const { navigate, selectedStadiumId } = useAppStore();
  const stadiumId = selectedStadiumId ?? 'nm-stadium';

  // Live Firestore subscription — falls back to static if unavailable
  const { data: crowdData, loading } = useFirestoreSubscription<CrowdData>(
    (update) => subscribeToCrowd(stadiumId, update),
    [stadiumId]
  );

  // Merge Firestore values with static section metadata
  const liveSections = SECTIONS.map(sec => ({
    ...sec,
    occupancy: crowdData?.sections[sec.id] ?? sec.occupancy,
  }));

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] pb-nav">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-14 pb-3 z-20">
        <button
          onClick={() => navigate('map2d')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Back to map">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg text-white">Crowd Density</h1>
          <p className="text-xs text-white/50">Real-time updates via Firestore</p>
        </div>
        {loading && (
          <div className="w-4 h-4 rounded-full border border-[#00d4ff] border-t-transparent animate-spin" aria-label="Loading live data" />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 flex flex-col pt-2">
        {/* Radar Graphic */}
        {/* Dynamic description for the radar for screen readers */}
        <div className="sr-only" aria-live="polite">
          {liveSections.length > 0 && (
            `Stadium crowd overview: Busiest zone is ${[...liveSections].sort((a,b) => b.occupancy - a.occupancy)[0].id} at ${[...liveSections].sort((a,b) => b.occupancy - a.occupancy)[0].occupancy} percent capacity.`
          )}
        </div>

        <div className="relative aspect-square w-full max-w-[340px] mx-auto rounded-full mt-4 mb-8"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,95,240,0.05) 0%, rgba(10,11,20,0) 70%)' }}
          role="img"
          aria-label={`Interactive crowd density radar showing zone occupancy across the stadium concourse.`}>


          {[1, 2, 3, 4].map(layer => (
            <div key={layer} className="absolute inset-0 rounded-full border"
              style={{
                margin: `${(4 - layer) * 12}%`,
                borderColor: `rgba(255,255,255,${0.03 * layer})`,
                borderStyle: layer % 2 === 0 ? 'solid' : 'dashed',
              }} />
          ))}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-white/5" />
            <div className="absolute w-px h-full bg-white/5" />
          </div>

          {liveSections.map(sec => {
            const rot = sec.angle;
            const color = getCrowdColor(sec.occupancy);
            const r = sec.occupancy * 0.8;
            return (
              <div key={sec.id} className="absolute inset-0 origin-center pointer-events-none"
                style={{ transform: `rotate(${rot}deg)` }}>
                <div className="absolute top-[15%] left-1/2 -ml-[20px] w-[40px] h-[80px] rounded-[50%_50%_0_0]"
                  style={{
                    background: `radial-gradient(ellipse at bottom, ${color}80 0%, ${color}00 70%)`,
                    opacity: r / 80 + 0.2,
                    filter: `blur(${100 - r}px)`,
                  }} />
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 bg-[#0a0b14]/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/10"
                  style={{ transform: `rotate(${-rot}deg)` }}>
                  <span className="text-[9px] font-bold" style={{ color }}>{sec.id}</span>
                </div>
              </div>
            );
          })}

          {/* Radar scan line */}
          <div className="absolute inset-0 rounded-full origin-center animate-spin-slow pointer-events-none"
            style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(0,212,255,0.05) 99%, rgba(0,212,255,0.5) 100%)' }} />
        </div>

        {/* Section List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Zone Status</h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#00d4ff]/10" aria-live="polite" aria-atomic="false">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-[#ffb800]' : 'bg-[#00d4ff] animate-pulse'}`} />
            <span className="text-[10px] text-[#00d4ff] font-bold tracking-wider">
              {loading ? 'SYNCING' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Live section cards */}
        <ul
          className="space-y-3 pb-8"
          aria-live="polite"
          aria-label="Stadium zone crowd status — updates in real time">
          {[...liveSections]
            .sort((a, b) => b.occupancy - a.occupancy)
            .map(sec => {
              const col = getCrowdColor(sec.occupancy);
              const lbl = getCrowdLabel(sec.occupancy);
              return (
                <li key={sec.id} className="flex items-center gap-4 bg-white/5 rounded-2xl p-3 border border-white/5">
                  <div className="w-12 text-center">
                    <span className="font-headline font-black text-lg text-white block leading-none">{sec.id}</span>
                    <span className="text-[9px] text-white/40 uppercase font-bold">Block</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-base font-bold text-white tracking-tight">{sec.label.split(' ')[0]} Stand</span>
                      <span className="text-xs font-black tracking-tighter" style={{ color: col }} aria-label={`${sec.occupancy}% — ${lbl}`}>
                        {lbl.toUpperCase()} ({sec.occupancy}%)
                      </span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden" role="progressbar"
                      aria-valuenow={sec.occupancy} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`${sec.label} occupancy`}>
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${sec.occupancy}%`, background: col, boxShadow: `0 0 10px ${col}` }} />
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      </main>
    </div>
  );
}
