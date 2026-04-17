'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppStore } from '@/store/app-store';
import { SECTIONS, AMENITIES, GATES, AMENITY_COLORS, getCrowdColor } from '@/lib/stadium-data';

// ─── Inline stadium builder with refs for interactive updates ───────────────
interface StadiumRefs {
  amenityMeshes: { mesh: THREE.Mesh; mat: THREE.MeshPhongMaterial; type: string }[];
  gateMeshes:    { mesh: THREE.Mesh; mat: THREE.MeshPhongMaterial; open: boolean }[];
  standMats:     THREE.MeshLambertMaterial[];
}

function buildStadium(
  scene: THREE.Scene,
  routeCoords: { x: number; y: number }[],
  group: THREE.Group,
): StadiumRefs {
  const refs: StadiumRefs = { amenityMeshes: [], gateMeshes: [], standMats: [] };

  const mapSVGto3D = (x: number, y: number) => ({
    x: (x - 200) * 0.45,
    z: (y - 170) * 0.45,
  });

  // 1. PITCH
  const pitchGeo = new THREE.BoxGeometry(56, 0.3, 43);
  const pitchMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.receiveShadow = true;
  group.add(pitch);

  // Pitch center circle
  const circleGeo = new THREE.RingGeometry(7.5, 8.2, 48);
  const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const circle = new THREE.Mesh(circleGeo, circleMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.2;
  group.add(circle);

  // Penalty boxes
  [[-18, 0], [18, 0]].forEach(([px]) => {
    const boxG = new THREE.BoxGeometry(0.2, 0.25, 20);
    const boxM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const b = new THREE.Mesh(boxG, boxM);
    b.position.set(px, 0.2, 0);
    group.add(b);
  });

  // 2. TIERED STANDS around the pitch
  SECTIONS.forEach((sec, i) => {
    const angle = (i / SECTIONS.length) * Math.PI * 2;
    const nextAngle = ((i + 1) / SECTIONS.length) * Math.PI * 2;
    const span = nextAngle - angle - 0.04;
    const color = getCrowdColor(sec.occupancy);

    for (let tier = 0; tier < 3; tier++) {
      const rx = 34 + tier * 11;
      const h = 5 + tier * 7;
      const geo = new THREE.CylinderGeometry(rx + 10, rx, h, 32, 1, false, angle + 0.02, span);
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color).multiplyScalar(0.75 + tier * 0.1),
        transparent: true,
        opacity: 0.92,
      });
      refs.standMats.push(mat);
      const stand = new THREE.Mesh(geo, mat);
      stand.position.y = h / 2;
      stand.castShadow = true;
      group.add(stand);
    }

    // Section label sprite
    const cvs = document.createElement('canvas');
    cvs.width = 128; cvs.height = 64;
    const c = cvs.getContext('2d')!;
    c.fillStyle = color;
    c.font = 'bold 28px sans-serif';
    c.textAlign = 'center';
    c.fillText(sec.label.substring(0, 3), 64, 28);
    c.font = '20px sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillText(`${sec.occupancy}%`, 64, 56);
    const tex = new THREE.CanvasTexture(cvs);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    const mid = (angle + nextAngle) / 2;
    sp.position.set(Math.cos(mid) * 68, 22, Math.sin(mid) * 68);
    sp.scale.set(18, 9, 1);
    group.add(sp);
  });

  // 3. OUTER RING (concourse floor)
  const outerRingGeo = new THREE.RingGeometry(63, 80, 64);
  const outerRingMat = new THREE.MeshLambertMaterial({ color: 0x14151f, side: THREE.DoubleSide });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.2;
  group.add(outerRing);

  // 4. GATES
  GATES.forEach(gate => {
    const pos = mapSVGto3D(gate.x, gate.y);
    const col = gate.open ? 0x00ff9d : 0xff4d6a;
    const geo = new THREE.BoxGeometry(4, 14, 4);
    const mat = new THREE.MeshPhongMaterial({
      color: col, emissive: col, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 7, pos.z);
    mesh.castShadow = true;
    group.add(mesh);
    refs.gateMeshes.push({ mesh, mat, open: gate.open });

    const pLight = new THREE.PointLight(col, 1.5, 20);
    pLight.position.set(pos.x, 16, pos.z);
    group.add(pLight);
  });

  // 5. AMENITY markers
  AMENITIES.forEach(am => {
    const pos = mapSVGto3D(am.x, am.y);
    const colorHex = AMENITY_COLORS[am.type as keyof typeof AMENITY_COLORS] || '#ffffff';
    const cHex = parseInt(colorHex.replace('#', ''), 16);
    const geo = new THREE.OctahedronGeometry(3, 0);
    const mat = new THREE.MeshPhongMaterial({
      color: cHex, emissive: cHex, emissiveIntensity: 0.4,
      transparent: true, opacity: 1.0, shininess: 120,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 12, pos.z);
    group.add(mesh);
    refs.amenityMeshes.push({ mesh, mat, type: am.type });
  });

  // 6. NAVIGATION ROUTE tube
  if (routeCoords && routeCoords.length > 1) {
    const points = routeCoords.map(p => {
      const pos = mapSVGto3D(p.x, p.y);
      return new THREE.Vector3(pos.x, 4, pos.z);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(30, points.length * 5), 1.5, 8, false);
    const tubeMat = new THREE.MeshPhongMaterial({
      color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1.8,
      transparent: true, opacity: 0.9,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    points.forEach((p, idx) => {
      if (idx % 4 === 0) {
        const markerGeo = new THREE.SphereGeometry(2, 10, 10);
        const markerMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x00d4ff, emissiveIntensity: 1 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(p);
        group.add(marker);
      }
    });
  }

  // 7. ROOF TRUSS RING (decorative)
  const roofGeo = new THREE.TorusGeometry(82, 1.5, 8, 64);
  const roofMat = new THREE.MeshPhongMaterial({ color: 0x333355, emissive: 0x7c5ff0, emissiveIntensity: 0.2 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.x = Math.PI / 2;
  roof.position.y = 42;
  group.add(roof);

  return refs;
}

// Update material opacity/emissive without rebuilding
function applyFilter(refs: StadiumRefs, highlightType: string) {
  const isAll = highlightType === 'all';

  // Amenity markers
  refs.amenityMeshes.forEach(({ mesh, mat, type }) => {
    const isHL = type === highlightType;
    mat.emissiveIntensity = isHL ? 2.5 : (isAll ? 0.4 : 0.1);
    mat.opacity = (isAll || isHL) ? 1.0 : 0.12;
    mesh.scale.setScalar(isHL ? 1.7 : 1.0);
    mesh.position.y = isHL ? 18 : 12;
    mat.needsUpdate = true;
  });

  // Gate markers
  refs.gateMeshes.forEach(({ mesh, mat }) => {
    const isHL = highlightType === 'gate';
    mat.emissiveIntensity = isHL ? 2.0 : (isAll ? 0.3 : 0.1);
    mat.opacity = (isAll || isHL) ? 0.85 : 0.1;
    mesh.scale.y = isHL ? 1.6 : 1.0;
    mesh.position.y = isHL ? 11 : 7;
    mat.needsUpdate = true;
  });

  // Stands dimming
  refs.standMats.forEach(mat => {
    mat.opacity = isAll ? 0.92 : 0.35;
    mat.needsUpdate = true;
  });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Stadium3DScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { navigate, navRoute } = useAppStore();
  const [viewType, setViewType] = useState<'free' | 'top' | 'seat' | 'gate'>('free');
  const [filterType, setFilterType] = useState<string>('all');

  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animRef     = useRef<number>(0);
  const stadiumRefsRef = useRef<StadiumRefs | null>(null);
  const pulseLightRef  = useRef<THREE.PointLight | null>(null);

  // User seat coords (SA2 mapping)
  const uX = (305 - 200) * 0.45;
  const uZ = (170 - 170) * 0.45;

  // ── Initialize Three.js once ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent duplicate canvas on HMR
    containerRef.current.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060710);
    scene.fog = new THREE.FogExp2(0x060710, 0.0008);
    sceneRef.current = scene;

    const w = containerRef.current.clientWidth || window.innerWidth;
    const h = containerRef.current.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.5, 4000);
    camera.position.set(0, 420, 480);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 25;
    controls.maxDistance = 1800;
    controls.target.set(0, 5, 0);
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0x223366, 0.7));

    const sun = new THREE.DirectionalLight(0x8080ff, 1.0);
    sun.position.set(150, 400, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x7c5ff0, 0.5);
    fill.position.set(-100, 200, -200);
    scene.add(fill);

    const pulseLight = new THREE.PointLight(0x00d4ff, 3, 300);
    pulseLight.position.set(0, 80, 0);
    scene.add(pulseLight);
    pulseLightRef.current = pulseLight;

    // Stadium floodlights
    [
      [80, 55, 80], [-80, 55, 80], [80, 55, -80], [-80, 55, -80],
    ].forEach(([x, y, z]) => {
      const fl = new THREE.SpotLight(0xfff8e0, 2.5, 350, Math.PI / 6, 0.3, 1.5);
      fl.position.set(x, y, z);
      fl.target.position.set(0, 0, 0);
      scene.add(fl);
      scene.add(fl.target);
    });

    // Build stadium
    const group = new THREE.Group();
    scene.add(group);
    const refs = buildStadium(scene, navRoute?.coords || [], group);
    stadiumRefsRef.current = refs;

    // Animate loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      if (pulseLightRef.current) {
        pulseLightRef.current.intensity = 2 + Math.sin(Date.now() * 0.0025) * 1;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply filter instantly by mutating materials (NO full rebuild) ──────
  useEffect(() => {
    if (!stadiumRefsRef.current) return;
    applyFilter(stadiumRefsRef.current, filterType);
  }, [filterType]);

  // ─── View presets ─────────────────────────────────────────────────────
  const setView = (type: 'top' | 'seat' | 'gate' | 'reset') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    switch (type) {
      case 'top':    cam.position.set(0, 900, 0.5);    ctrl.target.set(0, 0, 0);    break;
      case 'seat':   cam.position.set(uX*1.4, 100, uZ*1.4 + 120); ctrl.target.set(uX, 10, uZ); break;
      case 'gate':   cam.position.set(160, 130, 300);  ctrl.target.set(100, 0, 150); break;
      case 'reset':  cam.position.set(0, 420, 480);    ctrl.target.set(0, 5, 0);    break;
    }

    ctrl.update();
    setViewType(type === 'reset' ? 'free' : type);

    // Force immediate frame
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, cam);
    }
  };

  // ─── Zoom ──────────────────────────────────────────────────────────────
  const handleZoom = (direction: 'in' | 'out') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    const factor = direction === 'in' ? 0.65 : 1.5;
    const offset = new THREE.Vector3().subVectors(cam.position, ctrl.target);
    offset.multiplyScalar(factor);

    if (direction === 'in' && offset.length() < 30) return;
    if (direction === 'out' && offset.length() > 1800) return;

    cam.position.addVectors(ctrl.target, offset);
    ctrl.update();

    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, cam);
    }
  };

  const amenitiesNav = [
    { id: 'all',  label: 'All',   icon: 'grid_view' },
    { id: 'food', label: 'Food',  icon: 'fastfood' },
    { id: 'wc',   label: 'WC',    icon: 'wc' },
    { id: 'gate', label: 'Gates', icon: 'door_open' },
    { id: 'atm',  label: 'ATM',   icon: 'atm' },
  ];

  return (
    <div className="relative w-full h-screen bg-[#060710] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-5 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={() => navigate('home')}
            className="w-11 h-11 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="bg-black/50 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-xl">
            <h1 className="text-lg font-headline font-black text-white leading-tight">Arena 3D</h1>
            <p className="text-[9px] font-bold text-[#00d4ff] uppercase tracking-widest">Interactive Digital Twin</p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex flex-col rounded-2xl overflow-hidden bg-black/80 border border-white/10 backdrop-blur-xl">
          <button onClick={() => handleZoom('in')}
            className="w-11 h-11 flex items-center justify-center text-[#00d4ff] hover:bg-white/10 border-b border-white/5 transition-all active:scale-95">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button onClick={() => handleZoom('out')}
            className="w-11 h-11 flex items-center justify-center text-[#00d4ff] hover:bg-white/10 transition-all active:scale-95">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
      </div>

      {/* Amenity Filter Sidebar */}
      <div className="absolute top-24 left-5 flex flex-col gap-3 pointer-events-auto z-20">
        {amenitiesNav.map(am => (
          <div key={am.id} className="relative group">
            <button
              onClick={() => setFilterType(am.id)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all backdrop-blur-xl border
                ${filterType === am.id
                  ? 'bg-[#00d4ff] border-[#00d4ff] text-black scale-110 shadow-[0_0_20px_rgba(0,212,255,0.5)]'
                  : 'bg-black/70 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">{am.icon}</span>
            </button>
            <span className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/90 text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
              {am.label}
            </span>
          </div>
        ))}
      </div>

      {/* Camera Presets */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto z-20">
        {[
          { id: 'reset', icon: 'home',        label: 'RESET' },
          { id: 'top',   icon: 'grid_view',   label: 'TOP' },
          { id: 'seat',  icon: 'event_seat',  label: 'SEAT' },
          { id: 'gate',  icon: 'location_on', label: 'GATE' },
        ].map(btn => (
          <button key={btn.id} onClick={() => setView(btn.id as any)}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all backdrop-blur-xl border
              ${viewType === btn.id
                ? 'bg-[#7c5ff0] border-[#7c5ff0] text-white shadow-[0_0_20px_rgba(124,95,240,0.6)]'
                : 'bg-black/70 border-white/10 text-white/60 hover:bg-white/10 hover:text-white active:scale-95'}`}>
            <span className="material-symbols-outlined text-xl">{btn.icon}</span>
            <span className="text-[8px] font-black tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Filter status badge */}
      {filterType !== 'all' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#00d4ff]/15 border border-[#00d4ff]/40 backdrop-blur-xl">
          <p className="text-[10px] font-black text-[#00d4ff] uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            Highlighting · {filterType.toUpperCase()}
          </p>
        </div>
      )}

      {/* Occupancy Ticker */}
      <div className="absolute bottom-36 left-0 w-full px-5 overflow-x-auto flex flex-nowrap gap-2 pointer-events-auto z-20 no-scrollbar">
        {SECTIONS.map(sec => (
          <div key={sec.id}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: sec.color, boxShadow: `0 0 6px ${sec.color}` }} />
            <span className="text-[11px] font-bold text-white whitespace-nowrap">
              {sec.label} <span className="text-[#00d4ff]">{sec.occupancy}%</span>
            </span>
          </div>
        ))}
      </div>

      {/* Nav Footer */}
      <div className="absolute bottom-20 left-5 right-5 pointer-events-auto z-20">
        <div className="p-[1px] rounded-[28px] bg-gradient-to-r from-[#00d4ff]/50 via-[#7c5ff0]/50 to-[#00d4ff]/50">
          <div className="bg-[#060710]/95 rounded-[27px] p-4 backdrop-blur-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00d4ff]/20 flex items-center justify-center border border-[#00d4ff]/30">
                <span className="material-symbols-outlined text-[#00d4ff] text-2xl animate-pulse">navigation</span>
              </div>
              <div>
                <h4 className="text-[9px] font-black text-[#00d4ff] uppercase tracking-[0.2em] mb-0.5">Recommended Route</h4>
                <p className="text-sm font-bold text-white">
                  {navRoute ? `→ ${navRoute.endNode}` : 'Navigate to your seat'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('ar-nav')}
              className="px-6 h-12 rounded-2xl bg-white text-black font-headline font-black text-xs uppercase tracking-widest hover:bg-[#00d4ff] hover:scale-105 active:scale-95 transition-all">
              Start AR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
