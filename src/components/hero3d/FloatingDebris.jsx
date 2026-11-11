import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createPlasticBottleGeometry,
  createSodaCanGeometry,
  createCoffeeCupGeometry,
  createCrumpledBagGeometry,
  createMilkJugGeometry,
  createRubberTireGeometry,
  createSodaCanTexture,
  createCoffeeCupTexture,
} from '../../utils/wasteGeometries';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Cinematic Clutter of Floating Wastes)
// ═══════════════════════════════════════════════════════════════
export const SMALL_DEBRIS_SCALE = 0.058;  // Crisp visible size relative to Earth
export const ORBIT_MIN_RADIUS   = 1.08;   // Orbit skimming just above atmosphere
export const ORBIT_MAX_RADIUS   = 1.62;   // Outer edge of orbital debris halo

// Optimized instance counts across 5 distinct realistic waste types
export const COUNT_BOTTLES = 65; // Disposable plastic water bottles
export const COUNT_BAGS    = 65; // Crumpled plastic grocery bags
export const COUNT_CANS    = 50; // Dented aluminum soda cans
export const COUNT_TIRES   = 25; // Discarded rubber tires
export const COUNT_CUPS    = 35; // Takeout coffee cups with sipping lids

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
  const cupInstRef    = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Shared realistic waste geometries
  const { bottleGeom, bagGeom, canGeom, tireGeom, cupGeom } = useMemo(() => ({
    bottleGeom: createPlasticBottleGeometry(false),
    bagGeom:    createCrumpledBagGeometry(false),
    canGeom:    createSodaCanGeometry(false),
    tireGeom:   createRubberTireGeometry(),
    cupGeom:    createCoffeeCupGeometry(false),
  }), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);
  const cupTexture = useMemo(() => createCoffeeCupTexture(), []);

  // Realistic materials tailored to waste types
  const { matBottle, matBag, matCan, matTire, matCup } = useMemo(() => ({
    matBottle: new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.18,
      metalness: 0.15,
      transparent: true,
      opacity: 0.78,
    }),
    matBag: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.65,
      metalness: 0.05,
      transparent: true,
      opacity: 0.80,
      side: THREE.DoubleSide,
    }),
    matCan: new THREE.MeshStandardMaterial({
      map: canTexture,
      roughness: 0.32,
      metalness: 0.55,
    }),
    matTire: new THREE.MeshStandardMaterial({
      color: '#18181c',
      roughness: 0.94,
      metalness: 0.05,
    }),
    matCup: new THREE.MeshStandardMaterial({
      map: cupTexture,
      roughness: 0.70,
      metalness: 0.10,
    }),
  }), [canTexture, cupTexture]);

  // Color palettes for realistic waste variety (soft water tints, not solid primary blocks)
  const bottlePalette = useMemo(() => [
    new THREE.Color('#cbd5e1'), // Clear PET
    new THREE.Color('#93c5fd'), // Soft blue mineral water bottle
    new THREE.Color('#a7f3d0'), // Soft green soda bottle
    new THREE.Color('#e2e8f0'), // Clear plastic
  ], []);

  const bagPalette = useMemo(() => [
    new THREE.Color('#f8fafc'), // White plastic grocery bag
    new THREE.Color('#fef08a'), // Yellow shopping bag
    new THREE.Color('#bae6fd'), // Light blue store bag
    new THREE.Color('#fed7aa'), // Light beige market bag
  ], []);

  const cupPalette = useMemo(() => [
    new THREE.Color('#ffffff'),
    new THREE.Color('#fed7aa'), // Kraft sleeve
    new THREE.Color('#e0f2fe'),
  ], []);

  // Generate orbital shell parameters (~67% clustered in orbital belt)
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
  const cupData    = useMemo(() => generateClutterData(COUNT_CUPS,    SMALL_DEBRIS_SCALE * 0.90, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS, cupPalette), [cupPalette]);

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
    initMesh(cupInstRef.current,    cupData);
  }, [bottleData, bagData, canData, tireData, cupData]);

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
      {/* 1. Realistic Translucent Water Bottles */}
      <instancedMesh
        ref={bottleInstRef}
        args={[bottleGeom, matBottle, COUNT_BOTTLES]}
        frustumCulled={true}
      />

      {/* 2. Crumpled Plastic Grocery Bags */}
      <instancedMesh
        ref={bagInstRef}
        args={[bagGeom, matBag, COUNT_BAGS]}
        frustumCulled={true}
      />

      {/* 3. Dented Soda Cans with Cola Labels */}
      <instancedMesh
        ref={canInstRef}
        args={[canGeom, matCan, COUNT_CANS]}
        frustumCulled={true}
      />

      {/* 4. Rubber Vehicle Tires */}
      <instancedMesh
        ref={tireInstRef}
        args={[tireGeom, matTire, COUNT_TIRES]}
        frustumCulled={true}
      />

      {/* 5. Disposable Takeout Coffee Cups with Lids */}
      <instancedMesh
        ref={cupInstRef}
        args={[cupGeom, matCup, COUNT_CUPS]}
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
  const cupRef = useRef(null);
  const smallBottleRef = useRef(null);
  const jugRef = useRef(null);

  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = size.width < 768 || aspect < 1.05;

  const {
    detailBottleGeom,
    detailBagGeom,
    tireGeom,
    canGeom,
    cupGeom,
    jugGeom,
  } = useMemo(() => ({
    detailBottleGeom: createPlasticBottleGeometry(true),
    detailBagGeom:    createCrumpledBagGeometry(true),
    tireGeom:         createRubberTireGeometry(),
    canGeom:          createSodaCanGeometry(true),
    cupGeom:          createCoffeeCupGeometry(true),
    jugGeom:          createMilkJugGeometry(),
  }), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);
  const cupTexture = useMemo(() => createCoffeeCupTexture(), []);

  const materials = useMemo(() => ({
    bottle: new THREE.MeshStandardMaterial({
      color: '#93c5fd', // Translucent blue water bottle
      roughness: 0.15,
      metalness: 0.20,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
    bag: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.60,
      metalness: 0.05,
      transparent: true,
      opacity: 0.75,
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
    cup: new THREE.MeshStandardMaterial({
      map: cupTexture,
      roughness: 0.65,
      metalness: 0.10,
    }),
    jug: new THREE.MeshStandardMaterial({
      color: '#f1f5f9', // Milky white HDPE detergent/milk jug
      roughness: 0.45,
      metalness: 0.08,
    }),
  }), [canTexture, cupTexture]);

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
    if (cupRef.current) {
      cupRef.current.rotation.y += delta * 0.025;
      cupRef.current.rotation.z += delta * 0.015;
    }
    if (smallBottleRef.current) {
      smallBottleRef.current.rotation.y += delta * 0.03;
    }
    if (jugRef.current) {
      jugRef.current.rotation.x += delta * 0.02;
      jugRef.current.rotation.y += delta * 0.015;
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

      {/* 5. Takeout Coffee Cup with Sipping Lid (Mid-Right space - replaces the blue box!) */}
      <mesh
        ref={cupRef}
        geometry={cupGeom}
        material={materials.cup}
        position={[0.96 * spreadX, -0.32 * spreadY, 0.52]}
        rotation={[0.42, -0.35, 0.25]}
        scale={0.30}
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

      {/* 7. Molded Plastic Milk / Detergent Jug with Handle (Lower-Mid space - replaces the brown box!) */}
      <mesh
        ref={jugRef}
        geometry={jugGeom}
        material={materials.jug}
        position={[0.72 * spreadX, -0.66 * spreadY, 0.58]}
        rotation={[0.35, 0.40, -0.20]}
        scale={0.28}
      />
    </group>
  );
};

export default FloatingDebris;
