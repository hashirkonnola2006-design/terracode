import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Cinematic Clutter of Floating Wastes)
// ═══════════════════════════════════════════════════════════════
export const SMALL_DEBRIS_SCALE = 0.055;  // Crisp visible size relative to Earth
export const ORBIT_MIN_RADIUS   = 1.06;   // Orbit skimming just above atmosphere
export const ORBIT_MAX_RADIUS   = 1.55;   // Outer edge of orbital debris halo

// Optimized instance counts (Total 180 items across 3 draw calls for locked 60 FPS)
export const COUNT_BOTTLES = 55; // Water bottles
export const COUNT_BAGS    = 75; // Crumpled plastic bags
export const COUNT_CANS    = 50; // Soda cans

// ── 1. LOW-POLY GEOMETRIES (Optimized for performance) ──
function createWaterBottleGeometry() {
  const points = [];
  points.push(new THREE.Vector2(0.0, 0.0));
  points.push(new THREE.Vector2(0.28, 0.04));
  points.push(new THREE.Vector2(0.32, 0.12));
  points.push(new THREE.Vector2(0.33, 1.15));
  points.push(new THREE.Vector2(0.18, 1.38));
  points.push(new THREE.Vector2(0.13, 1.50));
  points.push(new THREE.Vector2(0.15, 1.72));
  points.push(new THREE.Vector2(0.0, 1.72));

  const geom = new THREE.LatheGeometry(points, 10);
  geom.center();
  return geom;
}

function createShoppingBagGeometry() {
  const geom = new THREE.CylinderGeometry(0.26, 0.36, 0.95, 8, 4, true);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const noise = Math.sin(y * 5.0 + x * 3.0) * 0.05;
    pos.setXYZ(i, x * (1.0 + noise), y, z * (1.0 + noise));
  }
  geom.computeVertexNormals();
  geom.center();
  return geom;
}

function createDentedCanGeometry() {
  const geom = new THREE.CylinderGeometry(0.24, 0.24, 0.65, 10);
  geom.center();
  return geom;
}

// Low-res procedural texture for soda can
function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 64, 8);
  ctx.fillRect(0, 56, 64, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export const FloatingDebris = ({
  pollution = 1.0,
  healProgress = 0,
  isFinalBeat = false,
}) => {
  const clutterGroupRef = useRef(null);
  const bottleInstRef = useRef(null);
  const bagInstRef    = useRef(null);
  const canInstRef    = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Shared low-poly geometries & materials
  const { bottleGeom, bagGeom, canGeom } = useMemo(() => ({
    bottleGeom: createWaterBottleGeometry(),
    bagGeom:    createShoppingBagGeometry(),
    canGeom:    createDentedCanGeometry(),
  }), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);

  const { matBottle, matBag, matCan } = useMemo(() => ({
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
    let seed = 12345 + count * 17;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      const isBelt = (i % 3) !== 0; // 67% in coherent belt
      let radius, inclination, nodeAngle;

      if (isBelt) {
        radius = minRadius + rand() * (maxRadius - minRadius) * 0.75;
        inclination = 0.30 + (rand() - 0.5) * 0.14; // Tight orbital plane
        nodeAngle = 0.40 + (rand() - 0.5) * 0.16;
      } else {
        radius = minRadius + rand() * (maxRadius - minRadius);
        inclination = (rand() - 0.5) * Math.PI * 0.65;
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

  // Compute 3D position in Earth's local coordinate system
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

    const x = x1 * cosN - z1 * sinN;
    const y = y1;
    const z = x1 * sinN + z1 * cosN;

    return { x, y, z };
  };

  // Populate instance matrices once at mount time (CPU runs this ONCE, not per frame!)
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
  }, [bottleData, bagData, canData]);

  // Update scale ONLY when pollution / finalBeat changes
  const effectivePollution = pollution !== undefined ? pollution : 1.0 - healProgress;
  const lastPollutionRef = useRef(-1);
  const lastFinalBeatRef = useRef(null);

  useFrame((_, delta) => {
    // 1. Serene orbital rotation on the entire group directly (0 CPU matrix recalculations!)
    if (clutterGroupRef.current) {
      clutterGroupRef.current.rotation.y += delta * 0.025;

      // When in final beat, hide or clear center debris so headline & button are completely clean
      const targetScale = isFinalBeat ? 0.0 : Math.max(0, effectivePollution);
      clutterGroupRef.current.scale.setScalar(targetScale);
    }
  });

  return (
    <group ref={clutterGroupRef} visible={effectivePollution > 0.01 && !isFinalBeat}>
      {/* 1. Small Transparent Water Bottles */}
      <instancedMesh
        ref={bottleInstRef}
        args={[bottleGeom, matBottle, COUNT_BOTTLES]}
        frustumCulled={true}
      />

      {/* 2. Small Translucent Crumpled Bags */}
      <instancedMesh
        ref={bagInstRef}
        args={[bagGeom, matBag, COUNT_BAGS]}
        frustumCulled={true}
      />

      {/* 3. Small Dented Soda Cans */}
      <instancedMesh
        ref={canInstRef}
        args={[canGeom, matCan, COUNT_CANS]}
        frustumCulled={true}
      />
    </group>
  );
};

export default FloatingDebris;
