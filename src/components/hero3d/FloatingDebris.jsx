import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Cinematic Clutter of Floating Wastes)
// ═══════════════════════════════════════════════════════════════
export const SMALL_DEBRIS_SCALE = 0.060;  // 1.5 - 2x current size for damaged Earth look
export const ORBIT_MIN_RADIUS   = 0.85;   // Skimming above atmosphere
export const ORBIT_MAX_RADIUS   = 1.65;   // Outer edge of orbital debris halo
export const DRIFT_SPEED_MULT   = 0.035;  // Slow, serene orbital drift speed

// Clutter item counts (~2x current counts, ~460 instanced items across 7 draw calls)
export const COUNT_BOTTLES = 64;  // Transparent water bottles
export const COUNT_BAGS    = 84;  // Translucent crumpled bags & sheets
export const COUNT_CANS    = 72;  // Soda cans & metal tins
export const COUNT_CRATES  = 36;  // Industrial crates & containers
export const COUNT_TIRES   = 36;  // Rubber tires
export const COUNT_CUPS    = 44;  // Takeaway coffee cups
export const COUNT_CAPS    = 128; // Bottle caps, wrappers & chips

// ── 1. PROCEDURAL GEOMETRIES (Crisp, Detailed, Low-Poly) ──
function createWaterBottleGeometry() {
  const points = [];
  points.push(new THREE.Vector2(0.0, 0.0));
  points.push(new THREE.Vector2(0.28, 0.04));
  points.push(new THREE.Vector2(0.32, 0.12));

  // Molded grip ridges
  for (let i = 0; i < 3; i++) {
    const y = 0.22 + i * 0.22;
    points.push(new THREE.Vector2(0.34, y));
    points.push(new THREE.Vector2(0.30, y + 0.06));
    points.push(new THREE.Vector2(0.34, y + 0.12));
  }

  points.push(new THREE.Vector2(0.33, 1.15));
  points.push(new THREE.Vector2(0.18, 1.38));
  points.push(new THREE.Vector2(0.13, 1.50));
  points.push(new THREE.Vector2(0.13, 1.70));
  points.push(new THREE.Vector2(0.15, 1.72));
  points.push(new THREE.Vector2(0.15, 1.82));
  points.push(new THREE.Vector2(0.0, 1.82));

  const geom = new THREE.LatheGeometry(points, 14);
  geom.center();
  return geom;
}

function createShoppingBagGeometry() {
  const geom = new THREE.CylinderGeometry(0.28, 0.38, 1.10, 12, 8, true);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const noise = Math.sin(y * 6.0 + x * 4.0) * 0.06 + Math.cos(z * 7.0) * 0.04;
    pos.setXYZ(i, x * (1.0 + noise), y, z * (1.0 + noise));
  }
  geom.computeVertexNormals();
  geom.center();
  return geom;
}

function createDentedCanGeometry() {
  const geom = new THREE.CylinderGeometry(0.26, 0.26, 0.75, 16);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x > 0.12 && Math.abs(y) < 0.22) {
      pos.setX(i, x * 0.72);
      pos.setZ(i, z * 0.82);
    }
  }
  geom.computeVertexNormals();
  geom.center();
  return geom;
}

function createSmallCrateGeometry() {
  const geom = new THREE.BoxGeometry(0.85, 0.55, 0.65);
  geom.center();
  return geom;
}

function createTireGeometry() {
  const geom = new THREE.TorusGeometry(0.42, 0.18, 10, 18);
  geom.center();
  return geom;
}

function createCoffeeCupGeometry() {
  const geom = new THREE.CylinderGeometry(0.32, 0.22, 0.75, 14);
  geom.center();
  return geom;
}

function createCapGeometry() {
  const geom = new THREE.CylinderGeometry(0.18, 0.18, 0.10, 12);
  geom.center();
  return geom;
}

// ── 2. PROCEDURAL TEXTURES ──
function createSodaCanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d92626';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#b8c0cc';
  ctx.fillRect(0, 0, 128, 14);
  ctx.fillRect(0, 114, 128, 14);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 28, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function createCrateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#145cb8';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#0a3675';
  ctx.lineWidth = 3;
  for (let i = 8; i < 64; i += 12) {
    ctx.strokeRect(i, 4, 8, 56);
  }

  return new THREE.CanvasTexture(canvas);
}

export const FloatingDebris = ({
  center = [0, 0, 0],
  mousePos = { x: 0, y: 0 },
  healProgress = 0,
  pollution = 1.0,
  isFinalBeat = false,
}) => {
  // Instanced mesh refs
  const bottleInstRef = useRef(null);
  const bagInstRef    = useRef(null);
  const canInstRef    = useRef(null);
  const crateInstRef  = useRef(null);
  const tireInstRef   = useRef(null);
  const cupInstRef    = useRef(null);
  const capInstRef    = useRef(null);
  const heroGroupRef  = useRef(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Textures
  const canTexture   = useMemo(() => createSodaCanTexture(), []);
  const crateTexture = useMemo(() => createCrateTexture(), []);

  // Geometries
  const bottleGeom = useMemo(() => createWaterBottleGeometry(), []);
  const bagGeom    = useMemo(() => createShoppingBagGeometry(), []);
  const canGeom    = useMemo(() => createDentedCanGeometry(), []);
  const crateGeom  = useMemo(() => createSmallCrateGeometry(), []);
  const tireGeom   = useMemo(() => createTireGeometry(), []);
  const cupGeom    = useMemo(() => createCoffeeCupGeometry(), []);
  const capGeom    = useMemo(() => createCapGeometry(), []);

  // Materials
  const matClearBottle = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.12,
    transmission: 0.85,
    ior: 1.45,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  const matTranslucentBag = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.35,
    transmission: 0.60,
    transparent: true,
    opacity: 0.80,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const matSodaCan = useMemo(() => new THREE.MeshStandardMaterial({
    map: canTexture,
    roughness: 0.28,
    metalness: 0.75,
  }), []);

  const matBlueCrate = useMemo(() => new THREE.MeshStandardMaterial({
    map: crateTexture,
    roughness: 0.42,
    metalness: 0.05,
  }), []);

  const matRubberTire = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1d',
    roughness: 0.90,
    metalness: 0.04,
  }), []);

  const matPaperCup = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c9b18c',
    roughness: 0.78,
  }), []);

  const matCap = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.35,
    metalness: 0.10,
  }), []);

  // Multi-color palette for varied colorful clutter
  const capPalette = useMemo(() => [
    new THREE.Color('#2563eb'),
    new THREE.Color('#dc2626'),
    new THREE.Color('#16a34a'),
    new THREE.Color('#eab308'),
    new THREE.Color('#f97316'),
    new THREE.Color('#e2e8f0'),
    new THREE.Color('#9333ea'),
  ], []);

  const bottlePalette = useMemo(() => [
    new THREE.Color('#d4eaf7'),
    new THREE.Color('#c6f6d5'),
    new THREE.Color('#e2e8f0'),
    new THREE.Color('#bee3f8'),
  ], []);

  const bagPalette = useMemo(() => [
    new THREE.Color('#f7fafc'),
    new THREE.Color('#bee3f8'),
    new THREE.Color('#feebc8'),
    new THREE.Color('#e2e8f0'),
  ], []);

  // 7 Large Hero pieces placed at corners and edges matching reference mockup
  const heroItems = useMemo(() => {
    if (isFinalBeat) {
      return [
        // 1. Giant blurred water bottle at bottom-left corner
        { geom: bottleGeom, mat: matClearBottle, pos: [-1.45, -0.75, 2.75], scale: 0.78, rot: [0.45, -0.3, 0.82], speed: [0.06, 0.04, 0.02] },
        // 2. Large crumpled translucent bag at top-right corner
        { geom: bagGeom, mat: matTranslucentBag, pos: [1.70, 1.05, 2.45], scale: 0.85, rot: [-0.2, 0.6, 0.3], speed: [-0.05, 0.06, 0.03] },
        // 3. Rubber tire at right-lower edge
        { geom: tireGeom, mat: matRubberTire, pos: [1.46, -0.42, 2.50], scale: 0.58, rot: [0.6, 0.4, -0.3], speed: [-0.04, 0.05, 0.03] },
        // 4. Dented soda can at bottom-right corner
        { geom: canGeom, mat: matSodaCan, pos: [1.65, -0.88, 2.62], scale: 0.55, rot: [0.3, 0.7, -0.4], speed: [0.06, 0.03, -0.04] },
        // 5. Blue industrial crate at right-middle
        { geom: crateGeom, mat: matBlueCrate, pos: [1.18, -0.32, 1.85], scale: 0.32, rot: [0.2, -0.4, 0.5], speed: [0.05, -0.04, 0.03] },
        // 6. Secondary water bottle above equator on right
        { geom: bottleGeom, mat: matClearBottle, pos: [1.14, 0.44, 1.95], scale: 0.30, rot: [0.5, 0.2, 0.9], speed: [0.04, 0.06, 0.03] },
        // 7. Small crumpled takeaway cup at upper-left
        { geom: cupGeom, mat: matPaperCup, pos: [-1.55, 0.65, 2.15], scale: 0.28, rot: [0.4, -0.3, 0.5], speed: [0.04, -0.05, 0.04] },
      ];
    }
    return [
      { geom: bottleGeom, mat: matClearBottle, pos: [1.8, -1.0, 2.2], scale: 0.26, rot: [0.4, 0.2, 0.6], speed: [0.12, 0.08, 0.05] },
      { geom: bagGeom, mat: matTranslucentBag, pos: [1.9, 1.1, 2.0], scale: 0.30, rot: [-0.3, 0.5, 0.2], speed: [-0.08, 0.10, 0.04] },
      { geom: cupGeom, mat: matPaperCup, pos: [1.1, -1.3, 2.1], scale: 0.24, rot: [0.6, -0.4, 0.3], speed: [0.06, -0.09, 0.07] },
      { geom: canGeom, mat: matSodaCan, pos: [-1.8, -1.1, 2.1], scale: 0.22, rot: [0.2, 0.6, -0.5], speed: [0.10, 0.05, -0.06] },
      { geom: tireGeom, mat: matRubberTire, pos: [-1.9, 0.5, 2.2], scale: 0.20, rot: [0.5, 0.3, -0.2], speed: [-0.05, 0.08, 0.05] },
      { geom: crateGeom, mat: matBlueCrate, pos: [2.1, 0.2, 2.1], scale: 0.22, rot: [0.1, -0.3, 0.4], speed: [0.07, -0.06, 0.04] },
    ];
  }, [isFinalBeat, bottleGeom, bagGeom, cupGeom, canGeom, tireGeom, crateGeom, matClearBottle, matTranslucentBag, matPaperCup, matSodaCan, matRubberTire, matBlueCrate]);

  // Generate orbital shell parameters for clutter particles (with distinct orbital debris belt)
  const generateClutterData = (count, baseScale, minRadius, maxRadius, colorPalette = null) => {
    const list = [];
    let seed = 789123 + count * 13;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      // ~65% of clutter clustered into a visible debris belt/ring around the Earth
      const isBelt = (i % 3) !== 0;
      let radius, inclination, nodeAngle, orbitSpeed;

      if (isBelt) {
        radius = 0.95 + rand() * 0.48; // Concentrated orbital band
        inclination = 0.32 + (rand() - 0.5) * 0.12; // Coherent plane tilt
        nodeAngle = 0.45 + (rand() - 0.5) * 0.16;   // Shared ascending node
        orbitSpeed = (0.016 + rand() * 0.022) * DRIFT_SPEED_MULT;
      } else {
        // Remaining items in wider halo
        radius = minRadius + rand() * (maxRadius - minRadius);
        inclination = (rand() - 0.5) * Math.PI * 0.70;
        nodeAngle = rand() * Math.PI * 2;
        orbitSpeed = (rand() > 0.45 ? 1 : -1) * (0.012 + rand() * 0.024) * DRIFT_SPEED_MULT;
      }

      const baseAngle = rand() * Math.PI * 2;
      const scale = baseScale * (0.80 + rand() * 0.45);
      const threshold = 0.10 + rand() * 0.72;

      const color = colorPalette
        ? colorPalette[Math.floor(rand() * colorPalette.length)]
        : null;

      list.push({
        radius,
        inclination,
        nodeAngle,
        baseAngle,
        currentAngle: baseAngle,
        orbitSpeed,
        scale,
        threshold,
        color,
        rotX: rand() * Math.PI * 2,
        rotY: rand() * Math.PI * 2,
        rotZ: rand() * Math.PI * 2,
        rotSpeedX: (rand() - 0.5) * 0.40,
        rotSpeedY: (rand() - 0.5) * 0.35,
        rotSpeedZ: (rand() - 0.5) * 0.30,
      });
    }
    return list;
  };

  const bottleData = useMemo(() => generateClutterData(COUNT_BOTTLES, SMALL_DEBRIS_SCALE * 0.95, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS, bottlePalette), [bottlePalette]);
  const bagData    = useMemo(() => generateClutterData(COUNT_BAGS,    SMALL_DEBRIS_SCALE * 1.05, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS, bagPalette), [bagPalette]);
  const canData    = useMemo(() => generateClutterData(COUNT_CANS,    SMALL_DEBRIS_SCALE * 0.90, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const crateData  = useMemo(() => generateClutterData(COUNT_CRATES,  SMALL_DEBRIS_SCALE * 0.85, ORBIT_MIN_RADIUS + 0.10, ORBIT_MAX_RADIUS), []);
  const tireData   = useMemo(() => generateClutterData(COUNT_TIRES,   SMALL_DEBRIS_SCALE * 0.85, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const cupData    = useMemo(() => generateClutterData(COUNT_CUPS,    SMALL_DEBRIS_SCALE * 0.85, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS), []);
  const capData    = useMemo(() => generateClutterData(COUNT_CAPS,    SMALL_DEBRIS_SCALE * 0.55, ORBIT_MIN_RADIUS, ORBIT_MAX_RADIUS + 0.12, capPalette), [capPalette]);

  // Compute 3D position on tilted orbital plane
  const computeOrbitalPos = (item) => {
    const a = item.currentAngle;
    const r = item.radius;

    const x0 = r * Math.cos(a);
    const z0 = r * Math.sin(a);

    const x1 = x0;
    const y1 = -z0 * Math.sin(item.inclination);
    const z1 = z0 * Math.cos(item.inclination);

    const cosN = Math.cos(item.nodeAngle);
    const sinN = Math.sin(item.nodeAngle);

    const x = x1 * cosN - z1 * sinN + mousePos.x * 0.05;
    const y = y1 + mousePos.y * 0.04;
    const z = x1 * sinN + z1 * cosN;

    return { x, y, z };
  };

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

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    const effectivePollution = pollution !== undefined ? pollution : 1.0 - healProgress;

    const updateInstances = (mesh, data) => {
      if (!mesh) return;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        item.currentAngle += item.orbitSpeed * clampedDelta * 60;
        item.rotX += item.rotSpeedX * clampedDelta;
        item.rotY += item.rotSpeedY * clampedDelta;
        item.rotZ += item.rotSpeedZ * clampedDelta;

        const pos = computeOrbitalPos(item);

        // Clutter dissolves smoothly when pollution drops to 0
        const localDissolve = Math.max(0.0, smoothstep(item.threshold * 0.45, item.threshold * 0.45 + 0.38, effectivePollution));

        // When in final beat, clear any debris within ~25% viewport radius from screen center
        let centerClearFactor = 1.0;
        if (isFinalBeat) {
          const screenDist = Math.hypot(pos.x + center[0], pos.y + center[1] + 0.10);
          centerClearFactor = smoothstep(0.48, 0.75, screenDist);
        }

        const s = effectivePollution <= 0.01 ? 0.0 : item.scale * localDissolve * centerClearFactor;

        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateInstances(bottleInstRef.current, bottleData);
    updateInstances(bagInstRef.current,    bagData);
    updateInstances(canInstRef.current,    canData);
    updateInstances(crateInstRef.current,  crateData);
    updateInstances(tireInstRef.current,   tireData);
    updateInstances(cupInstRef.current,    cupData);
    updateInstances(capInstRef.current,    capData);

    // Animate large foreground hero pieces
    if (heroGroupRef.current) {
      heroGroupRef.current.children.forEach((child, i) => {
        const item = heroItems[i];
        if (!item) return;
        child.rotation.x += item.speed[0] * clampedDelta;
        child.rotation.y += item.speed[1] * clampedDelta;
        child.rotation.z += item.speed[2] * clampedDelta;
        child.position.y = item.pos[1] + Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.04 + mousePos.y * 0.02;
        child.position.x = item.pos[0] + mousePos.x * 0.03;
        const s = Math.max(0, effectivePollution) * item.scale;
        child.scale.set(s, s, s);
      });
    }
  });

  function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  return (
    <group visible={healProgress < 0.99}>
      {/* ── Foreground Hero Debris (Close to Camera for Depth of Field) ── */}
      <group ref={heroGroupRef}>
        {heroItems.map((item, idx) => (
          <mesh
            key={idx}
            geometry={item.geom}
            material={item.mat}
            position={item.pos}
            rotation={item.rot}
            scale={item.scale}
            castShadow
            receiveShadow
          />
        ))}
      </group>

      {/* ── Medium Orbital Pieces (Centered on Earth) ── */}
      <group position={center}>
        {/* 1. Small Transparent Water Bottles */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              bottleInstRef.current = m;
              initMesh(m, bottleData);
            }
          }}
          castShadow
          receiveShadow
          args={[bottleGeom, matClearBottle, COUNT_BOTTLES]}
        />

        {/* 2. Small Translucent Crumpled Bags */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              bagInstRef.current = m;
              initMesh(m, bagData);
            }
          }}
          castShadow
          receiveShadow
          args={[bagGeom, matTranslucentBag, COUNT_BAGS]}
        />

        {/* 3. Small Dented Soda Cans */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              canInstRef.current = m;
              initMesh(m, canData);
            }
          }}
          castShadow
          receiveShadow
          args={[canGeom, matSodaCan, COUNT_CANS]}
        />

        {/* 4. Small Blue Milk Crates */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              crateInstRef.current = m;
              initMesh(m, crateData);
            }
          }}
          castShadow
          receiveShadow
          args={[crateGeom, matBlueCrate, COUNT_CRATES]}
        />

        {/* 5. Small Rubber Tires */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              tireInstRef.current = m;
              initMesh(m, tireData);
            }
          }}
          castShadow
          receiveShadow
          args={[tireGeom, matRubberTire, COUNT_TIRES]}
        />

        {/* 6. Small Takeaway Coffee Cups */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              cupInstRef.current = m;
              initMesh(m, cupData);
            }
          }}
          castShadow
          receiveShadow
          args={[cupGeom, matPaperCup, COUNT_CUPS]}
        />

        {/* 7. Small Bottle Caps, Wrappers & Chips */}
        <instancedMesh
          ref={(m) => {
            if (m) {
              capInstRef.current = m;
              initMesh(m, capData);
            }
          }}
          castShadow
          receiveShadow
          args={[capGeom, matCap, COUNT_CAPS]}
        />
      </group>
    </group>
  );
};

export default FloatingDebris;
