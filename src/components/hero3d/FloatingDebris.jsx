import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Cinematic Clutter of Floating Wastes)
// ═══════════════════════════════════════════════════════════════
export const SMALL_DEBRIS_SCALE = 0.058;  // Crisp visible size relative to Earth
export const ORBIT_MIN_RADIUS   = 1.08;   // Orbit skimming just above atmosphere
export const ORBIT_MAX_RADIUS   = 1.62;   // Outer edge of orbital debris halo

// Optimized instance counts across 5 distinct low-poly debris types
export const COUNT_BOTTLES = 60; // Water bottles
export const COUNT_BAGS    = 70; // Crumpled plastic bags
export const COUNT_CANS    = 50; // Soda cans
export const COUNT_TIRES   = 25; // Rubber tires
export const COUNT_CRATES  = 25; // Industrial crates

// ── 1. LOW-POLY GEOMETRIES (Optimized for performance) ──
function createWaterBottleGeometry() {
  const geom = new THREE.CylinderGeometry(0.24, 0.28, 1.25, 10);
  geom.center();
  return geom;
}

function createShoppingBagGeometry() {
  const geom = new THREE.DodecahedronGeometry(0.48, 0);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setXYZ(i, x * 0.85, y * 1.35, z * 0.70);
  }
  geom.computeVertexNormals();
  return geom;
}

function createDentedCanGeometry() {
  const geom = new THREE.CylinderGeometry(0.26, 0.26, 0.75, 12);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (Math.abs(y) < 0.25 && pos.getX(i) > 0.05) {
      pos.setX(i, pos.getX(i) * 0.85);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function createTireGeometry() {
  const geom = new THREE.TorusGeometry(0.42, 0.17, 8, 16);
  geom.center();
  return geom;
}

function createCrateGeometry() {
  const geom = new THREE.BoxGeometry(0.75, 0.52, 0.60);
  geom.center();
  return geom;
}

// Higher-detail geometries for cinematic foreground debris
function createDetailedBottleGeometry() {
  const points = [
    new THREE.Vector2(0, -0.65),
    new THREE.Vector2(0.20, -0.63),
    new THREE.Vector2(0.24, -0.55),
    new THREE.Vector2(0.24, 0.20),
    new THREE.Vector2(0.22, 0.25),
    new THREE.Vector2(0.24, 0.30),
    new THREE.Vector2(0.12, 0.48),
    new THREE.Vector2(0.08, 0.52),
    new THREE.Vector2(0.08, 0.62),
    new THREE.Vector2(0.10, 0.63),
    new THREE.Vector2(0.10, 0.68),
    new THREE.Vector2(0, 0.68),
  ];
  const geom = new THREE.LatheGeometry(points, 20);
  geom.center();
  return geom;
}

function createDetailedBagGeometry() {
  const geom = new THREE.DodecahedronGeometry(0.42, 1);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ripple = Math.sin(x * 5.0) * Math.cos(y * 4.0) * 0.06;
    pos.setXYZ(i, x * (0.9 + ripple), y * (1.3 + ripple * 1.5), z * (0.75 + ripple));
  }
  geom.computeVertexNormals();
  return geom;
}

// Low-res procedural texture for soda can
function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 48, 128, 32);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 54, 128, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('COLA', 28, 70);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

// ═══════════════════════════════════════════════════════════════
// 1. ORBITAL DEBRIS HALO (Encircles the planet in Earth's group)
// ═══════════════════════════════════════════════════════════════
export const FloatingDebris = ({
  pollution = 1.0,
  healProgress = 0,
}) => {
  const clutterGroupRef = useRef(null);
  const bottleInstRef = useRef(null);
  const bagInstRef    = useRef(null);
  const canInstRef    = useRef(null);
  const tireInstRef   = useRef(null);
  const crateInstRef  = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Shared low-poly geometries & materials
  const { bottleGeom, bagGeom, canGeom, tireGeom, crateGeom } = useMemo(() => ({
    bottleGeom: createWaterBottleGeometry(),
    bagGeom:    createShoppingBagGeometry(),
    canGeom:    createDentedCanGeometry(),
    tireGeom:   createTireGeometry(),
    crateGeom:  createCrateGeometry(),
  }), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);

  const { matBottle, matBag, matCan, matTire, matCrate } = useMemo(() => ({
    matBottle: new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.15,
      metalness: 0.10,
      transparent: true,
      opacity: 0.85,
    }),
    matBag: new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.60,
      transparent: true,
      opacity: 0.80,
      side: THREE.DoubleSide,
    }),
    matCan: new THREE.MeshStandardMaterial({
      map: canTexture,
      roughness: 0.35,
      metalness: 0.50,
    }),
    matTire: new THREE.MeshStandardMaterial({
      color: '#18181c',
      roughness: 0.92,
      metalness: 0.05,
    }),
    matCrate: new THREE.MeshStandardMaterial({
      color: '#1d4ed8',
      roughness: 0.45,
      metalness: 0.35,
    }),
  }), [canTexture]);

  // Color palettes for clutter variation
  const bottlePalette = useMemo(() => [
    new THREE.Color('#94a3b8'),
    new THREE.Color('#38bdf8'),
    new THREE.Color('#cbd5e1'),
  ], []);

  const bagPalette = useMemo(() => [
    new THREE.Color('#f1f5f9'),
    new THREE.Color('#e2e8f0'),
    new THREE.Color('#fed7aa'),
  ], []);

  // Generate orbital shell parameters (~70% clustered in orbital belt)
  const generateClutterData = (count, baseScale, minRadius, maxRadius, colorPalette = null) => {
    const list = [];
    let seed = 12345 + count * 19;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const isBelt = (i % 3) !== 0; // 67% in coherent belt
      let radius, inclination, nodeAngle;

      if (isBelt) {
        radius = minRadius + rand() * (maxRadius - minRadius) * 0.75;
        inclination = 0.30 + (rand() - 0.5) * 0.16; // Tight orbital plane
        nodeAngle = 0.40 + (rand() - 0.5) * 0.18;
      } else {
        radius = minRadius + rand() * (maxRadius - minRadius);
        inclination = (rand() - 0.5) * Math.PI * 0.75;
        nodeAngle = rand() * Math.PI * 2;
      }

      const angle = rand() * Math.PI * 2;
      const scale = baseScale * (0.80 + rand() * 0.45);

      const color = colorPalette
        ? colorPalette[Math.floor(rand() * colorPalette.length)]
        : null;

      list.push({
        radius,
        inclination,
        nodeAngle,
        angle,
        scale,
        color,
        rotX: rand() * Math.PI * 2,
        rotY: rand() * Math.PI * 2,
        rotZ: rand() * Math.PI * 2,
      });
    }
    return list;
  };

  const bottleData = useMemo(() => generateClutterData(COUNT_BOTTLES, SMALL_DEBRIS_SCALE * 0.95, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS, bottlePalette), [bottlePalette]);
  const bagData    = useMemo(() => generateClutterData(COUNT_BAGS,    SMALL_DEBRIS_SCALE * 1.05, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS, bagPalette), [bagPalette]);
  const canData    = useMemo(() => generateClutterData(COUNT_CANS,    SMALL_DEBRIS_SCALE * 0.90, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const tireData   = useMemo(() => generateClutterData(COUNT_TIRES,   SMALL_DEBRIS_SCALE * 0.90, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const crateData  = useMemo(() => generateClutterData(COUNT_CRATES,  SMALL_DEBRIS_SCALE * 0.90, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);

  // Compute 3D position in Earth's local coordinate system with central exclusion zone
  const computeOrbitalPos = (item) => {
    const a = item.angle;
    const r = item.radius;

    const x0 = r * Math.cos(a);
    const z0 = r * Math.sin(a);

    const x1 = x0;
    const y1 = -z0 * Math.sin(item.inclination);
    const z1 = z0 * Math.cos(item.inclination);

    const cosN = Math.cos(item.nodeAngle);
    const sinN = Math.sin(item.nodeAngle);

    let x = x1 * cosN - z1 * sinN;
    let y = y1;
    let z = x1 * sinN + z1 * cosN;

    // Softly bias items away from front-center line of sight so text & button stay legible
    const centerDist = Math.hypot(x, y);
    if (z > 0.05 && centerDist < 0.45) {
      const push = 0.52 / Math.max(0.01, centerDist);
      x *= push;
      y *= push;
    }

    return { x, y, z };
  };

  // Populate instance matrices once at mount time
  const initMesh = (mesh, data) => {
    if (!mesh || !data) return;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const pos = computeOrbitalPos(item);

      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
      if (item.color) {
        mesh.setColorAt(i, item.color);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };

  useEffect(() => {
    initMesh(bottleInstRef.current, bottleData);
    initMesh(bagInstRef.current,    bagData);
    initMesh(canInstRef.current,    canData);
    initMesh(tireInstRef.current,   tireData);
    initMesh(crateInstRef.current,  crateData);
  }, [bottleData, bagData, canData, tireData, crateData]);

  const effectivePollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  useFrame((_, delta) => {
    // Serene orbital rotation on the entire group directly (0 CPU per-instance math)
    if (clutterGroupRef.current) {
      clutterGroupRef.current.rotation.y += delta * 0.025;
      const targetScale = Math.max(0, effectivePollution);
      clutterGroupRef.current.scale.setScalar(targetScale);
    }
  });

  return (
    <group ref={clutterGroupRef} visible={effectivePollution > 0.01}>
      {/* 1. Transparent Water Bottles */}
      <instancedMesh
        ref={bottleInstRef}
        args={[bottleGeom, matBottle, COUNT_BOTTLES]}
        frustumCulled={true}
      />

      {/* 2. Translucent Crumpled Bags */}
      <instancedMesh
        ref={bagInstRef}
        args={[bagGeom, matBag, COUNT_BAGS]}
        frustumCulled={true}
      />

      {/* 3. Dented Soda Cans */}
      <instancedMesh
        ref={canInstRef}
        args={[canGeom, matCan, COUNT_CANS]}
        frustumCulled={true}
      />

      {/* 4. Rubber Tires */}
      <instancedMesh
        ref={tireInstRef}
        args={[tireGeom, matTire, COUNT_TIRES]}
        frustumCulled={true}
      />

      {/* 5. Industrial Cargo Crates */}
      <instancedMesh
        ref={crateInstRef}
        args={[crateGeom, matCrate, COUNT_CRATES]}
        frustumCulled={true}
      />
    </group>
  );
};

// ═══════════════════════════════════════════════════════════════
// 2. CINEMATIC FOREGROUND DEBRIS (Frames Viewport on Final Beat)
// ═══════════════════════════════════════════════════════════════
export const ForegroundDebris = ({
  pollution = 1.0,
  healProgress = 0,
  isFinalBeat = false,
}) => {
  const groupRef = useRef(null);
  const currentScaleRef = useRef(0);
  const bottleRef = useRef(null);
  const bagRef = useRef(null);
  const tireRef = useRef(null);
  const canRef = useRef(null);
  const crateRef = useRef(null);
  const smallBottleRef = useRef(null);
  const cartonRef = useRef(null);

  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = size.width < 768 || aspect < 1.05;

  const {
    detailBottleGeom,
    detailBagGeom,
    tireGeom,
    canGeom,
    crateGeom,
    cartonGeom,
  } = useMemo(() => ({
    detailBottleGeom: createDetailedBottleGeometry(),
    detailBagGeom:    createDetailedBagGeometry(),
    tireGeom:         createTireGeometry(),
    canGeom:          createDentedCanGeometry(),
    crateGeom:        createCrateGeometry(),
    cartonGeom:       new THREE.BoxGeometry(0.48, 0.62, 0.42),
  }), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);

  const materials = useMemo(() => ({
    bottle: new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.12,
      metalness: 0.20,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
    bag: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.60,
      metalness: 0.05,
      transparent: true,
      opacity: 0.70,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    tire: new THREE.MeshStandardMaterial({
      color: '#151518',
      roughness: 0.94,
      metalness: 0.05,
    }),
    can: new THREE.MeshStandardMaterial({
      map: canTexture,
      roughness: 0.32,
      metalness: 0.60,
    }),
    crate: new THREE.MeshStandardMaterial({
      color: '#1d4ed8', // Iconic blue cargo container
      roughness: 0.45,
      metalness: 0.35,
    }),
    carton: new THREE.MeshStandardMaterial({
      color: '#78350f', // Industrial brown carton box
      roughness: 0.75,
      metalness: 0.05,
    }),
  }), [canTexture]);

  const effectivePollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  // Responsive layout multiplier based on screen aspect ratio
  const spreadX = isMobile ? Math.max(0.65, aspect / 1.1) : 1.0;
  const spreadY = isMobile ? 0.85 : 1.0;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Smoothly scale in when arriving at final beat, scale out on other beats
    const targetScale = isFinalBeat ? Math.max(0, effectivePollution) : 0.0;
    currentScaleRef.current = THREE.MathUtils.lerp(
      currentScaleRef.current,
      targetScale,
      Math.min(delta * 6.0, 1.0)
    );

    const s = currentScaleRef.current;
    groupRef.current.scale.set(s, s, s);
    groupRef.current.visible = s > 0.01;

    if (s <= 0.01) return;

    // Gentle space drift and rotation for foreground debris
    if (bottleRef.current) {
      bottleRef.current.position.y = (-0.68 * spreadY) + Math.sin(t * 0.7) * 0.015;
      bottleRef.current.rotation.z += delta * 0.025;
      bottleRef.current.rotation.x += delta * 0.015;
    }
    if (bagRef.current) {
      bagRef.current.position.y = (0.78 * spreadY) + Math.cos(t * 0.6) * 0.018;
      bagRef.current.rotation.y += delta * 0.02;
    }
    if (tireRef.current) {
      tireRef.current.position.y = (-0.46 * spreadY) + Math.sin(t * 0.5 + 1.0) * 0.012;
      tireRef.current.rotation.x += delta * 0.035;
      tireRef.current.rotation.y += delta * 0.02;
    }
    if (canRef.current) {
      canRef.current.position.y = (-0.76 * spreadY) + Math.cos(t * 0.8 + 2.0) * 0.016;
      canRef.current.rotation.y += delta * 0.045;
    }
    if (crateRef.current) {
      crateRef.current.rotation.y += delta * 0.015;
      crateRef.current.rotation.z += delta * 0.01;
    }
    if (smallBottleRef.current) {
      smallBottleRef.current.rotation.y += delta * 0.03;
    }
    if (cartonRef.current) {
      cartonRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* 1. Large Translucent Water Bottle (Bottom-Left foreground, angled upwards) */}
      <mesh
        ref={bottleRef}
        geometry={detailBottleGeom}
        material={materials.bottle}
        position={[-1.28 * spreadX, -0.68 * spreadY, 0.65]}
        rotation={[0.35, 0.45, -0.60]}
        scale={0.38}
      />

      {/* 2. Large Crumpled Plastic Bag (Top-Right foreground) */}
      <mesh
        ref={bagRef}
        geometry={detailBagGeom}
        material={materials.bag}
        position={[1.32 * spreadX, 0.78 * spreadY, 0.68]}
        rotation={[-0.25, 0.40, 0.45]}
        scale={0.40}
      />

      {/* 3. Black Rubber Tire (Lower-Right midground/foreground) */}
      <mesh
        ref={tireRef}
        geometry={tireGeom}
        material={materials.tire}
        position={[1.16 * spreadX, -0.46 * spreadY, 0.75]}
        rotation={[1.20, 0.25, -0.45]}
        scale={0.32}
      />

      {/* 4. Dented Soda Can (Bottom-Right corner) */}
      <mesh
        ref={canRef}
        geometry={canGeom}
        material={materials.can}
        position={[1.26 * spreadX, -0.76 * spreadY, 0.85]}
        rotation={[0.75, -0.35, 0.55]}
        scale={0.26}
      />

      {/* 5. Blue Industrial Shipping Crate (Mid-Right space) */}
      <mesh
        ref={crateRef}
        geometry={crateGeom}
        material={materials.crate}
        position={[0.96 * spreadX, -0.32 * spreadY, 0.52]}
        rotation={[0.22, -0.50, 0.35]}
        scale={0.18}
      />

      {/* 6. Smaller Tilted Water Bottle (Mid-Left space) */}
      <mesh
        ref={smallBottleRef}
        geometry={detailBottleGeom}
        material={materials.bottle}
        position={[-1.12 * spreadX, -0.15 * spreadY, 0.58]}
        rotation={[-0.40, 0.55, 0.25]}
        scale={0.18}
      />

      {/* 7. Industrial Brown Carton Box (Lower-Mid space) */}
      <mesh
        ref={cartonRef}
        geometry={cartonGeom}
        material={materials.carton}
        position={[0.72 * spreadX, -0.66 * spreadY, 0.58]}
        rotation={[0.45, 0.20, -0.30]}
        scale={0.16}
      />
    </group>
  );
};

export default FloatingDebris;
