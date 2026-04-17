'use client';
import { useState, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/app-store';
import { STADIUMS } from '@/lib/stadiums-data';
import { SECTIONS } from '@/lib/stadium-data';
import {
  broadcastNotification,
  updateCrowdSection,
  setCrowdData,
  reportIncident,
} from '@/lib/firestore-service';
import {
  useFirestoreSubscription,
  useFirestoreCollectionSubscription,
} from '@/hooks/useFirestore';
import {
  subscribeToCrowd,
  subscribeToNotifications,
  subscribeToIncidents,
  type FSNotification,
  type CrowdData,
  type Incident,
} from '@/lib/firestore-service';
import { validateAdminBroadcast, type BroadcastValidationResult } from '@/lib/validators';
import { trackAdminBroadcast } from '@/lib/analytics';

type Tab = 'dashboard' | 'notifications' | 'crowd' | 'incidents';

const priorityColor = { info: '#00d4ff', warning: '#ffb800', critical: '#ff4d6a' };
const priorityIcon  = { info: 'info', warning: 'warning', critical: 'emergency' };

export default function AdminScreen() {
  const { navigate, back, setAdmin, setAdminUser, selectedStadiumId, adminUser } = useAppStore();
  const stadiumId = selectedStadiumId ?? 'nm-stadium';

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ── Live Firestore subscriptions ──────────────────────────────────────────
  const { data: crowdData, loading: crowdLoading } = useFirestoreSubscription<CrowdData>(
    (update) => subscribeToCrowd(stadiumId, update),
    [stadiumId]
  );

  const { items: notifications, loading: notifsLoading } = useFirestoreCollectionSubscription<FSNotification>(
    subscribeToNotifications,
    []
  );

  const { items: incidents, loading: incLoading } = useFirestoreCollectionSubscription<Incident>(
    (update) => subscribeToIncidents(stadiumId, update),
    [stadiumId]
  );

  // ── Notification composer ─────────────────────────────────────────────────
  const [notifTitle, setNotifTitle]       = useState('');
  const [notifBody, setNotifBody]         = useState('');
  const [notifPriority, setNotifPriority] = useState<FSNotification['priority']>('info');
  const [notifTarget, setNotifTarget]     = useState<string>('all');
  const [notifSending, setNotifSending]   = useState(false);
  const [notifSent, setNotifSent]         = useState(false);
  const [notifError, setNotifError]       = useState('');

  const handleSendNotification = useCallback(async () => {
    setNotifError('');
    const validation = validateAdminBroadcast({
      title: notifTitle,
      body: notifBody,
      priority: notifPriority,
    });
    if (!validation.valid) { setNotifError(validation.error ?? 'Invalid fields'); return; }

    setNotifSending(true);
    const s = (validation as BroadcastValidationResult).sanitized!;
    try {
      await broadcastNotification({
        title:           s.title,
        body:            s.body,
        priority:        notifPriority,
        targetStadiumId: notifTarget === 'all' ? null : notifTarget,
      });
      trackAdminBroadcast(notifPriority, notifTarget === 'all' ? null : notifTarget);

      setNotifTitle('');
      setNotifBody('');
      setNotifSent(true);
      setTimeout(() => setNotifSent(false), 2500);
    } catch (err: any) {
      setNotifError(err.message ?? 'Failed to send broadcast');
    } finally {
      setNotifSending(false);
    }
  }, [notifTitle, notifBody, notifPriority, notifTarget]);

  // ── Crowd editor ──────────────────────────────────────────────────────────
  const [crowdEdits, setCrowdEdits]     = useState<Record<string, number>>({});
  const [crowdSaving, setCrowdSaving]   = useState(false);
  const [crowdSaved, setCrowdSaved]     = useState(false);

  const currentOccupancy = (sectionId: string): number => {
    return crowdEdits[sectionId] ?? crowdData?.sections[sectionId] ?? SECTIONS.find(s => s.id === sectionId)?.occupancy ?? 50;
  };

  const handleCrowdSave = async () => {
    setCrowdSaving(true);
    try {
      // Write each edited section individually for real-time fan updates
      await Promise.all(
        Object.entries(crowdEdits).map(([sid, occ]) => updateCrowdSection(stadiumId, sid, occ))
      );
      setCrowdEdits({});
      setCrowdSaved(true);
      setTimeout(() => setCrowdSaved(false), 2000);
    } finally {
      setCrowdSaving(false);
    }
  };

  // ── Incident composer ─────────────────────────────────────────────────────
  const [incTitle, setIncTitle]     = useState('');
  const [incZone, setIncZone]       = useState('');
  const [incSeverity, setIncSeverity] = useState<Incident['severity']>('low');
  const [incSending, setIncSending] = useState(false);
  const [incSent, setIncSent]       = useState(false);

  const handleReportIncident = async () => {
    if (!incTitle.trim() || !incZone.trim()) return;
    setIncSending(true);
    try {
      await reportIncident(stadiumId, {
        title:      incTitle.trim(),
        zone:       incZone.trim(),
        severity:   incSeverity,
        reportedBy: adminUser?.email ?? 'admin',
      });
      setIncTitle('');
      setIncZone('');
      setIncSent(true);
      setTimeout(() => setIncSent(false), 2000);
    } finally {
      setIncSending(false);
    }
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    if (auth) await signOut(auth).catch(() => {});
    setAdmin(false);
    setAdminUser(null);
    navigate('welcome');
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard',      label: 'Board',    icon: 'dashboard'    },
    { id: 'notifications',  label: 'Notify',   icon: 'campaign'     },
    { id: 'crowd',          label: 'Crowd',    icon: 'sensors'      },
    { id: 'incidents',      label: 'Alerts',   icon: 'warning'      },
  ];

  const currentStadium = STADIUMS.find(s => s.id === stadiumId);

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      {/* Header */}
      <header className="px-5 pt-14 pb-3 flex items-center justify-between border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,77,106,0.15)', border: '1px solid rgba(255,77,106,0.3)' }}>
            <span className="material-symbols-outlined text-[#ff4d6a]">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="font-headline font-black text-lg text-white leading-tight">Arena Ops</h1>
            <p className="text-[9px] font-black text-[#ff4d6a] uppercase tracking-widest">
              {adminUser?.email ?? 'Admin'} · {currentStadium?.name ?? stadiumId}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out of admin panel"
          className="flex items-center gap-2 px-3 h-9 rounded-2xl transition-all hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-base">logout</span>
          Sign out
        </button>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-white/5 bg-black/20 px-2" role="tablist" aria-label="Admin sections">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all relative
              ${activeTab === t.id ? 'text-[#ff4d6a]' : 'text-white/30 hover:text-white/60'}`}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-wide">{t.label}</span>
            {activeTab === t.id && <div className="absolute bottom-0 h-0.5 w-8 bg-[#ff4d6a] rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-5">

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Live Overview</h2>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sections', value: SECTIONS.length, icon: 'grid_view', color: '#00d4ff' },
                { label: 'Broadcasts', value: notifications.length, icon: 'campaign', color: '#ff9b4e' },
                { label: 'Incidents', value: incidents.length, icon: 'warning', color: '#ff4d6a' },
                { label: 'Stadiums', value: STADIUMS.length, icon: 'stadium', color: '#7c5ff0' },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  <p className="font-headline font-black text-2xl text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent notifications */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Recent Broadcasts</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
                  <span className="text-[10px] text-[#00ff9d] font-bold">LIVE</span>
                </div>
              </div>
              {notifsLoading ? (
                <div className="px-4 py-8 text-center text-white/30 text-sm">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-white/30 text-sm">No broadcasts yet</div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-start gap-3">
                    <span className="material-symbols-outlined text-sm mt-0.5" style={{ color: priorityColor[n.priority], fontVariationSettings: "'FILL' 1" }}>
                      {priorityIcon[n.priority]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{n.title}</p>
                      <p className="text-xs text-white/40 truncate">{n.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Notification Composer ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Broadcast to Fans</h2>

            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Priority */}
              <div className="flex gap-2">
                {(['info', 'warning', 'critical'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNotifPriority(p)}
                    aria-pressed={notifPriority === p}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all"
                    style={{
                      background: notifPriority === p ? `${priorityColor[p]}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${notifPriority === p ? priorityColor[p] : 'rgba(255,255,255,0.08)'}`,
                      color: notifPriority === p ? priorityColor[p] : 'rgba(255,255,255,0.4)',
                    }}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Target */}
              <div>
                <label htmlFor="notif-target" className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1.5">Target</label>
                <select
                  id="notif-target"
                  value={notifTarget}
                  onChange={e => setNotifTarget(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="all">All Stadiums</option>
                  {STADIUMS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="notif-title" className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1.5">
                  Title ({notifTitle.length}/60)
                </label>
                <input
                  id="notif-title"
                  type="text"
                  placeholder="Brief headline…"
                  value={notifTitle}
                  maxLength={60}
                  onChange={e => { setNotifTitle(e.target.value); setNotifError(''); }}
                  className="w-full h-11 rounded-xl px-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="notif-body" className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1.5">
                  Message ({notifBody.length}/200)
                </label>
                <textarea
                  id="notif-body"
                  placeholder="Detailed message for fans…"
                  value={notifBody}
                  maxLength={200}
                  rows={3}
                  onChange={e => { setNotifBody(e.target.value); setNotifError(''); }}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {notifError && (
                <p role="alert" className="text-xs text-[#ff4d6a] font-bold">{notifError}</p>
              )}

              <button
                onClick={handleSendNotification}
                disabled={notifSending || !notifTitle.trim() || !notifBody.trim()}
                aria-busy={notifSending}
                className="w-full h-12 rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                style={{ background: notifSent ? '#00ff9d' : 'linear-gradient(135deg, #ff9b4e, #ff4d6a)', color: notifSent ? '#0a0b14' : 'white' }}>
                {notifSending
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : notifSent
                  ? <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> SENT</>
                  : <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span> BROADCAST</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Crowd Editor ── */}
        {activeTab === 'crowd' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Live Crowd Control</h2>
              {crowdLoading && <div className="w-3 h-3 rounded-full border border-[#00d4ff] border-t-transparent animate-spin" />}
            </div>

            <div className="rounded-2xl p-4 space-y-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {SECTIONS.map(sec => {
                const occ = currentOccupancy(sec.id);
                const hue = Math.round(120 - (occ / 100) * 120);
                const color = `hsl(${hue}, 85%, 55%)`;
                return (
                  <div key={sec.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">{sec.label}</span>
                      <span className="text-sm font-black font-mono" style={{ color }}>{occ}%</span>
                    </div>
                    <input
                      type="range"
                      min={0} max={100}
                      value={occ}
                      aria-label={`${sec.label} occupancy: ${occ}%`}
                      onChange={e => setCrowdEdits(prev => ({ ...prev, [sec.id]: Number(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: color }} />
                  </div>
                );
              })}
            </div>

            {Object.keys(crowdEdits).length > 0 && (
              <button
                onClick={handleCrowdSave}
                disabled={crowdSaving}
                aria-busy={crowdSaving}
                className="w-full h-12 rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                style={{ background: crowdSaved ? '#00ff9d' : 'linear-gradient(135deg, #00d4ff, #7c5ff0)', color: crowdSaved ? '#0a0b14' : 'white' }}>
                {crowdSaving
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : crowdSaved
                  ? <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> SAVED</>
                  : <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span> PUSH TO FANS ({Object.keys(crowdEdits).length} changes)</>
                }
              </button>
            )}
          </div>
        )}

        {/* ── Incidents ── */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Report Incident</h2>

            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(s => (
                  <button key={s} onClick={() => setIncSeverity(s)}
                    aria-pressed={incSeverity === s}
                    className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                    style={{
                      background: incSeverity === s ? (s === 'critical' ? '#ff4d6a20' : s === 'high' ? '#ff9b4e20' : '#ffffff10') : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${incSeverity === s ? (s === 'critical' ? '#ff4d6a' : s === 'high' ? '#ff9b4e' : '#fff5') : 'rgba(255,255,255,0.08)'}`,
                      color: incSeverity === s ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}>{s}</button>
                ))}
              </div>

              <div className="space-y-1">
                <label htmlFor="inc-title" className="text-[10px] text-white/30 font-bold uppercase ml-1">Incident Title</label>
                <input id="inc-title" type="text" placeholder="Brief description…" value={incTitle} maxLength={80}
                  onChange={e => setIncTitle(e.target.value)}
                  className="w-full h-11 rounded-xl px-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div className="space-y-1">
                <label htmlFor="inc-zone" className="text-[10px] text-white/30 font-bold uppercase ml-1">Zone / Area</label>
                <input id="inc-zone" type="text" placeholder="e.g. Gate 4, East Stand…" value={incZone} maxLength={40}
                  onChange={e => setIncZone(e.target.value)}
                  className="w-full h-11 rounded-xl px-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>


              <button onClick={handleReportIncident} disabled={incSending || !incTitle.trim() || !incZone.trim()}
                aria-busy={incSending}
                className="w-full h-12 rounded-xl font-headline font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                style={{ background: incSent ? '#00ff9d' : 'linear-gradient(135deg, #ff9b4e, #ff4d6a)', color: incSent ? '#0a0b14' : 'white' }}>
                {incSending ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : incSent ? <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> REPORTED</>
                  : <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>report</span> REPORT INCIDENT</>
                }
              </button>
            </div>

            {/* Active incidents */}
            {!incLoading && incidents.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Active Incidents ({incidents.length})</p>
                {incidents.map(inc => (
                  <div key={inc.id} className="rounded-2xl px-4 py-3 flex items-start gap-3"
                    style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.2)' }}>
                    <span className="material-symbols-outlined text-[#ff4d6a] text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <div>
                      <p className="text-sm font-bold text-white">{inc.title}</p>
                      <p className="text-xs text-white/40">Zone: {inc.zone} · {inc.severity.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
