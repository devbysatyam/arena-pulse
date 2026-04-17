'use client';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { SECTIONS, GATES, AMENITIES, AMENITY_COLORS, AMENITY_ICONS, getCrowdColor, getCrowdLabel, USER_SEAT, WAYPOINTS } from '@/lib/stadium-data';
import { routeBetween, formatETA, pathToSVGPoints } from '@/lib/pathfinding';

type Filter = 'all' | 'food' | 'wc' | 'firstaid' | 'exit';

const CX = 200, CY = 170;
// Ellipse helper
function ep(rx: number, ry: number, deg: number) {
  const r = ((deg - 90) * Math.PI) / 180;
  return { x: CX + rx * Math.cos(r), y: CY + ry * Math.sin(r) };
}
// Section arc path (SVG)
function sectionArc(startDeg: number, endDeg: number, outerRx: number, outerRy: number, innerRx: number, innerRy: number) {
  const s = ep(outerRx, outerRy, startDeg), e = ep(outerRx, outerRy, endDeg);
  const si = ep(innerRx, innerRy, startDeg), ei = ep(innerRx, innerRy, endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${outerRx},${outerRy} 0 ${large} 1 ${e.x},${e.y} L${ei.x},${ei.y} A${innerRx},${innerRy} 0 ${large} 0 ${si.x},${si.y} Z`;
}

export default function Map2DScreen() {
  const { navigate, setNavRoute } = useAppStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [routePath, setRoutePath] = useState<{ x:number;y:number }[]>([]);
  const [routeETA, setRouteETA] = useState<string>('');
  const [navDest, setNavDest] = useState<string>('');

  const filters: { id:Filter; icon:string; label:string }[] = [
    { id:'all',      icon:'layers',    label:'All' },
    { id:'food',     icon:'fastfood',  label:'Food' },
    { id:'wc',       icon:'wc',        label:'WC' },
    { id:'firstaid', icon:'favorite',  label:'Aid' },
    { id:'exit',     icon:'exit_to_app',label:'Exits' },
  ];

  const visibleAmenities = AMENITIES.filter(a =>
    filter === 'all' ? a.type !== 'info' : a.type === filter
  );

  const handleAmenityNav = useCallback((amenityId: string, label: string) => {
    const result = routeBetween(USER_SEAT.entryNode, amenityId);
    if (result.found) {
      setRoutePath(result.coords);
      setRouteETA(formatETA(result.totalWeight));
      setNavDest(label);
      setNavRoute(USER_SEAT.entryNode, amenityId);
    }
  }, [setNavRoute]);

  const handleSectionTap = (secId: string) => {
    setSelectedSection(secId === selectedSection ? null : secId);
    // Route from user location to section
    const result = routeBetween(USER_SEAT.entryNode, secId);
    if (result.found) {
      setRoutePath(result.coords);
      setRouteETA(formatETA(result.totalWeight));
      setNavDest(`Section ${secId}`);
    }
  };

  const SECTIONS_ANGLES = [
    { id:'A', start:-45,  end:45  },
    { id:'B', start:45,   end:90  },
    { id:'C', start:90,   end:135 },
    { id:'D', start:135,  end:180 },
    { id:'E', start:180,  end:225 },
    { id:'F', start:225,  end:270 },
    { id:'G', start:270,  end:315 },
    { id:'H', start:315,  end:360 },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0b14]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-14 pb-3 z-20">
        <button onClick={() => navigate('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)' }} aria-label="Back">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-headline font-bold text-lg text-white">Stadium Map</h1>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.45)' }}>Wembley · Level 1 · Tap section or amenity</p>
        </div>
        <button onClick={() => navigate('stadium3d')}
          className="px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background:'rgba(124,95,240,0.2)', color:'#a78bfa', border:'1px solid rgba(124,95,240,0.3)' }}>
          3D View
        </button>
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-2 z-20">
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all"
            style={filter===f.id
              ? { background:'rgba(0,212,255,0.2)', color:'#00d4ff', border:'1px solid rgba(0,212,255,0.4)' }
              : { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Map SVG */}
      <div className="flex-1 flex items-center justify-center px-2 py-2">
        <div className="w-full relative" style={{ maxWidth: 420 }}>
          <svg viewBox="0 0 400 340" className="w-full" style={{ filter:'drop-shadow(0 0 40px rgba(124,95,240,0.15))' }}
            role="img" aria-label="Stadium floor plan with sections and amenities">
            <defs>
              <radialGradient id="pitchGrad" cx="50%" cy="50%">
                <stop offset="0%"   stopColor="#1a3d1a"/>
                <stop offset="100%" stopColor="#0f2310"/>
              </radialGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {/* Outer concourse ring */}
            <ellipse cx={CX} cy={CY} rx={162} ry={135} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

            {/* Section arcs (colored by crowd density) */}
            {SECTIONS_ANGLES.map(s => {
              const sec = SECTIONS.find(x => x.id === s.id);
              const color = sec ? getCrowdColor(sec.occupancy) : '#fff';
              const isSelected = selectedSection === s.id;
              const isUserSec = USER_SEAT.section === s.id;
              return (
                <path key={s.id}
                  d={sectionArc(s.start, s.end, 155, 128, 108, 88)}
                  fill={isSelected ? `${color}50` : `${color}22`}
                  stroke={isUserSec ? '#00d4ff' : isSelected ? color : `${color}60`}
                  strokeWidth={isSelected||isUserSec ? 2 : 1}
                  className="cursor-pointer transition-all"
                  onClick={() => handleSectionTap(s.id)}
                  aria-label={`Section ${s.id}: ${sec? getCrowdLabel(sec.occupancy) :''} ${sec?.occupancy??''}% occupied`}
                />
              );
            })}

            {/* Inner concourse ring */}
            <ellipse cx={CX} cy={CY} rx={108} ry={88} fill="rgba(10,11,20,0.8)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>

            {/* Pitch */}
            <rect x={112} y={82} width={176} height={136} rx={8} fill="url(#pitchGrad)" stroke="rgba(0,255,100,0.15)" strokeWidth="1"/>
            {/* Pitch markings */}
            <ellipse cx={CX} cy={CY} rx={36} ry={28} fill="none" stroke="rgba(0,200,80,0.2)" strokeWidth="1"/>
            <line x1={CX} y1={82} x2={CX} y2={218} stroke="rgba(0,200,80,0.2)" strokeWidth="1"/>
            <circle cx={CX} cy={CY} r={3} fill="rgba(0,200,80,0.3)"/>
            {/* NO ROUTE text */}
            <text x={CX} y={CY+4} textAnchor="middle" fontSize={7} fill="rgba(0,200,80,0.25)" fontFamily="sans-serif">NO-GO ZONE</text>

            {/* ROUTE PATH (A* along concourse) */}
            {routePath.length > 1 && (
              <>
                <path
                  d={pathToSVGPoints(routePath)}
                  fill="none"
                  stroke="rgba(0,212,255,0.2)"
                  strokeWidth={10}
                  strokeLinecap="round"
                />
                <path
                  d={pathToSVGPoints(routePath)}
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="1, 10"
                  className="animate-dash"
                  filter="url(#glow)"
                />
              </>
            )}

            {/* Gates */}
            {GATES.filter(g => filter === 'all' || filter === 'exit').map(g => (
              <g key={g.id}>
                <rect x={g.x-14} y={g.y-8} width={28} height={16} rx={4}
                  fill={g.open ? 'rgba(0,255,157,0.2)' : 'rgba(255,77,106,0.2)'}
                  stroke={g.open ? '#00ff9d' : '#ff4d6a'} strokeWidth={1}/>
                <text x={g.x} y={g.y+4} textAnchor="middle" fontSize={7}
                  fill={g.open ? '#00ff9d' : '#ff4d6a'} fontFamily="sans-serif" fontWeight="bold">{g.label.replace('Gate ','G')}</text>
              </g>
            ))}

            {/* Amenity markers */}
            {visibleAmenities.map(a => {
              const color = AMENITY_COLORS[a.type];
              return (
                <g key={a.id} className="cursor-pointer" onClick={() => handleAmenityNav(a.id, a.label)}>
                  <circle cx={a.x} cy={a.y} r={7} fill={`${color}30`} stroke={color} strokeWidth={1.5}/>
                  <text x={a.x} y={a.y+4} textAnchor="middle" fontSize={8} fill={color} aria-hidden="true">
                    {a.type === 'food'?'🍔': a.type==='wc'?'🚻': a.type==='firstaid'?'+': a.type==='atm'?'$':'ℹ'}
                  </text>
                </g>
              );
            })}

            {/* TARGET SEAT MARKER */}
            {(() => {
               const node = WAYPOINTS.find(w => w.id === USER_SEAT.entryNode);
               if (!node) return null;
               return (
                 <g>
                    <circle cx={node.x} cy={node.y} r={12} fill="rgba(255,184,0,0.2)" className="animate-pulse">
                        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <path d={`M${node.x-6},${node.y-12} L${node.x+6},${node.y-12} L${node.x},${node.y} Z`} fill="#ffb800" />
                    <text x={node.x} y={node.y - 15} textAnchor="middle" fontSize={8} fill="#ffb800" fontWeight="black">SEAT {USER_SEAT.block}</text>
                 </g>
               );
            })()}

            {/* YOUR LOCATION (Simulated at Gate or On Path) */}
            <g filter="url(#glow)">
              <circle cx={200} cy={310} r={14} fill="rgba(0,212,255,0.1)">
                <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={200} cy={310} r={8} fill="#00d4ff" stroke="white" strokeWidth={2}/>
              <text x={200} y={328} textAnchor="middle" fontSize={9} fill="white" fontWeight="black" className="uppercase tracking-tighter">You</text>
            </g>

            {/* Section labels */}
            {SECTIONS_ANGLES.map(s => {
              const mid = (s.start + s.end) / 2;
              const p = ep(130, 108, mid);
              const sec = SECTIONS.find(x => x.id === s.id);
              return (
                <text key={'lbl_'+s.id} x={p.x} y={p.y+4} textAnchor="middle"
                  fontSize={9} fill={sec ? getCrowdColor(sec.occupancy) : 'white'}
                  fontFamily="sans-serif" fontWeight="bold" opacity={0.9}>
                  {s.id}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Route info card */}
      {routePath.length > 0 && (
        <div className="mx-5 mb-2 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up"
          style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)' }}>
          <span className="material-symbols-outlined text-cyan-400" style={{ fontVariationSettings:"'FILL' 1" }}>navigation</span>
          <div className="flex-1">
            <p className="font-bold text-sm text-white">Route to {navDest}</p>
            <p className="text-xs" style={{ color:'rgba(255,255,255,0.6)' }}>~{routeETA} via concourse · Concourse-only route</p>
          </div>
          <button onClick={() => navigate('ar-nav')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background:'rgba(0,212,255,0.2)', color:'#00d4ff', border:'1px solid rgba(0,212,255,0.3)' }}>
            AR Nav
          </button>
          <button onClick={() => { setRoutePath([]); setNavDest(''); }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background:'rgba(255,255,255,0.08)' }} aria-label="Clear route">
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mx-5 mb-28 rounded-2xl px-4 py-3" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-wrap gap-3">
          {[['#00ff9d','Clear <36%'],['#ffb800','Moderate'],['#ff8c00','Busy'],['#ff4d6a','Peak >81%'],['#00d4ff','Your route']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background:c }} />
              <span className="text-[10px] text-white/50">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
