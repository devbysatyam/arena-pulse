'use client';
import { useAppStore } from '@/store/app-store';
import { useState } from 'react';

export default function AIBubble() {
  const { aiSheetOpen, aiMessages } = useAppStore();
  const [pulsed, setPulsed] = useState(false);
  const unread = aiMessages.filter(m => m.role === 'ai').length > 1;

  return (
    <button
      id="ai-bubble"
      onClick={() => { aiSheetOpen(); setPulsed(false); }}
      aria-label="Open Arena AI assistant"
      className="fixed right-5 z-40 flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
      style={{
        bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        width: 56, height: 56,
        background: 'linear-gradient(135deg, #7c5ff0 0%, #00d4ff 100%)',
        boxShadow: '0 0 0 0 rgba(124,95,240,0.4), 0 8px 24px rgba(0,0,0,0.4)',
        animation: 'ai-pulse 3s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes ai-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,95,240,0.4), 0 8px 24px rgba(0,0,0,0.4); }
          50%      { box-shadow: 0 0 0 10px rgba(124,95,240,0), 0 8px 24px rgba(0,0,0,0.4); }
        }
      `}</style>
      <span
        className="material-symbols-outlined text-white"
        style={{ fontSize: 26, fontVariationSettings:"'FILL' 1" }}
        aria-hidden="true"
      >
        smart_toy
      </span>
      {unread && (
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
          style={{ background: '#ff4d6a', boxShadow: '0 0 8px rgba(255,77,106,0.6)' }}
        >
          1
        </span>
      )}
    </button>
  );
}
