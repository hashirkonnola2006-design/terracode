import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Floating Debris & Space Trash Field)
// ═══════════════════════════════════════════════════════════════
export const ORBIT_BOTTLES_COUNT = 14;
export const ORBIT_BAGS_COUNT    = 14;
export const ORBIT_CANS_COUNT    = 18;
export const ORBIT_TIRES_COUNT   = 8;
export const ORBIT_CRATES_COUNT  = 8;
export const ORBIT_SHARDS_COUNT  = 26;

export const ORBIT_MIN_RADIUS = 1.45;
export const ORBIT_MAX_RADIUS = 2.95;
export const GLOBAL_DRIFT_SPEED = 0.045;

function createWaterBottleGeometry() {
  const points = [];
  points.push(new THREE.Vector2(0.0, 0.0));
  points.push(new THREE.Vector2(0.36, 0.04));
  points.push(new THREE.Vector2(0.40, 0.14));

  for (let i = 0; i < 4; i++) {
    const y = 0.26 + i * 0.22;
    points.push(new THREE.Vector2(0.42, y));
    points.push(new THREE.Vector2(0.37, y + 0.06));
    points.push(new THREE.Vector2(0.42, y + 0.12));
  }

  points.push(new THREE.Vector2(0.40, 1.25));
  points.push(new THREE.Vector2(0.24, 1.48));
  points.push(new THREE.Vector2(0.16, 1.62));
  points.push(new THREE.Vector2(0.16, 1.82));
  points.push(new THREE.Vector2(0.18, 1.84));
  points.push(new THREE.Vector2(0.18, 1.92));
  points.push(new THREE.Vector2(0.0, 1.92));

  const geom = new THREE.LatheGeometry(points, 24);
  geom.center();
  return geom;
}

function createShoppingBagGeometry() {
  const geom = new THREE.PlaneGeometry(1.1, 1.45, 10, 12);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const crinkle1 = Math.sin(x * 6.0 + y * 7.5) * 0.10;
    const crinkle2 = Math.cos(x * 12.0 - y * 9.0) * 0.06;
    const bulge = Math.cos(x * 2.8) * Math.sin(Math.max(0.0, (y + 0.6) / 1.1) * Math.PI) * 0.18;
    pos.setZ(i, crinkle1 + crinkle2 + bulge);
    if (y > 0.25) {
      pos.setX(i, x * (1.0 - (y - 0.25) * 0.45));
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function createCrateGeometry() {
  return new THREE.BoxGeometry(0.75, 0.55, 0.85);
}

function createTireGeometry() {
  return new THREE.TorusGeometry(0.38, 0.15, 12, 24);
}

function createFoilShardGeometry() {
  const geom = new THREE.DodecahedronGeometry(0.28, 0);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i, pos.getX(i) * 0.5, pos.getY(i) * 0.25, pos.getZ(i) * 0.5);
  }
  geom.computeVertexNormals();
  return geom;
}

function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d50000';
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.bezierCurveTo(150, 180, 350, 320, 512, 250);
  ctx.lineTo(512, 300);
  ctx.bezierCurveTo(350, 370, 150, 230, 0, 290);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const FloatingDebris = ({ mousePos = { x: 0, y: 0 }, healProgress = 0 }) => {
  // Hero prominent objects matching Image 1
  const heroBottleRef = useRef(null);
  const heroBagRef    = useRef(null);
  const heroCanRef    = useRef(null);
  const heroCrateRef  = useRef(null);
  const heroTireRef   = useRef(null);
  const heroFgScrapRef= useRef(null);

  // Instanced meshes for orbital field
  const bottleInstRef = useRef(null);
  const bagInstRef    = useRef(null);
  const canInstRef    = useRef(null);
  const tireInstRef   = useRef(null);
  const crateInstRef  = useRef(null);
  const shardInstRef  = useRef(null);

  // Geometries
  const bottleGeom = useMemo(() => createWaterBottleGeometry(), []);
  const bagGeom    = useMemo(() => createShoppingBagGeometry(), []);
  const crateGeom  = useMemo(() => createCrateGeometry(), []);
  const tireGeom   = useMemo(() => createTireGeometry(), []);
  const shardGeom  = useMemo(() => createFoilShardGeometry(), []);
  const capGeom    = useMemo(() => new THREE.CylinderGeometry(0.19, 0.19, 0.15, 20), []);

  const canBodyGeom = useMemo(() => new THREE.CylinderGeometry(0.28, 0.28, 0.85, 24), []);
  const canRimGeom  = useMemo(() => new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24), []);

  const canTexture = useMemo(() => createSodaCanTexture(), []);

  // Materials
  const matTranslucentBottle = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0e2235',
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.FrontSide,
    depthWrite: false,
  }), []);

  const matBlueCap = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1565c0',
    roughness: 0.32,
    metalness: 0.08,
  }), []);

  const matWhitePlasticBag = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#f8fafd',
    transparent: true,
    opacity: 0.48,
    roughness: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const matSodaCanRed = useMemo(() => new THREE.MeshStandardMaterial({
    map: canTexture,
    metalness: 0.88,
    roughness: 0.22,
  }), [canTexture]);

  const matSilverMetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#dce0e6',
    metalness: 0.95,
    roughness: 0.15,
  }), []);

  const matRubberTire = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#161619',
    roughness: 0.88,
    metalness: 0.06,
  }), []);

  const matBlueCrate = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1565c0',
    roughness: 0.50,
    metalness: 0.10,
  }), []);

  const matFoilShard = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#a8b0bc',
    roughness: 0.28,
    metalness: 0.75,
  }), []);

  const matFgScrap = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#463c32',
    roughness: 0.75,
    metalness: 0.35,
  }), []);

  // Precompute orbital trajectories
  const generateOrbitList = (count, baseScale, minR, maxR) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const radius = minR + Math.random() * (maxR - minR);
      const theta = Math.random() * Math.PI * 2;
      const speed = (0.025 + Math.random() * 0.05) * (i % 2 === 0 ? 1 : -1) * GLOBAL_DRIFT_SPEED;
      const planeY = (Math.random() - 0.5) * 1.8;
      const planeZOffset = (Math.random() - 0.5) * 0.8;

      list.push({
        radius,
        theta,
        speed,
        planeY,
        planeZOffset,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.5,
        rotSpeedY: (Math.random() - 0.5) * 0.5,
        rotSpeedZ: (Math.random() - 0.5) * 0.5,
        scale: baseScale * (0.75 + Math.random() * 0.5),
        threshold: 0.20 + Math.random() * 0.65, // Staggered clearing
      });
    }
    return list;
  };

  const bottleData = useMemo(() => generateOrbitList(ORBIT_BOTTLES_COUNT, 0.052, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const bagData    = useMemo(() => generateOrbitList(ORBIT_BAGS_COUNT,    0.062, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const canData    = useMemo(() => generateOrbitList(ORBIT_CANS_COUNT,    0.046, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const tireData   = useMemo(() => generateOrbitList(ORBIT_TIRES_COUNT,   0.048, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const crateData  = useMemo(() => generateOrbitList(ORBIT_CRATES_COUNT,  0.052, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const shardData  = useMemo(() => generateOrbitList(ORBIT_SHARDS_COUNT,  0.024, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const initMeshMatrices = (mesh, data) => {
    if (!mesh || !data) return;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const x = Math.cos(item.theta) * item.radius;
      const z = Math.sin(item.theta) * item.radius + item.planeZOffset;
      const y = item.planeY;
      dummy.position.set(x, y, z);
      dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const clampedDelta = Math.min(delta, 0.05);

    // Floating trash dissolves & scales down as heal approaches 1.0
    const heroTrashScale = Math.max(0.0, 1.0 - smoothstep(0.30, 0.82, healProgress));

    // 1. Hero Water Bottle (Bottom-Left Foreground, scaled to frame without obscuring Earth)
    if (heroBottleRef.current) {
      const px = -2.05 + mousePos.x * 0.12;
      const py = -1.05 + mousePos.y * 0.08;
      heroBottleRef.current.position.set(px, py, 1.15);
      heroBottleRef.current.rotation.x = 0.45 + Math.sin(t * 0.28) * 0.06;
      heroBottleRef.current.rotation.y = 0.48 + Math.cos(t * 0.22) * 0.05;
      heroBottleRef.current.rotation.z = -0.68 + Math.sin(t * 0.32) * 0.04;
      const s = 0.58 * heroTrashScale;
      heroBottleRef.current.scale.set(s, s, s);
    }

    // 2. Hero Plastic Shopping Bag (Mid-Right Edge)
    if (heroBagRef.current) {
      const px = 1.95 + mousePos.x * 0.10;
      const py = 0.15 + mousePos.y * 0.08;
      heroBagRef.current.position.set(px, py, 0.40);
      heroBagRef.current.rotation.x = 0.35 + Math.sin(t * 0.35) * 0.12;
      heroBagRef.current.rotation.y = -0.40 + t * 0.10;
      heroBagRef.current.rotation.z = 0.25 + Math.cos(t * 0.25) * 0.10;
      const s = 0.28 * heroTrashScale;
      heroBagRef.current.scale.set(s, s, s);
    }

    // 3. Hero Red Soda Can (Lower-Right)
    if (heroCanRef.current) {
      const px = 1.68 + mousePos.x * 0.10;
      const py = -1.08 + mousePos.y * 0.08;
      heroCanRef.current.position.set(px, py, 0.55);
      heroCanRef.current.rotation.x = 0.45 + Math.sin(t * 0.25) * 0.08;
      heroCanRef.current.rotation.y = 0.65 + t * 0.18;
      heroCanRef.current.rotation.z = -0.55;
      const s = 0.20 * heroTrashScale;
      heroCanRef.current.scale.set(s, s, s);
    }

    // 4. Hero Blue Crate (Upper-Left Corner)
    if (heroCrateRef.current) {
      const px = -1.75 + mousePos.x * 0.10;
      const py = 1.15 + mousePos.y * 0.08;
      heroCrateRef.current.position.set(px, py, 0.30);
      heroCrateRef.current.rotation.x = -0.3 + Math.sin(t * 0.20) * 0.10;
      heroCrateRef.current.rotation.y = t * 0.16;
      heroCrateRef.current.rotation.z = 0.35;
      const s = 0.15 * heroTrashScale;
      heroCrateRef.current.scale.set(s, s, s);
    }

    // 5. Hero Tire (Upper-Right Corner)
    if (heroTireRef.current) {
      const px = 1.65 + mousePos.x * 0.08;
      const py = 1.10 + mousePos.y * 0.06;
      heroTireRef.current.position.set(px, py, -0.20);
      heroTireRef.current.rotation.x = t * 0.24;
      heroTireRef.current.rotation.y = t * 0.18;
      const s = 0.15 * heroTrashScale;
      heroTireRef.current.scale.set(s, s, s);
    }

    // 6. Hero Foreground Scrap Container (Lower-Right Edge)
    if (heroFgScrapRef.current) {
      const px = 2.15 + mousePos.x * 0.10;
      const py = -1.25 + mousePos.y * 0.08;
      heroFgScrapRef.current.position.set(px, py, 1.10);
      heroFgScrapRef.current.rotation.x = 0.4 + Math.sin(t * 0.18) * 0.06;
      heroFgScrapRef.current.rotation.y = -0.6 + Math.cos(t * 0.15) * 0.06;
      const s = 0.24 * heroTrashScale;
      heroFgScrapRef.current.scale.set(s, s * 0.75, s);
    }

    // Animate orbital swarm pieces with heal decay
    const updateInstances = (mesh, data) => {
      if (!mesh) return;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        item.theta += item.speed * clampedDelta * 60;
        item.rotX += item.rotSpeedX * clampedDelta;
        item.rotY += item.rotSpeedY * clampedDelta;
        item.rotZ += item.rotSpeedZ * clampedDelta;

        const x = Math.cos(item.theta) * item.radius;
        const z = Math.sin(item.theta) * item.radius + item.planeZOffset;
        const y = item.planeY + Math.sin(item.theta * 2.0) * 0.10;

        // Individual dissolution
        const localDissolve = Math.max(0.0, 1.0 - smoothstep(item.threshold * 0.45, item.threshold * 0.45 + 0.38, healProgress));
        const currentScale = healProgress >= 0.88 ? 0.0 : item.scale * localDissolve;

        dummy.position.set(x, y, z);
        dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateInstances(bottleInstRef.current, bottleData);
    updateInstances(bagInstRef.current, bagData);
    updateInstances(canInstRef.current, canData);
    updateInstances(tireInstRef.current, tireData);
    updateInstances(crateInstRef.current, crateData);
    updateInstances(shardInstRef.current, shardData);
  });

  function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  return (
    <group visible={healProgress < 0.99}>
      {/* ── 1. Hero Plastic Water Bottle (Bottom-Left Foreground) ── */}
      <group ref={heroBottleRef} scale={1.05}>
        <mesh geometry={bottleGeom} material={matTranslucentBottle} />
        <mesh
          geometry={capGeom}
          material={matBlueCap}
          position={[0, 0.94, 0]}
        />
      </group>

      {/* ── 2. Hero Crumpled Plastic Bag (Mid-Right) ── */}
      <mesh
        ref={heroBagRef}
        geometry={bagGeom}
        material={matWhitePlasticBag}
        scale={0.46}
      />

      {/* ── 3. Hero Red Soda Can (Lower-Right) ── */}
      <group ref={heroCanRef} scale={0.30}>
        <mesh geometry={canBodyGeom} material={matSodaCanRed} />
        <mesh
          geometry={canRimGeom}
          material={matSilverMetal}
          position={[0, 0.43, 0]}
        />
        <mesh
          geometry={canRimGeom}
          material={matSilverMetal}
          position={[0, -0.43, 0]}
        />
      </group>

      {/* ── 4. Hero Blue Crate (Upper-Left) ── */}
      <mesh
        ref={heroCrateRef}
        geometry={crateGeom}
        material={matBlueCrate}
        scale={0.22}
      />

      {/* ── 5. Hero Tire (Upper-Right) ── */}
      <mesh
        ref={heroTireRef}
        geometry={tireGeom}
        material={matRubberTire}
        scale={0.22}
      />

      {/* ── 6. Hero Foreground Scrap Container (Lower-Right) ── */}
      <mesh
        ref={heroFgScrapRef}
        geometry={crateGeom}
        material={matFgScrap}
        scale={[0.42, 0.32, 0.42]}
      />

      {/* ── Orbital Swarm Field (Synchronously Initialized) ── */}
      <instancedMesh
        ref={(m) => {
          if (m) {
            bottleInstRef.current = m;
            initMeshMatrices(m, bottleData);
          }
        }}
        args={[bottleGeom, matTranslucentBottle, ORBIT_BOTTLES_COUNT]}
      />
      <instancedMesh
        ref={(m) => {
          if (m) {
            bagInstRef.current = m;
            initMeshMatrices(m, bagData);
          }
        }}
        args={[bagGeom, matWhitePlasticBag, ORBIT_BAGS_COUNT]}
      />
      <instancedMesh
        ref={(m) => {
          if (m) {
            canInstRef.current = m;
            initMeshMatrices(m, canData);
          }
        }}
        args={[canBodyGeom, matSodaCanRed, ORBIT_CANS_COUNT]}
      />
      <instancedMesh
        ref={(m) => {
          if (m) {
            tireInstRef.current = m;
            initMeshMatrices(m, tireData);
          }
        }}
        args={[tireGeom, matRubberTire, ORBIT_TIRES_COUNT]}
      />
      <instancedMesh
        ref={(m) => {
          if (m) {
            crateInstRef.current = m;
            initMeshMatrices(m, crateData);
          }
        }}
        args={[crateGeom, matBlueCrate, ORBIT_CRATES_COUNT]}
      />
      <instancedMesh
        ref={(m) => {
          if (m) {
            shardInstRef.current = m;
            initMeshMatrices(m, shardData);
          }
        }}
        args={[shardGeom, matFoilShard, ORBIT_SHARDS_COUNT]}
      />
    </group>
  );
};
