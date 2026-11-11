import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Earth, AXIAL_TILT_X, AXIAL_TILT_Z, INITIAL_ROTATION_Y } from '../hero3d/Earth';
import { Clouds } from '../hero3d/Clouds';
import { Atmosphere } from '../hero3d/Atmosphere';
import { interpolateGlobeKeyframes } from '../../config/globeKeyframes';
import {
  DetailedCan,
  DetailedBottle,
  DetailedCoffeeCup,
  DetailedTire,
  DetailedMilkJug,
  DetailedCrumpledBag,
  DetailedSatelliteShard,
  DetailedRocketHull,
  DetailedTakeoutBox,
  DetailedSpaceSlag,
} from '../hero3d/DetailedDebris';

export const HERO_CAMERA_FOV = 40;
export const HERO_CAMERA_Z = 2.18;
export const HERO_CAMERA_Y = 0.0;
export const HERO_ROTATION_SPEED = 0.0030; // Slow majestic auto-rotation

// Lat/Lon to Sphere Cartesian Coordinate converter
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// ── 5. CINEMATIC HIGH-DETAIL FLOATING DEBRIS & WASTE FIELD ──
// Strictly positioned in orbit/space: guaranteed to NEVER penetrate or touch Earth's surface or atmosphere!
const DEBRIS_ITEMS = [
  // ── 1. UPPER-LEFT & 'H' REGION ──
  {
    // Signature tilted water bottle framing 'H' (matches reference mockup)
    type: 'bottle',
    brand: 'glacier',
    capColor: '#2563eb', // Royal blue cap
    pos: [-0.68, 0.24, 0.48],
    rot: [-0.45, 0.55, -0.65],
    scale: 1.15,
    spin: [0.003, 0.004, -0.002],
    drift: 0.05,
  },
  {
    type: 'can',
    brand: 'cola',
    pos: [-0.58, 0.52, 0.32],
    rot: [0.4, -0.6, 0.3],
    scale: 1.05,
    spin: [0.004, -0.003, 0.003],
    drift: 0.05,
  },
  {
    type: 'solar',
    pos: [-0.82, 0.38, 0.36],
    rot: [0.6, -0.3, 0.5],
    scale: 1.10,
    spin: [-0.002, 0.003, 0.004],
    drift: 0.04,
  },
  {
    type: 'coffee',
    pos: [-0.74, 0.02, 0.42],
    rot: [-0.3, 0.4, 0.6],
    scale: 0.95,
    spin: [0.003, 0.002, -0.003],
    drift: 0.06,
  },
  {
    type: 'bag',
    color: '#f8fafc',
    pos: [-0.52, 0.15, 0.30],
    rot: [0.2, 0.5, -0.4],
    scale: 0.90,
    spin: [-0.002, 0.004, 0.002],
    drift: 0.04,
  },

  // ── 2. TOP-CENTER & 'E' / 'A' REGION ──
  {
    type: 'can',
    brand: 'energy',
    pos: [-0.32, 0.54, 0.28],
    rot: [-0.5, 0.3, 0.7],
    scale: 1.0,
    spin: [0.004, 0.003, -0.002],
    drift: 0.05,
  },
  {
    type: 'box',
    pos: [-0.10, 0.32, 0.32],
    rot: [0.5, -0.3, 0.4],
    scale: 0.95,
    spin: [-0.002, 0.003, 0.002],
    drift: 0.04,
  },
  {
    type: 'slag',
    pos: [-0.18, 0.44, 0.28],
    rot: [0.6, 0.2, -0.4],
    scale: 1.05,
    spin: [-0.002, 0.003, 0.002],
    drift: 0.03,
  },
  {
    type: 'jug',
    color: '#f8fafc',
    capColor: '#dc2626',
    pos: [0.12, 0.56, 0.30],
    rot: [0.3, 0.6, -0.5],
    scale: 1.05,
    spin: [0.002, -0.004, 0.003],
    drift: 0.04,
  },
  {
    type: 'solar',
    pos: [0.32, 0.58, 0.30],
    rot: [-0.4, 0.7, 0.3],
    scale: 1.05,
    spin: [0.003, 0.003, -0.004],
    drift: 0.05,
  },
  {
    type: 'tire',
    pos: [-0.02, 0.50, 0.26],
    rot: [0.8, -0.4, 0.2],
    scale: 0.90,
    spin: [-0.003, 0.004, 0.002],
    drift: 0.04,
  },

  // ── 3. UPPER-RIGHT & 'L' REGION ──
  {
    type: 'bottle',
    brand: 'glacier',
    capColor: '#10b981', // Emerald green cap
    pos: [0.48, 0.36, 0.34],
    rot: [-0.3, 0.7, -0.4],
    scale: 1.10,
    spin: [0.004, -0.003, 0.002],
    drift: 0.06,
  },
  {
    type: 'can',
    brand: 'fizz',
    pos: [0.60, 0.52, 0.30],
    rot: [0.6, -0.5, 0.3],
    scale: 1.05,
    spin: [-0.003, 0.005, 0.003],
    drift: 0.06,
  },
  {
    type: 'bag',
    color: '#bae6fd',
    pos: [0.68, 0.28, 0.32],
    rot: [0.4, -0.3, 0.6],
    scale: 0.95,
    spin: [0.003, 0.004, -0.002],
    drift: 0.05,
  },
  {
    type: 'tire',
    pos: [0.78, 0.44, 0.35],
    rot: [-0.5, 0.4, 0.8],
    scale: 0.95,
    spin: [-0.002, 0.005, 0.003],
    drift: 0.06,
  },
  {
    type: 'slag',
    pos: [0.55, 0.62, 0.30],
    rot: [0.3, -0.4, 0.5],
    scale: 1.15,
    spin: [-0.003, 0.002, -0.003],
    drift: 0.04,
  },
  {
    type: 'rocket',
    pos: [0.76, 0.16, 0.38],
    rot: [0.4, -0.6, 0.5],
    scale: 1.0,
    spin: [0.003, -0.004, 0.002],
    drift: 0.06,
  },

  // ── 4. FOREGROUND SIGNATURE FLANK & ORBIT (Matches Reference Mockup) ──
  {
    // Signature crisp metallic soda can on the right flank (Foreground like mockup!)
    type: 'can',
    brand: 'cola',
    pos: [0.62, -0.20, 0.78],
    rot: [0.35, 0.75, -0.28],
    scale: 1.25,
    spin: [-0.003, 0.005, 0.003],
    drift: 0.07,
  },
  {
    type: 'coffee',
    pos: [0.68, -0.02, 0.46],
    rot: [0.5, 0.3, -0.4],
    scale: 1.0,
    spin: [0.004, -0.003, 0.003],
    drift: 0.05,
  },
  {
    type: 'slag',
    pos: [0.70, -0.38, 0.65],
    rot: [-0.4, 0.5, 0.3],
    scale: 1.10,
    spin: [0.002, 0.003, -0.003],
    drift: 0.05,
  },
  {
    type: 'bottle',
    brand: 'glacier',
    capColor: '#f97316', // Orange sports cap
    pos: [-0.82, -0.12, 0.46],
    rot: [-0.6, 0.4, -0.5],
    scale: 1.05,
    spin: [0.003, -0.005, 0.002],
    drift: 0.06,
  },
  {
    type: 'tire',
    pos: [-0.76, 0.62, 0.32],
    rot: [0.7, -0.5, 0.3],
    scale: 0.90,
    spin: [-0.004, 0.003, -0.003],
    drift: 0.06,
  },
  {
    type: 'jug',
    color: '#e0f2fe',
    capColor: '#0284c7',
    pos: [-0.48, 0.38, 0.30],
    rot: [0.2, -0.7, 0.4],
    scale: 0.95,
    spin: [0.002, 0.004, -0.003],
    drift: 0.04,
  },
  {
    type: 'rocket',
    pos: [-0.38, 0.65, 0.28],
    rot: [-0.3, 0.5, 0.7],
    scale: 0.90,
    spin: [-0.003, 0.003, 0.004],
    drift: 0.05,
  },
  {
    type: 'box',
    pos: [0.38, 0.48, 0.28],
    rot: [0.4, -0.4, 0.5],
    scale: 0.90,
    spin: [0.003, -0.002, 0.003],
    drift: 0.04,
  },
  {
    type: 'slag',
    pos: [0.22, 0.32, 0.28],
    rot: [-0.5, 0.4, 0.6],
    scale: 0.95,
    spin: [0.003, -0.003, 0.002],
    drift: 0.03,
  },
  {
    type: 'bottle',
    brand: 'glacier',
    capColor: '#ffffff',
    pos: [0.36, 0.14, 0.42],
    rot: [0.2, 0.8, -0.3],
    scale: 0.95,
    spin: [0.003, -0.004, 0.002],
    drift: 0.04,
  },
  {
    type: 'can',
    brand: 'energy',
    pos: [-0.24, 0.12, 0.40],
    rot: [-0.4, 0.5, 0.3],
    scale: 0.95,
    spin: [-0.003, 0.003, -0.002],
    drift: 0.04,
  },
  {
    type: 'bag',
    color: '#f8fafc',
    pos: [0.08, 0.10, 0.46],
    rot: [0.5, -0.3, 0.2],
    scale: 0.90,
    spin: [0.002, 0.004, 0.003],
    drift: 0.04,
  },
];

const FloatingDebrisField = ({ mouseRef, visible = true, opacity = 1.0, prefersReducedMotion = false }) => {
  const groupRef = useRef(null);
  const itemsRef = useRef([]);
  const { size } = useThree();
  const isMobile = size.width < 768;

  useFrame(({ clock }, delta) => {
    if (!visible || prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    const mx = mouseRef.current ? mouseRef.current.x : 0;
    const my = mouseRef.current ? mouseRef.current.y : 0;

    // Guaranteed clearance from Earth: center is (0.16, -1.44), radius is 1.30, atmosphere ~1.352.
    // Minimum distance 1.54 guarantees ZERO intersection or entry into Earth!
    const earthCenterX = 0.16;
    const earthCenterY = -1.44;
    const minDistance = 1.54;

    itemsRef.current.forEach((itemObj, idx) => {
      if (!itemObj) return;
      const d = DEBRIS_ITEMS[idx];
      itemObj.rotation.x += d.spin[0] * delta * 60;
      itemObj.rotation.y += d.spin[1] * delta * 60;
      itemObj.rotation.z += d.spin[2] * delta * 60;

      const bobY = Math.sin(t * 0.7 + idx * 1.5) * 0.012;
      const bobX = Math.cos(t * 0.5 + idx * 1.2) * 0.010;

      let posX = d.pos[0] + bobX + mx * d.drift;
      let posY = d.pos[1] + bobY + my * d.drift;
      let posZ = Math.max(0.24, d.pos[2]);

      // Dynamic collision avoidance: push outward radially away from Earth center
      const dx = posX - earthCenterX;
      const dy = posY - earthCenterY;
      const dist = Math.hypot(dx, dy, posZ);

      if (dist < minDistance) {
        const factor = minDistance / Math.max(0.001, dist);
        posX = earthCenterX + dx * factor;
        posY = earthCenterY + dy * factor;
      }

      itemObj.position.set(posX, posY, posZ);
      const responsiveScale = isMobile ? d.scale * 0.75 : d.scale;
      itemObj.scale.setScalar(responsiveScale);
    });

    if (groupRef.current) {
      groupRef.current.scale.setScalar(Math.max(0.001, opacity));
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {DEBRIS_ITEMS.map((d, i) => (
        <group
          key={i}
          ref={(el) => (itemsRef.current[i] = el)}
          position={d.pos}
          rotation={d.rot}
          scale={d.scale}
        >
          {d.type === 'bottle' && <DetailedBottle brand={d.brand} capColor={d.capColor} />}
          {d.type === 'can' && <DetailedCan brand={d.brand} />}
          {d.type === 'coffee' && <DetailedCoffeeCup />}
          {d.type === 'tire' && <DetailedTire />}
          {d.type === 'jug' && <DetailedMilkJug color={d.color} capColor={d.capColor} />}
          {d.type === 'bag' && <DetailedCrumpledBag color={d.color} />}
          {d.type === 'solar' && <DetailedSatelliteShard />}
          {d.type === 'rocket' && <DetailedRocketHull />}
          {d.type === 'box' && <DetailedTakeoutBox />}
          {d.type === 'slag' && <DetailedSpaceSlag />}
        </group>
      ))}
    </group>
  );
};

// ── 6. BILLBOARD SMOKE PLUMES RISING FROM FIRES ──
const SMOKE_SOURCES = [
  { lat: 28, lon: 110 },
  { lat: 22, lon: 108 },
  { lat: 34, lon: 112 },
  { lat: 16, lon: 106 },
  { lat: 26, lon: 114 },
  { lat: 30, lon: 107 },
  { lat: 12, lon: 110 },
];

const SmokePlumes = ({ isLowEnd = false, healProgress = 0.0 }) => {
  const meshRef = useRef(null);
  const count = isLowEnd ? 24 : 55;
  const { camera } = useThree();

  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(38, 40, 46, 0.92)');
    grad.addColorStop(0.35, 'rgba(28, 30, 36, 0.60)');
    grad.addColorStop(0.70, 'rgba(20, 22, 28, 0.22)');
    grad.addColorStop(1, 'rgba(10, 12, 16, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const particles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const src = SMOKE_SOURCES[i % SMOKE_SOURCES.length];
      const basePos = latLonToVector3(src.lat, src.lon, 1.0);
      const normal = basePos.clone().normalize();
      pts.push({
        basePos,
        normal,
        speed: 0.012 + Math.random() * 0.020,
        scale: 0.08 + Math.random() * 0.10,
        drift: (Math.random() - 0.5) * 0.035,
        seed: Math.random() * 100,
      });
    }
    return pts;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Smoke opacity fades out smoothly as planet heals
  const smokeFactor = THREE.MathUtils.smoothstep(healProgress, 0.55, 0.05);

  useFrame(({ clock }) => {
    if (!meshRef.current || isLowEnd || smokeFactor <= 0.001) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, idx) => {
      const progress = ((t * p.speed + p.seed) % 1.0);
      const currentHeight = 1.002 + progress * 0.28;
      const pos = p.basePos.clone().normalize().multiplyScalar(currentHeight);
      
      pos.y += progress * 0.055;
      pos.x += p.drift * progress;

      dummy.position.copy(pos);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(p.scale * (1.2 + progress * 3.2));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(idx, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (smokeFactor <= 0.001) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={smokeTexture}
        transparent
        depthWrite={false}
        opacity={(isLowEnd ? 0.35 : 0.75) * smokeFactor}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
};

// ── 7. PERSISTENT PLANET CONTROLLER (Drives Globe across Sections via Keyframes) ──
const PersistentPlanetController = ({
  liteMode = false,
  mouseRef,
  scrollProgressRef,
  userCleanProgress = 0,
}) => {
  const planetGroupRef = useRef(null);
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = size.width < 768 || aspect < 1.05;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Persistent smoothed state refs
  const currentPos = useRef({ x: isMobile ? 0 : 0.16, y: isMobile ? -1.28 : -1.44 });
  const currentScale = useRef(isMobile ? 1.18 : 1.30);
  const currentRotX = useRef(AXIAL_TILT_X + 0.14);
  const currentRotZ = useRef(AXIAL_TILT_Z);
  const currentRotYOffset = useRef(0.0);
  const currentDim = useRef(1.0);
  const currentHeal = useRef(0.0);
  const currentDebrisOpacity = useRef(1.0);

  const baseRotationY = useRef(INITIAL_ROTATION_Y - 0.28);

  const [activeHeal, setActiveHeal] = useState(0.0);
  const [activeDim, setActiveDim] = useState(1.0);
  const [debrisOpacity, setDebrisOpacity] = useState(1.0);
  const hasSignaledReady = useRef(false);

  useEffect(() => {
    camera.position.set(0, HERO_CAMERA_Y, HERO_CAMERA_Z);
    camera.lookAt(0, -0.15, 0);
  }, [camera]);

  useFrame(({ clock }, delta) => {
    if (!hasSignaledReady.current) {
      hasSignaledReady.current = true;
      window.dispatchEvent(new CustomEvent('terraheal:scene-ready'));
    }

    const t = clock.getElapsedTime();
    const mx = mouseRef.current ? mouseRef.current.x : 0;
    const my = mouseRef.current ? mouseRef.current.y : 0;
    const progress = scrollProgressRef.current || 0.0;

    // Evaluate target state from keyframe interpolation
    const target = interpolateGlobeKeyframes(progress, isMobile);

    // Compute effective heal progress combining storytelling curve with user's earned game progress
    const effectiveTargetHeal = Math.min(
      1.0,
      Math.max(target.healProgress, (userCleanProgress || 0) * 0.82 + target.healProgress * 0.20)
    );

    // Smooth delta-based easing for 60fps butter-smooth transitions
    const lerpSpeed = prefersReducedMotion ? 1.0 : Math.min(delta * 4.2, 1.0);
    const rotSpeed = prefersReducedMotion ? 1.0 : Math.min(delta * 3.2, 1.0);

    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, target.posX, lerpSpeed);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, target.posY, lerpSpeed);
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, target.scale, lerpSpeed);
    currentRotX.current = THREE.MathUtils.lerp(currentRotX.current, target.rotX, rotSpeed);
    currentRotZ.current = THREE.MathUtils.lerp(currentRotZ.current, target.rotZ, rotSpeed);
    currentRotYOffset.current = THREE.MathUtils.lerp(currentRotYOffset.current, target.rotYOffset, rotSpeed);
    currentDim.current = THREE.MathUtils.lerp(currentDim.current, target.dim, lerpSpeed);
    currentHeal.current = THREE.MathUtils.lerp(currentHeal.current, effectiveTargetHeal, lerpSpeed);
    currentDebrisOpacity.current = THREE.MathUtils.lerp(currentDebrisOpacity.current, target.debrisOpacity, lerpSpeed);

    // Sync state for React child components at throttled rate
    if (Math.abs(currentHeal.current - activeHeal) > 0.015) {
      setActiveHeal(currentHeal.current);
    }
    if (Math.abs(currentDim.current - activeDim) > 0.02) {
      setActiveDim(currentDim.current);
    }
    if (Math.abs(currentDebrisOpacity.current - debrisOpacity) > 0.02) {
      setDebrisOpacity(currentDebrisOpacity.current);
    }

    // Majestic continuous auto-rotation
    if (!prefersReducedMotion) {
      baseRotationY.current += delta * HERO_ROTATION_SPEED;
    }

    if (planetGroupRef.current) {
      planetGroupRef.current.position.set(currentPos.current.x, currentPos.current.y, 0);
      planetGroupRef.current.scale.setScalar(currentScale.current);

      planetGroupRef.current.rotation.x = currentRotX.current + (prefersReducedMotion ? 0 : my * 0.035);
      planetGroupRef.current.rotation.y = baseRotationY.current + currentRotYOffset.current;
      planetGroupRef.current.rotation.z = currentRotZ.current - (prefersReducedMotion ? 0 : mx * 0.035);
    }

    // Subtle natural camera drift + mouse parallax
    if (!prefersReducedMotion) {
      const driftX = Math.sin(t * 0.18) * 0.018 + mx * 0.05;
      const driftY = Math.cos(t * 0.22) * 0.010 + my * 0.03;
      camera.position.x = driftX;
      camera.position.y = HERO_CAMERA_Y + driftY;
      camera.lookAt(0, -0.15, 0);
    }
  });

  return (
    <>
      {/* ── Key Lighting: Cold Blue-White Rim Light from Upper Left ── */}
      <directionalLight
        position={[-2.4, 2.0, 1.2]}
        color="#e0f2fe"
        intensity={3.0 * activeDim}
      />
      {/* Intense Cyan Horizon Rim Light */}
      <directionalLight
        position={[-0.8, 2.4, 0.4]}
        color="#38bdf8"
        intensity={1.8 * activeDim}
      />
      {/* Specular Glint Light for Floating Debris & Asteroids */}
      <directionalLight
        position={[1.8, 1.2, 1.6]}
        color="#bae6fd"
        intensity={1.2 * activeDim}
      />
      {/* Camera-facing Key Light for Debris Detail and Labels */}
      <directionalLight
        position={[0.4, 0.8, 2.5]}
        color="#f8fafc"
        intensity={1.1 * activeDim}
      />
      {/* Low Ambient Light: Keeps dark hemisphere deep with golden lights */}
      <ambientLight color="#0f172a" intensity={0.25 * activeDim} />

      {/* ── Master Persistent Planet Group (Choreographed across sections) ── */}
      <group
        ref={planetGroupRef}
        position={[currentPos.current.x, currentPos.current.y, 0]}
        scale={currentScale.current}
        rotation={[AXIAL_TILT_X + 0.14, INITIAL_ROTATION_Y - 0.28, AXIAL_TILT_Z]}
      >
        {/* Core Earth with High-Res NASA Textures & Dynamic Story Healing */}
        <Earth
          pollution={1.0 - activeHeal}
          healProgress={activeHeal}
          autoRotate={false}
          heroSolutions={true}
          isLowEnd={liteMode}
          dim={activeDim}
        />

        {/* Cloud Layer with Slow Parallax and Dynamic Healing Brightness */}
        <Clouds
          pollution={1.0 - activeHeal}
          healProgress={activeHeal}
          autoRotate={false}
        />

        {/* Atmospheric Rim in Vivid Electric Cyan */}
        <Atmosphere
          pollution={1.0 - activeHeal}
          healProgress={activeHeal}
          coldRim={true}
        />

        {/* Billowing Smoke Plumes rising over damaged rifts (fades as planet heals) */}
        <SmokePlumes isLowEnd={liteMode} healProgress={activeHeal} />
      </group>

      {/* ── Floating Debris & Asteroids Field in Foreground Space (Hero only, fades out on scroll) ── */}
      <FloatingDebrisField
        mouseRef={mouseRef}
        visible={debrisOpacity > 0.01}
        opacity={debrisOpacity}
        prefersReducedMotion={prefersReducedMotion}
      />
    </>
  );
};

// ── 8. EXPORTED PERSISTENT CANVAS COMPONENT ──
export const SolutionsHeroScene = ({
  isVisible = true,
  liteMode = false,
  scrollProgressRef,
  userCleanProgress = 0,
}) => {
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const internalScrollRef = useRef(0);
  const activeScrollRef = scrollProgressRef || internalScrollRef;

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let animId;
    const lerpMouse = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      animId = requestAnimationFrame(lerpMouse);
    };
    animId = requestAnimationFrame(lerpMouse);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: !liteMode,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      camera={{ position: [0, HERO_CAMERA_Y, HERO_CAMERA_Z], fov: HERO_CAMERA_FOV }}
      dpr={[1, liteMode ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
      frameloop={isVisible ? 'always' : 'never'}
      className="w-full h-full pointer-events-none"
    >
      <PersistentPlanetController
        liteMode={liteMode}
        mouseRef={mouseRef}
        scrollProgressRef={activeScrollRef}
        userCleanProgress={userCleanProgress}
      />
    </Canvas>
  );
};

export default SolutionsHeroScene;
