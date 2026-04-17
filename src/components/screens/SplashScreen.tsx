'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

export default function SplashScreen() {
  const { navigate } = useAppStore();

  useEffect(() => {
    const t = setTimeout(() => navigate('welcome'), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0f3a 0%, #0a0b14 60%)' }}>

      {/* Ambient rings */}
      {[200, 320, 440].map((s, i) => (
        <div key={i} className="absolute rounded-full border border-white/5"
          style={{ width: s, height: s, animationDelay: `${i * 0.5}s` }} />
      ))}

      {/* Rotating outer ring */}
      <div className="absolute w-72 h-72 rounded-full animate-spin-slow"
        style={{ border: '1px solid rgba(124,95,240,0.2)', borderTopColor: '#7c5ff0' }} />

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-4 animate-scale-in">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg,#7c5ff0,#00d4ff)',
            boxShadow: '0 0 60px rgba(124,95,240,0.5), 0 0 120px rgba(0,212,255,0.2)',
          }}>
          <span className="text-5xl select-none">🏟️</span>
        </div>

        <div className="text-center">
          <h1 className="font-headline font-black text-4xl tracking-tight"
            style={{ background: 'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            ARENA PULSE
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color:'rgba(255,255,255,0.4)' }}>
            Smart Stadium Companion
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-px bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full animate-[progress_2.4s_ease-in-out_forwards]"
          style={{
            background: 'linear-gradient(90deg,#7c5ff0,#00d4ff)',
            width: '0%',
            animation: 'progress 2.4s ease-out forwards',
          }}
        />
        <style>{`@keyframes progress { from{width:0} to{width:100%} }`}</style>
      </div>

      {/* Tagline */}
      <p className="absolute bottom-8 text-xs font-medium tracking-widest uppercase"
        style={{ color:'rgba(255,255,255,0.2)' }}>
        Powered by Gemini AI
      </p>
    </div>
  );
}
