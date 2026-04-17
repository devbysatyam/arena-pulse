'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { routeBetween, formatETA } from '@/lib/pathfinding';
import { USER_SEAT, GATES } from '@/lib/stadium-data';
import { createProceduralStadium } from '@/lib/three-stadium-builder';
import * as THREE from 'three';

interface ARArrow { label: string; deg: number; dist: string; color: string; }

const WAYPOINTS_AR: ARArrow[] = [
  { label:'Section B14',   deg:-15,  dist:'45m',  color:'#00d4ff' },
  { label:'WC Block East', deg:35,   dist:'28m',  color:'#378add' },
  { label:'Stall B3 Food', deg:-40,  dist:'62m',  color:'#ffb800' },
  { label:'Exit Gate C4',  deg:20,   dist:'88m',  color:'#00ff9d' },
];

export function ARNavScreen() {
  const { navigate, navTo, navFrom } = useAppStore();
  const [heading, setHeading] = useState(0);
  const [permError, setPermError] = useState(false);
  const [step, setStep] = useState(0);
  const [distance, setDistance] = useState(45);
  
  // AR Control State
  const [isManual, setIsManual] = useState(false);
  const [yaw, setYaw] = useState(0); // Manual Left/Right
  const [pitch, setPitch] = useState(0); // Manual Up/Down
  const [showOverlay, setShowOverlay] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const gyroRef = useRef({ alpha: 0, beta: 0 });
  const eulerRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0, 'YXZ'));
  
  const routeResult = routeBetween(USER_SEAT.gate, USER_SEAT.entryNode);

  const steps = [
    '↑  Follow the EAST CONCOURSE ahead (avoid pitch area)',
    '↗  Take the concourse ramp, keep GREEN signs on left',
    '→  At Section B junction, turn right up the aisle',
    '✓  Block B14 — Row 22 on your right',
  ];

  const directionalCues = [
    { label: 'Go Straight', icon: 'north' },
    { label: 'Turn Slight Right', icon: 'north_east' },
    { label: 'Turn Hard Right', icon: 'east' },
    { label: 'Destination Arrived', icon: 'check_circle' }
  ];

  // Request device orientation and camera
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null) {
        gyroRef.current.alpha = (e.alpha * Math.PI) / 180;
        gyroRef.current.beta = ((e.beta - 90) * Math.PI) / 180;
        setHeading(e.alpha);
      }
    };

    // Camera Init
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error('Camera access denied:', err);
          setPermError(true);
        });
    } else {
      setPermError(true);
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((p: string) => p === 'granted'
          ? window.addEventListener('deviceorientation', handler)
          : setPermError(true))
        .catch(() => setPermError(true));
    } else {
      window.addEventListener('deviceorientation', handler);
    }

    // 3D Scene Initialization
    if (canvasRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 5, 0); 

      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // CRITICAL: Disable shader error checking to prevent validation lag/errors on mobile
      renderer.debug.checkShaderErrors = false;

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(10, 20, 10);
      scene.add(dirLight);

      // Procedural Stadium (Lighter, better for AR)
      const stadium = createProceduralStadium(routeResult.found ? routeResult.coords : []);
      stadium.scale.setScalar(0.015);
      stadium.position.set(0, -10, -50); 
      scene.add(stadium);

      // Animate path dot
      let pathDot: THREE.Mesh | null = null;
      let points: THREE.Vector3[] = [];
      if (routeResult.found && routeResult.coords.length > 0) {
        for (const p of routeResult.coords) {
          // Synchronize math with Stadium3DScreen (0.45) * AR Scale (0.015)
          const xAR = (p.x - 200) * 0.45 * 0.015;
          const zAR = (p.y - 170) * 0.45 * 0.015 - 50; 
          // Lift the path dots to float above the AR stadium floor
          points.push(new THREE.Vector3(xAR, -9.0, zAR)); 
        }
        
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0x00d4ff, 
            transparent: true, 
            opacity: 0.8,
            linewidth: 2 // Note: simple lines don't support width in standard WebGL, but we use dots too
        });
        const routeLine = new THREE.Line(lineGeo, lineMat);
        scene.add(routeLine);
        
        const dotGeo = new THREE.SphereGeometry(0.5, 12, 12);
        const dotMat = new THREE.MeshPhongMaterial({ 
          color: 0xffffff, 
          emissive: 0x00d4ff, 
          emissiveIntensity: 1.0 
        });
        pathDot = new THREE.Mesh(dotGeo, dotMat);
        scene.add(pathDot);
      }

      const animate = () => {
        animRef.current = requestAnimationFrame(animate);
        
        stadium.visible = showOverlay;

        const targetEuler = eulerRef.current;
        if (isManual) {
          targetEuler.y = (yaw * Math.PI) / 180;
          targetEuler.x = (pitch * Math.PI) / 180;
        } else {
          targetEuler.y = gyroRef.current.alpha;
          targetEuler.x = gyroRef.current.beta;
        }

        camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(targetEuler), 0.15);

        if (pathDot && points.length > 0) {
          const time = Date.now() * 0.001;
          const progress = (time % 4) / 4; // Faster pulse
          const idx = progress * (points.length - 1);
          const lower = Math.floor(idx);
          const upper = Math.ceil(idx);
          if (points[lower] && points[upper]) {
              pathDot.position.lerpVectors(points[lower], points[upper], idx - lower);
          }
        }

        renderer.render(scene, camera);
      };
      animate();
    }

    const timer = setInterval(() => {
      setDistance(d => Math.max(0, d - 1));
    }, 800);

    return () => {
      window.removeEventListener('deviceorientation', handler);
      clearInterval(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [isManual, yaw, pitch, showOverlay]);

  useEffect(() => {
    if (distance < 36) setStep(1);
    if (distance < 22) setStep(2);
    if (distance < 8)  setStep(3);
  }, [distance]);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0a0b14]" role="main" aria-label="AR Navigation">
      {/* Camera/AR background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.6)' }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full pointer-events-none" />

      {/* Control Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Top Control Bar */}
        <header className="absolute top-0 left-0 right-0 p-5 pt-14 flex items-center justify-between pointer-events-auto">
          <button onClick={() => navigate('map2d')}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/60 border border-white/10 backdrop-blur-xl group active:scale-95 transition-all">
            <span className="material-symbols-outlined text-white group-hover:text-cyan-400">close</span>
          </button>
          
          <div className="flex gap-2">
            <button onClick={() => setIsManual(!isManual)}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 font-bold text-xs transition-all border ${isManual ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'bg-black/60 border-white/10 text-white'}`}>
              <span className="material-symbols-outlined text-lg">{isManual ? 'vibration' : 'screen_rotation'}</span>
              {isManual ? 'MANUAL' : 'GYRO'}
            </button>
            <button onClick={() => setShowOverlay(!showOverlay)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${showOverlay ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'bg-black/60 border-white/10 text-white'}`}>
              <span className="material-symbols-outlined text-lg">layers</span>
            </button>
          </div>
        </header>

        {/* Dynamic Nav Action Button (Immersive Cue) */}
        <div className="absolute top-32 left-0 right-0 flex justify-center p-5 pointer-events-auto">
          <button className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-cyan-500/90 text-white shadow-[0_0_30px_rgba(0,212,255,0.5)] animate-bounce border-t border-white/30 backdrop-blur-md">
             <span className="material-symbols-outlined text-3xl">{directionalCues[step].icon}</span>
             <div className="text-left">
               <p className="text-[10px] uppercase font-black tracking-widest opacity-70">CURRENT ACTION</p>
               <p className="text-lg font-headline font-black leading-tight">{directionalCues[step].label}</p>
             </div>
          </button>
        </div>

         {/* Manual Controls Sliders */}
         {isManual && (
           <div className="absolute right-5 bottom-48 flex flex-col gap-6 pointer-events-auto bg-black/60 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-white/40 text-sm">unfold_more</span>
                 <input 
                   type="range" min="-45" max="45" value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                   className="h-32 accent-cyan-400" style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
                 />
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">Tilt</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex flex-col items-center gap-3">
                <input 
                  type="range" min="-180" max="180" value={yaw} onChange={(e) => setYaw(Number(e.target.value))}
                  className="w-10 accent-cyan-400"
                />
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">Yaw</span>
              </div>
           </div>
         )}

         {/* STEERING INDICATORS (Immersive Cues) */}
         <div className="absolute inset-0 flex items-center justify-between px-8 opacity-40">
            <div className={`w-16 h-16 rounded-full border border-white/20 flex items-center justify-center transition-all ${step === 2 ? 'bg-[#ffb800] border-[#ffb800] scale-125 opacity-100 shadow-[0_0_20px_rgba(255,184,0,0.5)]' : ''}`}>
               <span className="material-symbols-outlined text-white text-3xl">chevron_left</span>
            </div>
            <div className={`w-16 h-16 rounded-full border border-white/20 flex items-center justify-center transition-all ${step === 1 ? 'bg-cyan-500 border-cyan-400 scale-125 opacity-100 shadow-[0_0_20px_rgba(0,212,255,0.5)]' : ''}`}>
               <span className="material-symbols-outlined text-white text-3xl">chevron_right</span>
            </div>
         </div>

         {/* Central Focus HUD */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />
            <div className="w-12 h-12 border border-white/10 rounded-full animate-ping opacity-20" />
            
            {/* Horizontal Line */}
            <div className="absolute w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
         </div>

         {/* Distance Indicator Overlay */}
         <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-80 h-80 border-2 border-dashed border-cyan-400/10 rounded-full animate-[spin_15s_linear_infinite]" />
         </div>

        {/* Step Indicator Card */}
        <div className="absolute bottom-10 left-5 right-5 pointer-events-auto">
          <div className="rounded-[32px] overflow-hidden bg-black/70 border border-white/10 backdrop-blur-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 flex items-center justify-center border border-cyan-400/30">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">near_me</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                   <h3 className="text-white font-bold text-base">Navigating to Seat</h3>
                   <span className="text-cyan-400 font-black text-sm">{distance}m</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${(45-distance)/45*100}%` }} />
                </div>
              </div>
            </div>
            
            <p className="text-white/90 font-medium text-sm mb-4 leading-relaxed">
              {steps[step]}
            </p>

            <div className="flex gap-2">
              <button onClick={() => navigate('map2d')}
                className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg">map</span> MAP VIEW
              </button>
              <button 
                className="flex-1 h-12 rounded-2xl bg-cyan-400 text-black font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,212,255,0.4)]">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings:"'FILL' 1" }}>spatial_tracking</span> IMMERSIVE
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ARNavScreen;
