'use client';
import { useAppStore } from '@/store/app-store';
import { useEffect, useState } from 'react';

export default function OrderTrackScreen() {
  const { navigate, activeOrder, setActiveOrder, setNavRoute } = useAppStore();
  const [progress, setProgress] = useState(0); // 0 to 100

  // Simulate order progress
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'collected') return;

    let step = 0;
    const interval = setInterval(() => {
      step += 2;
      setProgress(Math.min(step, 100));
      
      if (step >= 50 && activeOrder.status === 'placed') {
         setActiveOrder({ ...activeOrder, status: 'preparing' });
      }
      if (step >= 99 && activeOrder.status !== 'ready') {
         setActiveOrder({ ...activeOrder, status: 'ready' });
         clearInterval(interval);
      }
    }, 100); // Super fast for demo

    return () => clearInterval(interval);
  }, [activeOrder?.id]);

  if (!activeOrder) {
     return <div className="min-h-dvh flex items-center justify-center bg-[#0a0b14]"><button onClick={() => navigate('home')} className="text-white">Return Home</button></div>;
  }

  const isReady = activeOrder.status === 'ready';

  const handleNavigate = () => {
     setNavRoute('SA2', 'F1'); // Hardcoded demo route to stall F1
     navigate('ar-nav');
  };

  const handleCollected = () => {
    setActiveOrder(null);
    navigate('home');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      {/* Background celebration when ready */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none z-0"
             style={{ background: 'radial-gradient(ellipse at top, rgba(0,255,157,0.15) 0%, transparent 70%)' }} />
      )}

      <header className="px-5 pt-14 pb-4 flex items-center gap-3 relative z-20">
        <button onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Close">
          <span className="material-symbols-outlined text-white">close</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg text-white">Order {activeOrder.id}</h1>
          <p className="text-xs text-white/50">{activeOrder.stallLabel}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-8 relative z-20 flex flex-col justify-center items-center">
        
        {/* Animated Status Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
           {/* SVG Progress Ring */}
           <svg className="absolute inset-0 w-full h-full -rotate-90">
             <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
             <circle cx="128" cy="128" r="120" fill="none" 
                     stroke={isReady ? '#00ff9d' : '#00d4ff'} 
                     strokeWidth="8" 
                     strokeDasharray="753.6" // 2 * pi * r ≈ 753.98
                     strokeDashoffset={753.6 - (753.6 * progress) / 100}
                     strokeLinecap="round"
                     className="transition-all duration-300 ease-out"
                     style={{ filter: isReady ? 'drop-shadow(0 0 12px rgba(0,255,157,0.5))' : 'drop-shadow(0 0 12px rgba(0,212,255,0.5))' }} />
           </svg>
           
           {/* Center Content */}
           <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-2" 
                    style={{ color: isReady ? '#00ff9d' : '#00d4ff', filter: isReady ? 'drop-shadow(0 0 10px rgba(0,255,157,0.4))' : 'none' }}>
                 {isReady ? 'check_circle' : 'skillet'}
              </span>
              <h2 className="font-headline font-black text-2xl text-white">
                {isReady ? 'Ready for Pickup' : 'Preparing Order'}
              </h2>
              {isReady && (
                <p className="text-xs text-[#00ff9d] font-bold uppercase tracking-widest mt-2 animate-pulse">Skip the queue</p>
              )}
           </div>
        </div>

        {/* Order Details */}
        <div className="w-full bg-white/5 rounded-2xl p-5 border border-white/5 mb-6">
           <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Items</h3>
           <div className="space-y-2 mb-4">
              {activeOrder.items.map(i => (
                 <div key={i.id} className="flex justify-between text-sm text-white">
                    <span>{i.qty}x {i.name}</span>
                 </div>
              ))}
           </div>
           
           {isReady && (
              <div className="pt-4 border-t border-white/5">
                 <p className="text-[10px] uppercase text-white/40 mb-1">Passcode</p>
                 <p className="font-headline font-black text-3xl tracking-widest text-white">{activeOrder.id.split('-')[1]}</p>
                 <p className="text-xs text-white/50 mt-1">Show this code at the collection point</p>
              </div>
           )}
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3 mt-auto">
           {isReady ? (
             <>
               <button onClick={handleNavigate}
                       className="flex-1 h-14 rounded-2xl flex border border-[#00d4ff]/30 items-center justify-center gap-2 font-bold text-sm bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-all">
                  <span className="material-symbols-outlined text-lg">view_in_ar</span> AR Nav
               </button>
               <button onClick={handleCollected}
                       className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-headline font-black bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all active:scale-95">
                  <span className="material-symbols-outlined text-lg">done_all</span> Collected
               </button>
             </>
           ) : (
             <button onClick={() => navigate('home')}
                     className="w-full h-14 rounded-2xl flex items-center justify-center bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all">
                Close & Track in background
             </button>
           )}
        </div>

      </main>
    </div>
  );
}
