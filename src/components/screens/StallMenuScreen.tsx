'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { AMENITIES } from '@/lib/stadium-data';

const MENU = [
  { id: 'm1', name: 'Classic Cheeseburger', price: 8.50, desc: 'Beef patty, double cheese, signature sauce', emoji: '🍔', popular: true },
  { id: 'm2', name: 'Stadium Hotdog', price: 6.00, desc: 'Jumbo frankfurter, mustard, ketchup, onions', emoji: '🌭', popular: false },
  { id: 'm3', name: 'Loaded Fries', price: 5.50, desc: 'Skin-on fries with cheese sauce and jalapeños', emoji: '🍟', popular: true },
  { id: 'm4', name: 'Local Lager (Pint)', price: 7.00, desc: '4.8% ABV Draught beer', emoji: '🍺', popular: true },
  { id: 'm5', name: 'Soft Drink', price: 3.50, desc: 'Cola, Lemonade, or Orange', emoji: '🥤', popular: false },
];

export default function StallMenuScreen() {
  const { navigate, selectedAmenity, cart, addToCart, removeFromCart, updateQty } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<'food' | 'drink' | 'snack'>('food');
  const stall = AMENITIES.find(a => a.id === selectedAmenity);
  
  if (!stall) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-[#0a0b14] px-6 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)' }}>🍔</div>
        <div>
          <p className="font-headline font-black text-xl text-white mb-2">Stall not found</p>
          <p className="text-sm text-white/40">Choose a stall from the Catering menu</p>
        </div>
        <button onClick={() => navigate('food')}
          className="h-14 px-8 rounded-2xl font-headline font-black text-base flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#ffb800,#ff8c00)', color: '#0a0b14' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fastfood</span>
          Browse Stalls
        </button>
      </div>
    );
  }

  const filteredMenu = MENU.filter(item => {
    if (activeCategory === 'drink') return item.id === 'm4' || item.id === 'm5';
    if (activeCategory === 'food') return item.id === 'm1' || item.id === 'm2';
    if (activeCategory === 'snack') return item.id === 'm3';
    return true;
  });

  const cartTotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  const cartQty = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      {/* Header */}
      <header className="px-5 pt-14 pb-4 flex items-center gap-3 relative z-20">
        <button onClick={() => navigate('food')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Back">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg text-white">{stall.label}</h1>
          <p className="text-xs text-white/50">{stall.waitMin} min wait · Collect at stall</p>
        </div>
      </header>

      {/* Main Menu */}
      <main className="flex-1 px-5 pt-2 pb-[120px] overflow-y-auto">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveCategory('food')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === 'food' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            Food
          </button>
          <button 
            onClick={() => setActiveCategory('drink')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === 'drink' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            Drinks
          </button>
          <button 
            onClick={() => setActiveCategory('snack')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === 'snack' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            Snacks
          </button>
        </div>

        <div className="space-y-4">
          {filteredMenu.map(item => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                 <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(255,184,0,0.1), transparent)' }}>
                    <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                    {item.popular && (
                      <div className="absolute top-0 right-0 bg-[#ffb800] text-[#131313] text-[8px] font-black uppercase px-1 rounded-bl">Pop</div>
                    )}
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-sm text-white">{item.name}</h3>
                         <span className="font-bold text-sm text-[#00d4ff]">£{item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-tight mt-1 mb-2">{item.desc}</p>
                    </div>
                    
                    <div className="flex justify-end">
                       {inCart ? (
                         <div className="flex items-center gap-3 bg-white/10 rounded-full px-1 py-1">
                           <button onClick={() => updateQty(item.id, -1)} 
                                   className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all">
                             <span className="material-symbols-outlined text-[14px]">remove</span>
                           </button>
                           <span className="text-xs font-bold w-4 text-center">{inCart.qty}</span>
                           <button onClick={() => updateQty(item.id, 1)}
                                   className="w-6 h-6 rounded-full flex items-center justify-center bg-[#00d4ff] text-[#131313] hover:bg-[#00b8ff] active:scale-95 transition-all">
                             <span className="material-symbols-outlined text-[14px]">add</span>
                           </button>
                         </div>
                       ) : (
                         <button onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, stallId: stall.id })}
                                 className="flex items-center gap-1 bg-[#00d4ff]/10 text-[#00d4ff] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#00d4ff]/20 active:scale-95 transition-all">
                           <span className="material-symbols-outlined text-[14px]">add</span> Add
                         </button>
                       )}
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Cart Bar */}
      {cartQty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0b14] via-[#0a0b14]/90 to-transparent z-30 pb-nav">
           <button onClick={() => navigate('cart')}
                   className="w-full h-14 rounded-2xl flex items-center justify-between px-5 font-headline font-bold"
                   style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)', boxShadow: '0 4px 20px rgba(0,212,255,0.4)', color: '#0a0b14' }}>
              <div className="flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-[#0a0b14] text-[#00d4ff] flex items-center justify-center text-xs">{cartQty}</span>
                 <span>View Cart</span>
              </div>
              <span>£{cartTotal.toFixed(2)}</span>
           </button>
        </div>
      )}
    </div>
  );
}
