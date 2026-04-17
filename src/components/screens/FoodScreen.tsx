'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { AMENITIES, USER_SEAT } from '@/lib/stadium-data';

export default function FoodScreen() {
  const { navigate, setSelectedAmenity, cart } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<'all'|'food'|'drink'|'snack'>('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'food', label: 'Meals', icon: 'flatware' },
    { id: 'drink', label: 'Drinks', icon: 'local_bar' },
    { id: 'snack', label: 'Snacks', icon: 'ice_skating' },
  ];

  const allFoodStalls = AMENITIES.filter(a => a.type === 'food').sort((a,b) => (a.waitMin||0) - (b.waitMin||0));
  
  const filteredStalls = activeCategory === 'all' 
    ? allFoodStalls 
    : allFoodStalls.filter(s => s.category === activeCategory);

  const handleSelect = (id: string) => {
    setSelectedAmenity(id);
    navigate('stall-menu');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] pb-nav">
      <header className="px-5 pt-14 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div>
             <h1 className="font-headline font-black text-3xl text-white tracking-tight">Catering</h1>
             <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1 italic">Premium Stadium Flavors</p>
           </div>
           <button onClick={() => navigate('cart')} className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffb800] text-black text-[10px] font-black flex items-center justify-center border-2 border-[#0a0b14]">
                  {cart.reduce((a,b)=>a+b.qty,0)}
                </span>
              )}
           </button>
        </div>
        
        {/* Search Bar */}
        <div className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4 gap-3 pointer-events-none opacity-50">
          <span className="material-symbols-outlined text-white/40">search</span>
          <input type="text" placeholder="Search stalls or menus..." className="bg-transparent border-none outline-none text-white text-sm w-full font-medium" disabled />
        </div>
      </header>

      {/* Categories Tabs */}
      <div className="px-5 mb-6 overflow-x-auto no-scrollbar flex items-center gap-3">
         {categories.map(cat => (
           <button key={cat.id} 
                   onClick={() => setActiveCategory(cat.id as any)}
                   className={`flex-shrink-0 h-11 px-5 rounded-xl flex items-center gap-2 border transition-all ${activeCategory === cat.id ? 'bg-[#ffb800] border-[#ffb800] text-black font-black scale-105 shadow-[0_0_15px_rgba(255,184,0,0.3)]' : 'bg-white/5 border-white/10 text-white/50 font-bold'}`}>
              <span className="material-symbols-outlined text-lg">{cat.icon}</span>
              <span className="text-[11px] uppercase tracking-wider">{cat.label}</span>
           </button>
         ))}
      </div>

      <main className="flex-1 px-5 space-y-4 pb-8">
        <div className="flex items-center justify-between px-1 mb-2">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Available Stalls</h3>
           <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Near Sec {USER_SEAT.section}</span>
        </div>

        {filteredStalls.map(stall => (
          <button key={stall.id} onClick={() => handleSelect(stall.id)}
            className="w-full text-left bg-gradient-to-br from-white/5 to-transparent rounded-[32px] p-4 flex items-center gap-5 border border-white/5 group hover:border-white/20 transition-all active:scale-[0.98]">
              
              <div className="w-16 h-16 rounded-[22px] flex items-center justify-center flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <span className="text-3xl" aria-hidden="true">
                    {stall.category === 'drink' ? '🍺' : stall.category === 'snack' ? '🍿' : '🍔'}
                 </span>
              </div>
              
              <div className="flex-1">
                <h4 className="font-headline font-black text-base text-white group-hover:text-[#ffb800] transition-colors tracking-tight">{stall.label}</h4>
                <div className="flex items-center gap-2 mt-1 mb-2">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/5">
                      <div className="w-1 h-1 rounded-full animate-pulse" 
                           style={{ background: stall.queue==='low'?'#00ff9d':stall.queue==='moderate'?'#ffb800':'#ff4d6a' }} />
                      <span className="text-[9px] font-black uppercase tracking-widest pt-0.5 text-white/60">{stall.queue} Flow</span>
                   </div>
                   <span className="text-[10px] text-white/20">•</span>
                   <span className="text-[10px] text-white/40 font-bold uppercase">{stall.category}</span>
                </div>
                
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1 text-[12px] font-black text-[#ffb800]">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      {stall.waitMin} MIN
                   </div>
                </div>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#ffb800] group-hover:text-black transition-all">
                 <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </div>
            </button>
          ))}
          
          {filteredStalls.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-white/20">
               <span className="material-symbols-outlined text-6xl mb-4">no_stroller</span>
               <p className="text-sm font-bold uppercase tracking-widest">No stalls found</p>
            </div>
          )}
      </main>
    </div>
  );
}
