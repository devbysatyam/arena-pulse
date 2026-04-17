import * as THREE from 'three';
import { SECTIONS, GATES, AMENITIES, getCrowdColor, AMENITY_COLORS } from './stadium-data';

export function createProceduralStadium(routeCoords: {x:number, y:number}[], highlightType: string = 'all'): THREE.Group {
  const group = new THREE.Group();

  // 1. PITCH (Center)
  const pitchGeo = new THREE.BoxGeometry(176 * 0.32, 0.2, 136 * 0.32); 
  const pitchMat = new THREE.MeshLambertMaterial({ color: 0x1a3d1a });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.position.y = 0.1;
  pitch.receiveShadow = true;
  group.add(pitch);

  // Pitch white line markings
  const pitchLinesGeo = new THREE.RingGeometry(8, 8.5, 32);
  const pitchLinesMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const pitchLines = new THREE.Mesh(pitchLinesGeo, pitchLinesMat);
  pitchLines.rotation.x = -Math.PI / 2;
  pitchLines.position.y = 0.25;
  group.add(pitchLines);

  const innerLineGeo = new THREE.BoxGeometry(174 * 0.32, 0.05, 134 * 0.32);
  const innerLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const innerLine = new THREE.Mesh(innerLineGeo, innerLineMat);
  innerLine.position.y = 0.21;
  group.add(innerLine);
  
  const innerDarkLineGeo = new THREE.BoxGeometry(172 * 0.32, 0.06, 132 * 0.32);
  const innerDarkLineMat = new THREE.MeshBasicMaterial({ color: 0x1a3d1a });
  const innerDarkLine = new THREE.Mesh(innerDarkLineGeo, innerDarkLineMat);
  innerDarkLine.position.y = 0.22;
  group.add(innerDarkLine);


  // 2. INNER CONCOURSE
  const innerConcGeo = new THREE.RingGeometry(32, 36, 64);
  const innerConcMat = new THREE.MeshLambertMaterial({ color: 0x222436, side: THREE.DoubleSide });
  const innerConc = new THREE.Mesh(innerConcGeo, innerConcMat);
  innerConc.rotation.x = -Math.PI / 2;
  innerConc.position.y = 0.1;
  innerConc.receiveShadow = true;
  group.add(innerConc);

  // 3. SECTIONS (Stands) - Dimmed if a specific amenity is highlighted
  const isGlobalDim = highlightType !== 'all';

  SECTIONS.forEach((sec, i) => {
    const angle = (i / SECTIONS.length) * Math.PI * 2;
    const nextAngle = ((i + 1) / SECTIONS.length) * Math.PI * 2;
    const midAngle = (angle + nextAngle) / 2;
    const color = getCrowdColor(sec.occupancy);

    for (let tier = 0; tier < 3; tier++) {
      const rx = 36 + tier * 12; 
      const width = 12;         
      const height = 4 + tier * 6; 
      const arcSpan = (nextAngle - angle) - 0.05; 
      
      const arcGeo = new THREE.CylinderGeometry(rx + width, rx, height, 24, 1, false, angle + 0.025, arcSpan);
      const arcMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(color).multiplyScalar(isGlobalDim ? 0.3 : (0.7 + tier * 0.1)),
        transparent: true,
        opacity: isGlobalDim ? 0.4 : 0.9,
      });
      const stand = new THREE.Mesh(arcGeo, arcMat);
      stand.position.y = height / 2;
      stand.castShadow = true;
      stand.receiveShadow = true;
      group.add(stand);
    }

    // LABEL SPRITES
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = isGlobalDim ? '#ffffff' : color;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = isGlobalDim ? 0.2 : 1.0;
    ctx.fillText(`${sec.label.split(' ')[0]}`, 64, 30);
    ctx.font = '24px sans-serif';
    ctx.fillText(`${sec.occupancy}%`, 64, 60);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: isGlobalDim ? 0.3 : 1 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(Math.cos(midAngle) * 75, 25, Math.sin(midAngle) * 75);
    sprite.scale.set(20, 10, 1);
    group.add(sprite);
  });

  // 4. OUTER CONCOURSE
  const outerConcGeo = new THREE.RingGeometry(75, 85, 64);
  const outerConcMat = new THREE.MeshLambertMaterial({ 
    color: 0x181a28, 
    transparent: true, 
    opacity: isGlobalDim ? 0.4 : 1.0,
    side: THREE.DoubleSide 
  });
  const outerConc = new THREE.Mesh(outerConcGeo, outerConcMat);
  outerConc.rotation.x = -Math.PI / 2;
  outerConc.position.y = 0.5;
  group.add(outerConc);

  const mapSVGto3D = (x: number, y: number) => {
    const x3d = (x - 200) * 0.45;
    const z3d = (y - 170) * 0.45;
    return { x: x3d, z: z3d };
  };

  // 5. GATES
  GATES.forEach(gate => {
    const pos = mapSVGto3D(gate.x, gate.y);
    const isHighlighted = highlightType === 'gate';
    const gCol = gate.open ? 0x00ff9d : 0xff4d6a;

    const gGeo = new THREE.BoxGeometry(5, isHighlighted ? 20 : 12, 5);
    const gMat = new THREE.MeshPhongMaterial({ 
      color: gCol, 
      transparent: true, 
      opacity: (highlightType === 'all' || isHighlighted) ? 0.8 : 0.2,
      emissive: isHighlighted ? gCol : 0x000000,
      emissiveIntensity: isHighlighted ? 1.0 : 0
    });
    const gMesh = new THREE.Mesh(gGeo, gMat);
    gMesh.position.set(pos.x, (isHighlighted ? 10 : 6), pos.z);
    group.add(gMesh);

    if (isHighlighted || (highlightType === 'all' && gate.open)) {
      const pLight = new THREE.PointLight(gCol, isHighlighted ? 5 : 2, 30);
      pLight.position.set(pos.x, 15, pos.z);
      group.add(pLight);
    }
  });


  // 6. AMENITIES
  AMENITIES.forEach(am => {
    const isHighlighted = highlightType === am.type;
    const pos = mapSVGto3D(am.x, am.y);
    const colorHex = AMENITY_COLORS[am.type] || '#ffffff';
    const cHex = parseInt(colorHex.replace('#', '0x'));
    
    const aGeo = new THREE.OctahedronGeometry(isHighlighted ? 4 : 2.5, 0);
    const aMat = new THREE.MeshPhongMaterial({ 
      color: cHex, 
      emissive: cHex, 
      emissiveIntensity: isHighlighted ? 2.0 : 0.3,
      transparent: true,
      opacity: (highlightType === 'all' || isHighlighted) ? 1.0 : 0.15,
      shininess: 100 
    });
    const aMesh = new THREE.Mesh(aGeo, aMat);
    aMesh.position.set(pos.x, isHighlighted ? 15 : 10, pos.z);
    
    // Add rotation logic (conceptual, will be updated in anim loop if needed, but here we just set initial)
    aMesh.rotation.y = Math.random() * Math.PI;
    group.add(aMesh);

    if (isHighlighted) {
      const aLight = new THREE.PointLight(cHex, 3, 20);
      aLight.position.set(pos.x, 20, pos.z);
      group.add(aLight);
    }
  });

  // 7. ROUTE PATH (Raised and thickened)
  if (routeCoords && routeCoords.length > 0) {
    const points: THREE.Vector3[] = [];
    for (const p of routeCoords) {
      const pos = mapSVGto3D(p.x, p.y);
      // Lifted significantly higher to avoid stand clipping
      points.push(new THREE.Vector3(pos.x, 5.0, pos.z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(40, points.length * 6), 1.8, 8, false);
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0x00d4ff, 
      emissive: 0x00d4ff,
      emissiveIntensity: 1.5,
      transparent: true, 
      opacity: 0.95 
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    // Glow effect
    tube.add(new THREE.PointLight(0x00d4ff, 2, 50));
    group.add(tube);

    // Dynamic waypoint spheres
    points.forEach((p, idx) => {
      if (idx % 3 === 0) {
        const markerGeo = new THREE.SphereGeometry(2.2, 12, 12);
        const markerMat = new THREE.MeshPhongMaterial({ 
          color: 0xffffff, 
          emissive: 0x00d4ff,
          emissiveIntensity: 1.0 
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(p);
        group.add(marker);
      }
    });
  }

  return group;
}
