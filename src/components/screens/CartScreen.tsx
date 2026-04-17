'use client';
import { useAppStore } from '@/store/app-store';
import { useState } from 'react';

export default function CartScreen() {
  const { navigate, cart, updateQty, cartTotal, clearCart, setActiveOrder } = useAppStore();
  const [loading, setLoading] = useState(false);

  const total = cartTotal();
  const fee = 1.20;

  const handleCheckout = async () => {
    setLoading(true);
    // Simulate transaction
    await new Promise(r => setTimeout(r, 1500));
    
    // Create order
    const order = {
      id: `ORD-${Math.floor(Math.random()*10000)}`,
      items: [...cart],
      total: total + fee,
      status: 'placed' as const,
      stallLabel: 'Stall B3 — East Concourse', // Simplified for demo
      placedAt: new Date()
    };
    
    setActiveOrder(order);
    clearCart();
    setLoading(false);
    navigate('order-track');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0a0b14] px-5 text-center">
        <span className="text-6xl mb-4 opacity-50">🛒</span>
        <h2 className="font-headline font-bold text-xl text-white mb-2">Cart is empty</h2>
        <p className="text-white/50 text-sm mb-6">Looks like you haven't added anything yet.</p>
        <button onClick={() => navigate('food')} className="bg-[#00d4ff]/10 text-[#00d4ff] px-6 py-2.5 rounded-xl font-bold">
          Browse Food
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      <header className="px-5 pt-14 pb-4 flex items-center gap-3 relative z-20">
        <button onClick={() => navigate('stall-menu')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Back">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-xl text-white">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pt-2 pb-32 overflow-y-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6">
          <h2 className="font-bold text-sm text-white border-b border-white/5 pb-3 mb-3">Order Summary</h2>
          <div className="space-y-4">
             {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white/10 rounded-full px-1 py-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                           <span className="material-symbols-outlined text-[12px]">remove</span>
                        </button>
                        <span className="text-xs font-bold w-3 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#131313] flex items-center justify-center">
                           <span className="material-symbols-outlined text-[12px]">add</span>
                        </button>
                      </div>
                      <span className="text-sm text-white font-medium">{item.name}</span>
                   </div>
                   <span className="text-sm text-white font-bold">£{(item.price * item.qty).toFixed(2)}</span>
                </div>
             ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 space-y-2">
           <div className="flex justify-between text-sm text-white/60">
             <span>Subtotal</span>
             <span>£{total.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-sm text-white/60 pb-2 border-b border-white/5">
             <span>Collection Fee</span>
             <span>£{fee.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-lg font-bold text-white pt-1">
             <span>Total</span>
             <span className="text-[#00d4ff]">£{(total + fee).toFixed(2)}</span>
           </div>
        </div>

        <div className="bg-[#00ff9d]/10 rounded-2xl p-4 border border-[#00ff9d]/30 flex gap-3">
           <span className="material-symbols-outlined text-[#00ff9d]">info</span>
           <p className="text-xs text-[#00ff9d]/80 leading-relaxed">
             You will be notified when your order is ready. Skip the main queue and head straight to the collection point at the stall.
           </p>
        </div>
      </main>

      {/* Pay Button Sticky */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0b14] via-[#0a0b14]/90 to-transparent pb-nav">
         <button onClick={handleCheckout} disabled={loading}
                 className="w-full relative overflow-hidden h-14 rounded-2xl flex items-center justify-center gap-2 font-headline font-black text-lg transition-all active:scale-95 disabled:opacity-70"
                 style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)', boxShadow: '0 0 20px rgba(0,212,255,0.4)', color: '#0a0b14' }}>
            {loading ? (
             <div className="w-5 h-5 rounded-full border-2 border-[#0a0b14]/30 border-t-[#0a0b14] animate-spin" />
            ) : (
             <><span>Pay £{(total + fee).toFixed(2)}</span> <span className="material-symbols-outlined ml-1">apple_pay</span></>
            )}
         </button>
      </div>
    </div>
  );
}
