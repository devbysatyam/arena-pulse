'use client';
import { useAppStore } from '@/store/app-store';
import { useState, useEffect } from 'react';
import { MATCH, USER_SEAT } from '@/lib/stadium-data';

export default function TicketScreen() {
  const { user, ticketScanned } = useAppStore();
  const [brightness, setBrightness] = useState(false);
  
  // Fake raise brightness effect for scanning
  useEffect(() => {
    setBrightness(true);
    return () => setBrightness(false);
  }, []);

  if (!user || user.isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-5">
        <span className="material-symbols-outlined text-6xl text-white/20 mb-4">confirmation_number</span>
        <h2 className="font-headline font-bold text-xl text-white">Sign I Required</h2>
        <p className="text-white/50 text-center text-sm mt-2">Sign in to view your match ticket and access gates.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh flex flex-col bg-[#0a0b14] pb-nav transition-all duration-1000 ${brightness ? 'bg-white/5' : ''}`}>
      <header className="px-5 pt-14 pb-3 flex items-center justify-between z-20">
        <h1 className="font-headline font-black text-2xl text-white tracking-tight">My Ticket</h1>
      </header>

      <main className="flex-1 px-5 flex flex-col pt-4">
        {/* Ticket Container */}
        <div className="relative rounded-[2rem] overflow-hidden flex flex-col w-full mx-auto"
          style={{ 
            maxWidth: 380, 
            background: 'linear-gradient(135deg, #131428, #1a1532)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
          
          {/* Top section - Match Info */}
          <div className="px-6 py-6 pb-8 relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-bold mb-1">Premier League</p>
                <p className="text-[10px] text-white/50 opacity-80">{MATCH.date}</p>
              </div>
              <img src="/api/placeholder/40/40" alt="League Logo" className="w-10 h-10 rounded-full bg-white/10" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="text-center">
                <p className="font-headline font-black text-3xl text-white">CHE</p>
                <p className="text-xs text-white/50">Chelsea FC</p>
              </div>
              <div className="font-black text-lg text-white/30 px-3">VS</div>
              <div className="text-center">
                <p className="font-headline font-black text-3xl text-white">ARS</p>
                <p className="text-xs text-white/50">Arsenal FC</p>
              </div>
            </div>

            {/* Perforation line */}
            <div className="absolute left-0 right-0 bottom-0 h-px transform translate-y-1/2 flex justify-between px-2">
              <div className="w-4 h-4 rounded-full bg-[#0a0b14] transform -translate-x-1/2"></div>
              <div className="flex-1 border-b-2 border-dashed border-white/10 mx-2 transform -translate-y-2"></div>
              <div className="w-4 h-4 rounded-full bg-[#0a0b14] transform translate-x-1/2"></div>
            </div>
          </div>

          {/* Middle section - Seat Info */}
          <div className="px-6 py-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="col-span-1">
                <p className="text-[10px] text-white/40 uppercase mb-1">Gate</p>
                <p className="font-headline font-bold text-xl text-[#00d4ff]">{USER_SEAT.gate.replace('G','')}</p>
              </div>
              <div className="col-span-1 border-l border-white/5 pl-4">
                <p className="text-[10px] text-white/40 uppercase mb-1">Block</p>
                <p className="font-headline font-bold text-xl text-white">{USER_SEAT.block}</p>
              </div>
              <div className="col-span-1 border-l border-white/5 pl-4">
                <p className="text-[10px] text-white/40 uppercase mb-1">Row</p>
                <p className="font-headline font-bold text-xl text-white">{USER_SEAT.row}</p>
              </div>
              <div className="col-span-1 border-l border-white/5 pl-4">
                <p className="text-[10px] text-white/40 uppercase mb-1">Seat</p>
                <p className="font-headline font-bold text-xl text-white">{USER_SEAT.seat}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-white/40 uppercase mb-1">Name</p>
              <p className="text-sm font-bold text-white">{user.name}</p>
            </div>
          </div>

          {/* Bottom section - QR / Scan state */}
          <div className="px-6 py-8 flex flex-col items-center bg-white justify-center min-h-[180px] relative">
            {ticketScanned ? (
              <div className="flex flex-col items-center animate-fade-up">
                <div className="w-16 h-16 rounded-full bg-[#00ff9d] mb-3 flex items-center justify-center animate-scale-in">
                  <span className="material-symbols-outlined text-black text-3xl font-bold">check</span>
                </div>
                <p className="font-headline font-black text-[#131313] text-lg uppercase tracking-wider">Scanned</p>
                <p className="text-xs text-black/50 font-bold mt-1">Enjoy the match!</p>
              </div>
            ) : (
              <>
                 <div className="w-48 h-48 bg-gray-200 rounded-xl relative p-2 overflow-hidden flex items-center justify-center">
                    {/* Simulated QR code */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${user.uid}-ticket`} alt="QR Code" className="w-[160px] h-[160px]" style={{ mixBlendMode: 'multiply' }} />
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#7c5ff0] scan-line" style={{ boxShadow: '0 0 10px #7c5ff0, 0 0 20px #00d4ff' }} />
                 </div>
                 <p className="text-xs text-black/40 font-bold uppercase tracking-widest mt-4">Scan at Turnstile</p>
              </>
            )}
            
            {/* Cutouts for the bottom part */}
            <div className="absolute top-0 left-0 right-0 flex justify-between transform -translate-y-1/2 px-2">
              <div className="w-4 h-4 rounded-full bg-[#0a0b14] transform -translate-x-1/2"></div>
              <div className="w-4 h-4 rounded-full bg-[#0a0b14] transform translate-x-1/2"></div>
            </div>
          </div>
        </div>

        {/* Action beneath ticket */}
        <div className="mt-8 flex justify-center text-center px-4">
            <p className="text-xs text-white/40 leading-relaxed font-medium">To speed up entry, brightness has automatically been increased. Have your QR code ready at the gate.</p>
        </div>
      </main>
    </div>
  );
}
