'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { GATES, getCrowdLabel, getCrowdColor, USER_SEAT } from '@/lib/stadium-data';

export default function ExitPlanScreen() {
  const { navigate, setNavRoute } = useAppStore();

  // Find safest/fastest gates
  const sortedGates = [...GATES]
    .sort((a,b) => {
       const qV = { low:1, moderate:2, high:3 };
       return qV[a.queue] - qV[b.queue];
    });

  const bestGate = sortedGates[0];

  const [selectedGateId, setSelectedGateId] = useState<string | null>(bestGate.id);
  const selectedGate = GATES.find(g => g.id === selectedGateId) || bestGate;

  const handleRoute = () => {
    setNavRoute(USER_SEAT.entryNode, selectedGate.id);
    navigate('ar-nav');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] pb-nav">
      <header className="px-5 pt-14 pb-3 flex items-center gap-3 z-20">
        <button onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Back">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-xl text-white tracking-tight">Exit Plan</h1>
          <p className="text-xs text-white/50">Smart routing to beat the crowds</p>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4">
         <div className="bg-gradient-to-br from-[#00ff9d]/20 to-[#00ff9d]/5 rounded-3xl p-6 border border-[#00ff9d]/30 mb-8 relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-8xl text-[#00ff9d]">directions_walk</span>
            </div>
            
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#00ff9d]/80 mb-2">Selected Exit</h2>
            <p className="font-headline font-black text-4xl text-white mb-2">{selectedGate.label}</p>
            <p className="text-sm text-white/60 mb-8 w-4/5 leading-relaxed">
               {selectedGate.id === bestGate.id 
                 ? "Our recommended fastest route out of the stadium based on live data." 
                 : "Manual override selected. This route may have higher wait times."}
            </p>
            
            <button onClick={handleRoute}
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 bg-[#00ff9d] text-black font-headline font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,157,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
               <span className="material-symbols-outlined">visibility</span> Start AR Navigation
            </button>
         </div>

         <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">All Access Gates</h3>
            <span className="text-[10px] font-bold text-[#00ff9d] uppercase">Live Status</span>
         </div>
         
         <div className="grid gap-3 pb-8">
            {sortedGates.map(g => (
               <button key={g.id} 
                       onClick={() => setSelectedGateId(g.id)}
                       className={`w-full text-left rounded-2xl p-4 flex items-center justify-between border transition-all ${selectedGateId === g.id ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30 scale-[1.02] shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedGateId === g.id ? 'bg-[#00ff9d] text-black' : 'bg-white/5 text-white/40'}`}>
                       <span className="material-symbols-outlined">{g.open ? 'door_open' : 'door_back'}</span>
                    </div>
                    <div>
                      <span className="font-black text-white text-base tracking-tight">{g.label}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: g.open?'#00ff9d':'#ff4d6a' }}>
                        {g.open ? 'Open Now' : 'Gate Closed'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                      {!g.open ? (
                         <span className="px-2 py-1 rounded-lg bg-black/40 text-[#ff4d6a] text-[9px] font-black uppercase border border-[#ff4d6a]/20">Standby</span>
                      ) : (
                         <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                              style={{ 
                                background: g.queue==='low'?'rgba(0,255,157,0.1)':'rgba(255,184,0,0.1)',
                                borderColor: g.queue==='low'?'rgba(0,255,157,0.2)':'rgba(255,184,0,0.2)' 
                              }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" 
                                 style={{ background: g.queue==='low'?'#00ff9d':g.queue==='moderate'?'#ffb800':'#ff4d6a' }} />
                            <span className="text-[9px] font-black uppercase tracking-tighter"
                                  style={{ color: g.queue==='low'?'#00ff9d':g.queue==='moderate'?'#ffb800':'#ff4d6a' }}>
                              {g.queue} Flow
                            </span>
                         </div>
                      )}
                  </div>
               </button>
            ))}
         </div>
      </main>
    </div>
  );
}
