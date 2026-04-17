'use client';
import { useAppStore } from '@/store/app-store';
import { AMENITIES, AMENITY_COLORS, AMENITY_ICONS } from '@/lib/stadium-data';

export default function AmenitiesScreen() {
  const { navigate, setNavRoute } = useAppStore();

  const handleRoute = (id: string, label: string) => {
    // Assuming starting from 'SA2' (User Seat) for demo purposes, 
    // ideally read from store's user location
    setNavRoute('SA2', id); 
    navigate('map2d');
  };

  // Group amenities by type
  const grouped = AMENITIES.reduce((acc, curr) => {
    if(!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {} as Record<string, typeof AMENITIES>);

  const types = Object.keys(grouped) as Array<keyof typeof AMENITY_ICONS>;

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14] pb-nav">
      <header className="px-5 pt-14 pb-3 flex items-center gap-3 z-20">
        <div className="flex-1">
          <h1 className="font-headline font-black text-2xl text-white">Stadium Directory</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 overflow-y-auto">
        {types.map(type => (
          <div key={type} className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 mb-3 flex items-center gap-2">
              <span className="text-base" aria-hidden="true">{AMENITY_ICONS[type]}</span>
              {type === 'wc' ? 'Washrooms' : type === 'firstaid' ? 'Medical' : type === 'merch' ? 'Merchandise' : type}
            </h2>
            
            <div className="grid gap-3">
              {grouped[type].map(amenity => (
                <div key={amenity.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: `${AMENITY_COLORS[type]}15` }}>
                        <span aria-hidden="true">{AMENITY_ICONS[type]}</span>
                     </div>
                     <div>
                        <p className="font-bold text-sm text-white">{amenity.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">Near Section {amenity.sectionNear} · Lvl {amenity.level}</p>
                     </div>
                  </div>
                  <button onClick={() => handleRoute(amenity.id, amenity.label)}
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors"
                          aria-label={`Navigate to ${amenity.label}`}>
                     <span className="material-symbols-outlined text-sm">directions</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-4 mb-12 p-1 border-t border-white/5 pt-8">
           <button 
             onClick={() => navigate('admin')}
             className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-colors group"
           >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5 text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-colors">
                 <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              </div>
              <div className="text-left">
                 <p className="font-bold text-sm text-white/60 group-hover:text-white transition-colors">Admin Panel</p>
                 <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Staff Operations · Restricted</p>
              </div>
              <span className="material-symbols-outlined ml-auto text-white/20 text-sm">chevron_right</span>
           </button>
        </div>
      </main>
    </div>
  );
}
