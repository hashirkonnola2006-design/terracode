import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Detailed Floating Space Wastes)
// ═══════════════════════════════════════════════════════════════
export const DRIFT_SPEED = 0.04;

// ── 1. PROCEDURAL BLUE INDUSTRIAL MILK CRATE ──
// Open hollow frame with diamond lattice side cutouts & handles (NOT a solid block!)
function createMilkCrateLatticeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Solid blue border frame
  ctx.fillStyle = '#0f4db8';
  ctx.fillRect(0, 0, 256, 256);

  // Clear inner lattice area
  ctx.clearRect(14, 14, 228, 228);

  // Draw criss-cross diamond grid ribs
  ctx.strokeStyle = '#0f4db8';
  ctx.lineWidth = 7;
  const step = 22;

  for (let x = -256; x < 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x + 228, 242);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 242);
    ctx.lineTo(x + 228, 14);
    ctx.stroke();
  }

  // Handle cutout in upper-middle
  ctx.clearRect(60, 38, 136, 38);
  ctx.fillStyle = '#0a3680';
  ctx.strokeStyle = '#082a66';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 38, 136, 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// ── 2. DETAILED WATER BOTTLE GEOMETRY ──
// Lathe geometry with realistic base, 4 molded grip rings, tapered shoulder & threaded neck
function createWaterBottleGeometry() {
  const points = [];
  points.push(new THREE.Vector2(0.0, 0.0));
  points.push(new THREE.Vector2(0.32, 0.03));
  points.push(new THREE.Vector2(0.36, 0.10));

  // 4 molded horizontal grip ridges
  for (let i = 0; i < 4; i++) {
    const y = 0.20 + i * 0.20;
    points.push(new THREE.Vector2(0.38, y));
    points.push(new THREE.Vector2(0.34, y + 0.05));
    points.push(new THREE.Vector2(0.38, y + 0.10));
  }

  points.push(new THREE.Vector2(0.37, 1.15));
  points.push(new THREE.Vector2(0.22, 1.38));
  points.push(new THREE.Vector2(0.14, 1.50));
  points.push(new THREE.Vector2(0.14, 1.70));
  points.push(new THREE.Vector2(0.16, 1.72));
  points.push(new THREE.Vector2(0.16, 1.80));
  points.push(new THREE.Vector2(0.0, 1.80));

  const geom = new THREE.LatheGeometry(points, 24);
  geom.center();
  return geom;
}

// ── 3. CRUMPLED PLASTIC GROCERY BAG WITH HANDLES ──
// Billowing folds with two looped handles at top
function createDetailedBagGeometry() {
  const geom = new THREE.CylinderGeometry(0.32, 0.40, 1.10, 20, 14, true);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Multi-octave wrinkles & billowing puff
    const crinkle1 = Math.sin(x * 8.0 + y * 6.5) * 0.07;
    const crinkle2 = Math.cos(z * 9.0 - y * 7.5) * 0.05;
    const bulge = Math.cos(y * 2.5) * 0.08;

    pos.setXYZ(i, x + crinkle1 + bulge, y, z + crinkle2);
  }
  geom.computeVertexNormals();
  return geom;
}

// ── 4. DENTED SODA CAN GEOMETRY ──
// Realistic cylinder with an indented crush dent
function createDentedCanGeometry() {
  const geom = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 28, 16);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Indented crushed dent on one side
    const d = Math.hypot(x - 0.22, y * 1.4, z);
    if (d < 0.28) {
      const dent = Math.cos((d / 0.28) * Math.PI * 0.5) * 0.08;
      pos.setX(i, x - dent);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

// ── 5. SODA CAN GRAPHICS TEXTURE ──
function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cc0000';
  ctx.fillRect(0, 0, 512, 512);

  // Silver metallic rims
  ctx.fillStyle = '#b0b8c2';
  ctx.fillRect(0, 0, 512, 38);
  ctx.fillRect(0, 474, 512, 38);

  // Dynamic white swoosh
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.bezierCurveTo(140, 170, 360, 330, 512, 230);
  ctx.lineTo(512, 290);
  ctx.bezierCurveTo(360, 390, 140, 230, 0, 300);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const FloatingDebris = ({ mousePos = { x: 0, y: 0 }, healProgress = 0 }) => {
  // References for each distinct hero floating waste
  const crateRef     = useRef(null);
  const bagRef       = useRef(null);
  const bottleRef    = useRef(null);
  const canRef       = useRef(null);
  const tireRef      = useRef(null);
  const cupRef       = useRef(null);
  const distBottleRef= useRef(null);
  const distCapRef   = useRef(null);

  // Textures
  const crateLatticeTex = useMemo(() => createMilkCrateLatticeTexture(), []);
  const canTexture      = useMemo(() => createSodaCanTexture(), []);

  // Geometries
  const bottleGeom = useMemo(() => createWaterBottleGeometry(), []);
  const bagGeom    = useMemo(() => createDetailedBagGeometry(), []);
  const canGeom    = useMemo(() => createDentedCanGeometry(), []);
  const tireGeom   = useMemo(() => new THREE.TorusGeometry(0.32, 0.13, 14, 28), []);
  const cupGeom    = useMemo(() => new THREE.CylinderGeometry(0.20, 0.15, 0.50, 24), []);
  const lidGeom    = useMemo(() => new THREE.CylinderGeometry(0.21, 0.21, 0.05, 24), []);
  const capGeom    = useMemo(() => new THREE.CylinderGeometry(0.15, 0.15, 0.10, 20), []);
  const pullTabGeom= useMemo(() => new THREE.BoxGeometry(0.08, 0.015, 0.14), []);

  // Materials
  // 1. Blue Crate Materials (Solid frame + open alpha-tested lattice walls)
  const matCrateSolid = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f4db8',
    roughness: 0.38,
    metalness: 0.06,
  }), []);

  const matCrateLattice = useMemo(() => new THREE.MeshStandardMaterial({
    map: crateLatticeTex,
    color: '#0f4db8',
    roughness: 0.38,
    metalness: 0.06,
    transparent: true,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
  }), []);

  // 2. Translucent Plastic Shopping Bag Material
  const matTranslucentBag = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f0f5fa',
    roughness: 0.24,
    transmission: 0.72,
    thickness: 0.15,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  // 3. Clear Water Bottle Material (PET plastic with reflections)
  const matClearBottle = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#dce8f5',
    roughness: 0.06,
    transmission: 0.88,
    ior: 1.48,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.FrontSide,
  }), []);

  const matBlueCap = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1565c0',
    roughness: 0.35,
    metalness: 0.05,
  }), []);

  // 4. Aluminum Dented Soda Can Material
  const matSodaCan = useMemo(() => new THREE.MeshStandardMaterial({
    map: canTexture,
    roughness: 0.22,
    metalness: 0.82,
  }), []);

  const matSilverMetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ccd2db',
    roughness: 0.20,
    metalness: 0.92,
  }), []);

  // 5. Matte Rubber Tire Material
  const matRubberTire = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#161619',
    roughness: 0.88,
    metalness: 0.08,
  }), []);

  // 6. Paper Coffee Cup Material
  const matPaperCup = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c8a882',
    roughness: 0.78,
  }), []);

  const matPlasticLid = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.28,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Smooth dissolution as Earth heals
    const heroTrashScale = Math.max(0.0, 1.0 - smoothstep(0.32, 0.85, healProgress));

    // 1. Blue Industrial Milk Crate (Upper-Left between Sun & Earth)
    if (crateRef.current) {
      const px = -1.65 + mousePos.x * 0.10;
      const py = 1.05 + mousePos.y * 0.08;
      crateRef.current.position.set(px, py, 0.25);
      crateRef.current.rotation.x = -0.35 + Math.sin(t * 0.22) * 0.08;
      crateRef.current.rotation.y = t * 0.18;
      crateRef.current.rotation.z = 0.40 + Math.cos(t * 0.16) * 0.06;
      const s = 0.32 * heroTrashScale;
      crateRef.current.scale.set(s, s, s);
    }

    // 2. Translucent Shopping Bag with Handles (Upper-Right)
    if (bagRef.current) {
      const px = 1.85 + mousePos.x * 0.10;
      const py = 0.45 + mousePos.y * 0.08;
      bagRef.current.position.set(px, py, 0.35);
      bagRef.current.rotation.x = 0.32 + Math.sin(t * 0.28) * 0.10;
      bagRef.current.rotation.y = -0.45 + t * 0.12;
      bagRef.current.rotation.z = 0.25 + Math.cos(t * 0.20) * 0.08;
      const s = 0.42 * heroTrashScale;
      bagRef.current.scale.set(s, s, s);
    }

    // 3. Transparent Water Bottle (Bottom-Left Foreground)
    if (bottleRef.current) {
      const px = -1.80 + mousePos.x * 0.12;
      const py = -1.02 + mousePos.y * 0.08;
      bottleRef.current.position.set(px, py, 1.05);
      bottleRef.current.rotation.x = 0.45 + Math.sin(t * 0.24) * 0.06;
      bottleRef.current.rotation.y = 0.50 + Math.cos(t * 0.18) * 0.05;
      bottleRef.current.rotation.z = -0.70 + Math.sin(t * 0.20) * 0.04;
      const s = 0.62 * heroTrashScale;
      bottleRef.current.scale.set(s, s, s);
    }

    // 4. Dented Soda Can (Lower-Right)
    if (canRef.current) {
      const px = 1.62 + mousePos.x * 0.10;
      const py = -1.05 + mousePos.y * 0.08;
      canRef.current.position.set(px, py, 0.50);
      canRef.current.rotation.x = 0.50 + Math.sin(t * 0.25) * 0.08;
      canRef.current.rotation.y = 0.70 + t * 0.20;
      canRef.current.rotation.z = -0.55;
      const s = 0.32 * heroTrashScale;
      canRef.current.scale.set(s, s, s);
    }

    // 5. Rubber Car Tire (Upper-Right Corner)
    if (tireRef.current) {
      const px = 1.65 + mousePos.x * 0.08;
      const py = 1.15 + mousePos.y * 0.06;
      tireRef.current.position.set(px, py, -0.15);
      tireRef.current.rotation.x = t * 0.22;
      tireRef.current.rotation.y = t * 0.16;
      const s = 0.28 * heroTrashScale;
      tireRef.current.scale.set(s, s, s);
    }

    // 6. Paper Coffee Cup (Mid-Left Edge)
    if (cupRef.current) {
      const px = -1.95 + mousePos.x * 0.08;
      const py = -0.18 + mousePos.y * 0.06;
      cupRef.current.position.set(px, py, 0.30);
      cupRef.current.rotation.x = 0.65 + Math.sin(t * 0.20) * 0.06;
      cupRef.current.rotation.y = t * 0.14;
      cupRef.current.rotation.z = 0.40;
      const s = 0.34 * heroTrashScale;
      cupRef.current.scale.set(s, s, s);
    }

    // 7. Distant Drifting Bottle (Far Upper-Right)
    if (distBottleRef.current) {
      const px = 2.15 + Math.sin(t * 0.10) * 0.05;
      const py = 1.40 + Math.cos(t * 0.08) * 0.04;
      distBottleRef.current.position.set(px, py, -0.80);
      distBottleRef.current.rotation.x = t * 0.15;
      distBottleRef.current.rotation.y = t * 0.10;
      const s = 0.24 * heroTrashScale;
      distBottleRef.current.scale.set(s, s, s);
    }

    // 8. Distant Bottle Cap (Far Lower-Left)
    if (distCapRef.current) {
      const px = -1.45 + Math.sin(t * 0.12) * 0.04;
      const py = -1.35 + Math.cos(t * 0.10) * 0.03;
      distCapRef.current.position.set(px, py, -0.50);
      distCapRef.current.rotation.x = t * 0.30;
      distCapRef.current.rotation.y = t * 0.25;
      const s = 0.18 * heroTrashScale;
      distCapRef.current.scale.set(s, s, s);
    }
  });

  function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  return (
    <group visible={healProgress < 0.99}>
      {/* ── 1. BLUE INDUSTRIAL MILK CRATE (Hollow Frame + Lattice Ribs) ── */}
      <group ref={crateRef}>
        {/* Top Outer Rim Beams */}
        <mesh geometry={new THREE.BoxGeometry(0.85, 0.07, 0.07)} material={matCrateSolid} position={[0, 0.32, 0.39]} />
        <mesh geometry={new THREE.BoxGeometry(0.85, 0.07, 0.07)} material={matCrateSolid} position={[0, 0.32, -0.39]} />
        <mesh geometry={new THREE.BoxGeometry(0.07, 0.07, 0.85)} material={matCrateSolid} position={[0.39, 0.32, 0]} />
        <mesh geometry={new THREE.BoxGeometry(0.07, 0.07, 0.85)} material={matCrateSolid} position={[-0.39, 0.32, 0]} />

        {/* Bottom Base Rim Beams */}
        <mesh geometry={new THREE.BoxGeometry(0.85, 0.07, 0.07)} material={matCrateSolid} position={[0, -0.32, 0.39]} />
        <mesh geometry={new THREE.BoxGeometry(0.85, 0.07, 0.07)} material={matCrateSolid} position={[0, -0.32, -0.39]} />
        <mesh geometry={new THREE.BoxGeometry(0.07, 0.07, 0.85)} material={matCrateSolid} position={[0.39, -0.32, 0]} />
        <mesh geometry={new THREE.BoxGeometry(0.07, 0.07, 0.85)} material={matCrateSolid} position={[-0.39, -0.32, 0]} />

        {/* 4 Vertical Corner Posts */}
        <mesh geometry={new THREE.BoxGeometry(0.08, 0.64, 0.08)} material={matCrateSolid} position={[0.38, 0, 0.38]} />
        <mesh geometry={new THREE.BoxGeometry(0.08, 0.64, 0.08)} material={matCrateSolid} position={[-0.38, 0, 0.38]} />
        <mesh geometry={new THREE.BoxGeometry(0.08, 0.64, 0.08)} material={matCrateSolid} position={[0.38, 0, -0.38]} />
        <mesh geometry={new THREE.BoxGeometry(0.08, 0.64, 0.08)} material={matCrateSolid} position={[-0.38, 0, -0.38]} />

        {/* 4 Diamond Lattice Side Panels (Open see-through grid) */}
        <mesh geometry={new THREE.PlaneGeometry(0.78, 0.58)} material={matCrateLattice} position={[0, 0, 0.39]} />
        <mesh geometry={new THREE.PlaneGeometry(0.78, 0.58)} material={matCrateLattice} position={[0, 0, -0.39]} rotation={[0, Math.PI, 0]} />
        <mesh geometry={new THREE.PlaneGeometry(0.78, 0.58)} material={matCrateLattice} position={[0.39, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <mesh geometry={new THREE.PlaneGeometry(0.78, 0.58)} material={matCrateLattice} position={[-0.39, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

        {/* Bottom Floor Slats */}
        <mesh geometry={new THREE.BoxGeometry(0.76, 0.02, 0.06)} material={matCrateSolid} position={[0, -0.32, 0]} />
        <mesh geometry={new THREE.BoxGeometry(0.76, 0.02, 0.06)} material={matCrateSolid} position={[0, -0.32, 0.18]} />
        <mesh geometry={new THREE.BoxGeometry(0.76, 0.02, 0.06)} material={matCrateSolid} position={[0, -0.32, -0.18]} />
      </group>

      {/* ── 2. TRANSLUCENT PLASTIC SHOPPING BAG WITH HANDLES ── */}
      <group ref={bagRef}>
        <mesh geometry={bagGeom} material={matTranslucentBag} />
        {/* Left Looped Handle */}
        <mesh
          geometry={new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI)}
          material={matTranslucentBag}
          position={[-0.15, 0.56, 0]}
          rotation={[0, 0, 0]}
        />
        {/* Right Looped Handle */}
        <mesh
          geometry={new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI)}
          material={matTranslucentBag}
          position={[0.15, 0.56, 0]}
          rotation={[0, 0, 0]}
        />
      </group>

      {/* ── 3. CLEAR PLASTIC WATER BOTTLE WITH BLUE CAP ── */}
      <group ref={bottleRef}>
        <mesh geometry={bottleGeom} material={matClearBottle} />
        <mesh geometry={capGeom} material={matBlueCap} position={[0, 0.90, 0]} />
      </group>

      {/* ── 4. DENTED RED SODA CAN WITH SILVER TOP & PULL TAB ── */}
      <group ref={canRef}>
        <mesh geometry={canGeom} material={matSodaCan} />
        {/* Silver Inset Top Rim */}
        <mesh geometry={new THREE.CylinderGeometry(0.24, 0.24, 0.04, 28)} material={matSilverMetal} position={[0, 0.38, 0]} />
        {/* Silver Pull Tab */}
        <mesh geometry={pullTabGeom} material={matSilverMetal} position={[0.04, 0.40, 0.04]} rotation={[-0.1, 0.4, 0]} />
        {/* Silver Chime Base */}
        <mesh geometry={new THREE.CylinderGeometry(0.22, 0.24, 0.04, 28)} material={matSilverMetal} position={[0, -0.38, 0]} />
      </group>

      {/* ── 5. DETAILED RUBBER CAR TIRE ── */}
      <mesh ref={tireRef} geometry={tireGeom} material={matRubberTire} />

      {/* ── 6. TAKEAWAY COFFEE CUP WITH SIPPING LID ── */}
      <group ref={cupRef}>
        <mesh geometry={cupGeom} material={matPaperCup} />
        <mesh geometry={lidGeom} material={matPlasticLid} position={[0, 0.26, 0]} />
      </group>

      {/* ── 7. DISTANT DRIFTING BOTTLE ── */}
      <group ref={distBottleRef}>
        <mesh geometry={bottleGeom} material={matClearBottle} scale={0.7} />
        <mesh geometry={capGeom} material={matBlueCap} scale={0.7} position={[0, 0.63, 0]} />
      </group>

      {/* ── 8. DISTANT DRIFTING BOTTLE CAP ── */}
      <mesh ref={distCapRef} geometry={capGeom} material={matBlueCap} />
    </group>
  );
};

export default FloatingDebris;
