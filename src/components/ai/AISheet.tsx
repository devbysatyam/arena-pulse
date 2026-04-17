'use client';
import { useAppStore } from '@/store/app-store';
import { useGemini } from '@/lib/gemini';
import { validateAIMessage } from '@/lib/validators';
import { useRef, useEffect, useState, memo } from 'react';


const TypewriterText = memo(({ text, isLast }: { text: string; isLast: boolean }) => {
  const [displayed, setDisplayed] = useState(isLast ? '' : text);
  
  useEffect(() => {
    if (!isLast) {
      setDisplayed(text);
      return;
    }
    
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text, isLast]);

  return <span>{displayed}</span>;
});

export default function AISheet() {
  const { showAISheet, aiSheetClose, aiMessages, addAiMessage } = useAppStore();
  const { sendMessage, loading } = useGemini();
  const [input, setInput] = useState('');
  const [isVoice, setIsVoice] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAISheet) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [showAISheet, aiMessages.length]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [aiMessages, loading]);

  const handleSend = async () => {
    const validation = validateAIMessage(input);
    if (!validation.valid || loading || cooldown) return;
    const text = validation.sanitized!; // Safe: validated above
    setInput('');
    setCooldown(true);
    addAiMessage({ role: 'user', text });
    await sendMessage(text, aiMessages, (resp: string) => {
      addAiMessage({ role: 'ai', text: resp });
    });
    // 2-second cooldown between requests to respect API rate limits
    setTimeout(() => setCooldown(false), 2000);
  };

  const QUICK = ['🪑 My seat?', '🍔 Food nearby', '🚻 WC location', '🚪 Best exit', '⚽ Match score'];

  if (!showAISheet) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={aiSheetClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-sheet-up flex flex-col"
        style={{
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, rgba(14,15,30,0.98) 0%, rgba(10,11,20,0.99) 100%)',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        role="dialog"
        aria-label="Arena AI Assistant"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1"><div className="drag-handle" /></div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c5ff0, #00d4ff)', boxShadow: '0 0 16px rgba(124,95,240,0.5)' }}
          >
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white font-headline">Arena AI</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>Online · Powered by Gemini</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsVoice(!isVoice)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: isVoice ? 'rgba(124,95,240,0.3)' : 'rgba(255,255,255,0.08)' }}
              aria-label="Voice mode"
            >
              <span className="material-symbols-outlined text-white text-sm">{isVoice ? 'mic' : 'mic_off'}</span>
            </button>
            <button
              onClick={aiSheetClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="Close AI assistant"
            >
              <span className="material-symbols-outlined text-white text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {aiMessages.map((m: { role: string; text: string }, i: number) => (
            <div key={i} className={`flex gap-3 mb-4 animate-fade-in ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {m.role === 'ai' && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c5ff0, #00d4ff)' }}>
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all"
                style={m.role === 'ai'
                  ? { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'#f1f5f9', borderRadius:'4px 20px 20px 20px' }
                  : { background:'linear-gradient(135deg,#7c5ff0,#5b42c9)', color:'white', borderRadius:'20px 4px 20px 20px', boxShadow:'0 4px 12px rgba(124,95,240,0.3)' }}
              >
                <TypewriterText text={m.text} isLast={i === aiMessages.length - 1 && m.role === 'ai'} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#7c5ff0,#00d4ff)' }}>
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings:"'FILL' 1" }}>smart_toy</span>
              </div>
              <div className="px-5 py-3 rounded-2xl flex items-center gap-2"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'4px 20px 20px 20px' }}>
                <div className="flex gap-1">
                   {[0,0.2,0.4].map((d,i) => (
                     <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                       style={{ animationDelay:`${d}s` }} />
                   ))}
                </div>
                <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest ml-1">Thinking</span>
              </div>
            </div>
          )}
          <div ref={endRef} className="h-4" />
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1 no-scrollbar">
          {QUICK.map(q => (
            <button key={q}
              onClick={() => { setInput(q.slice(2)); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)' }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 pb-4 pt-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
              aria-label="Message Arena AI"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || cooldown}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: input.trim() && !cooldown ? 'linear-gradient(135deg,#7c5ff0,#5b42c9)' : 'rgba(255,255,255,0.06)',
              boxShadow: input.trim() && !cooldown ? '0 0 20px rgba(124,95,240,0.5)' : 'none',
            }}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings:"'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </>
  );
}
