import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Earth, AXIAL_TILT_X, AXIAL_TILT_Z, INITIAL_ROTATION_Y } from '../hero3d/Earth';
import { Clouds } from '../hero3d/Clouds';
import { Atmosphere } from '../hero3d/Atmosphere';
import { interpolateGlobeKeyframes } from '../../config/globeKeyframes';

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

// ── 1. PROCEDURAL CRAGGY ASTEROID / ROCK GEOMETRY ──
function createCraggyRockGeometry(seed = 1) {
  const geom = new THREE.DodecahedronGeometry(1, 1);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const noise =
      Math.sin(x * 3.5 + seed * 1.7) * 0.16 +
      Math.cos(y * 4.2 + seed * 2.3) * 0.14 +
      Math.sin(z * 3.8 + seed * 3.1) * 0.12;
    pos.setXYZ(i, x * (1 + noise), y * (1 + noise), z * (1 + noise));
  }
  geom.computeVertexNormals();
  return geom;
}

// ── 2. REALISTIC PLASTIC WATER BOTTLE ──
function BottleObject() {
  return (
    <group scale={[1.35, 1.35, 1.35]}>
      {/* Plastic Cylinder Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.17, 16]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.15}
          metalness={0.10}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Tapered Shoulder */}
      <mesh position={[0, 0.110, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.042, 0.048, 16, 1, true]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.15}
          metalness={0.10}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.148, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.035, 14]} />
        <meshStandardMaterial
          color="#bfdbfe"
          roughness={0.15}
          metalness={0.10}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Blue Cap */}
      <mesh position={[0, 0.170, 0]}>
        <cylinderGeometry args={[0.021, 0.021, 0.022, 14]} />
        <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Label band */}
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.043, 0.043, 0.065, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── 3. DENTED METALLIC SODA CAN ──
function SodaCanObject() {
  const dentedCanGeom = useMemo(() => {
    const geom = new THREE.CylinderGeometry(0.052, 0.052, 0.17, 16);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      if (Math.abs(y) < 0.045 && x > 0.015) {
        pos.setX(i, x * 0.78);
      }
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group scale={[1.15, 1.15, 1.15]}>
      <mesh geometry={dentedCanGeom}>
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.92}
          roughness={0.24}
        />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.005, 8, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.18} />
      </mesh>
      {/* Tab */}
      <mesh position={[0.012, 0.086, 0]}>
        <boxGeometry args={[0.018, 0.003, 0.032]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.18} />
      </mesh>
    </group>
  );
}

// ── 4. CRUMPLED PLASTIC BAG ──
function CrumpledBagObject() {
  const bagGeom = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(0.09, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const d = Math.sin(x * 12) * Math.cos(z * 12) * 0.035;
      pos.setXYZ(i, x + d, y * 0.75 + d, z + d);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group scale={[0.95, 0.95, 0.95]}>
      <mesh geometry={bagGeom}>
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.65}
          metalness={0.1}
          transparent
          opacity={0.82}
        />
      </mesh>
    </group>
  );
}

// ── 5. CINEMATIC FLOATING DEBRIS & ASTEROIDS FIELD ──
const FloatingDebrisField = ({ mouseRef, visible = true, opacity = 1.0, prefersReducedMotion = false }) => {
  const groupRef = useRef(null);

  const rockGeoms = useMemo(() => {
    return [
      createCraggyRockGeometry(1.2),
      createCraggyRockGeometry(2.7),
      createCraggyRockGeometry(4.1),
      createCraggyRockGeometry(5.8),
    ];
  }, []);

  const rockMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#333842',
      roughness: 0.85,
      metalness: 0.22,
      flatShading: true,
      transparent: true,
      opacity: 1.0,
    });
  }, []);

  const debrisList = useMemo(() => {
    return [
      // 1. Water Bottle: Top-Left (crisply visible next to H)
      {
        type: 'bottle',
        pos: [-0.88, 0.20, 0.28],
        rot: [-0.45, 0.62, -0.65],
        scale: 1.0,
        spin: [0.003, 0.005, -0.002],
        drift: 0.08,
      },
      // 2. Crumpled Bag: Right Upper Quadrant
      {
        type: 'bag',
        pos: [0.82, 0.32, 0.22],
        rot: [0.35, -0.42, 0.75],
        scale: 1.0,
        spin: [0.004, -0.003, 0.002],
        drift: 0.07,
      },
      // 3. Dented Soda Can: Right-Bottom
      {
        type: 'can',
        pos: [0.80, -0.42, 0.36],
        rot: [0.55, 0.75, -0.42],
        scale: 1.0,
        spin: [-0.003, 0.006, 0.004],
        drift: 0.10,
      },
      // 4. Foreground Asteroid Rock: Left Bottom
      {
        type: 'rock',
        geomIdx: 0,
        pos: [-0.78, -0.62, 0.40],
        rot: [0.2, 0.4, 0.1],
        scale: 0.11,
        spin: [0.002, 0.003, 0.001],
        drift: 0.12,
      },
      // 5. Small Asteroid Rock: Mid-Left
      {
        type: 'rock',
        geomIdx: 1,
        pos: [-0.58, 0.06, 0.15],
        rot: [0.6, 0.2, -0.3],
        scale: 0.030,
        spin: [-0.004, 0.003, 0.002],
        drift: 0.05,
      },
      // 6. Upper-Left Small Rock
      {
        type: 'rock',
        geomIdx: 2,
        pos: [-0.72, 0.46, 0.18],
        rot: [0.1, -0.5, 0.4],
        scale: 0.026,
        spin: [0.003, -0.002, 0.003],
        drift: 0.03,
      },
      // 7. Upper-Right Faceted Rock (near A)
      {
        type: 'rock',
        geomIdx: 3,
        pos: [0.52, 0.44, 0.22],
        rot: [0.8, -0.3, 0.5],
        scale: 0.052,
        spin: [0.003, 0.004, -0.003],
        drift: 0.06,
      },
      // 8. Far-Right Crisp Craggy Rock (Near top right of L)
      {
        type: 'rock',
        geomIdx: 1,
        pos: [0.94, 0.38, 0.25],
        rot: [-0.3, 0.6, 0.2],
        scale: 0.058,
        spin: [-0.002, 0.004, 0.003],
        drift: 0.08,
      },
      // 9. Right-Middle Craggy Rock
      {
        type: 'rock',
        geomIdx: 0,
        pos: [0.98, -0.08, 0.28],
        rot: [0.4, -0.7, 0.3],
        scale: 0.060,
        spin: [0.003, -0.002, 0.004],
        drift: 0.09,
      },
      // 10. Lower-Right Small Rock
      {
        type: 'rock',
        geomIdx: 2,
        pos: [0.58, -0.58, 0.20],
        rot: [-0.5, 0.3, 0.6],
        scale: 0.035,
        spin: [-0.003, 0.003, -0.002],
        drift: 0.05,
      },
      // 11. Lower Center-Left Small Rock
      {
        type: 'rock',
        geomIdx: 3,
        pos: [-0.38, -0.56, 0.22],
        rot: [0.3, -0.2, 0.8],
        scale: 0.030,
        spin: [0.002, -0.003, 0.002],
        drift: 0.04,
      },
    ];
  }, []);

  const itemsRef = useRef([]);

  useFrame(({ clock }, delta) => {
    if (!visible || prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    const mx = mouseRef.current ? mouseRef.current.x : 0;
    const my = mouseRef.current ? mouseRef.current.y : 0;

    itemsRef.current.forEach((itemObj, idx) => {
      if (!itemObj) return;
      const d = debrisList[idx];
      itemObj.rotation.x += d.spin[0] * delta * 60;
      itemObj.rotation.y += d.spin[1] * delta * 60;
      itemObj.rotation.z += d.spin[2] * delta * 60;

      const bobY = Math.sin(t * 0.7 + idx * 1.5) * 0.015;
      const bobX = Math.cos(t * 0.5 + idx * 1.2) * 0.012;
      itemObj.position.x = d.pos[0] + bobX + mx * d.drift;
      itemObj.position.y = d.pos[1] + bobY + my * d.drift;
      itemObj.position.z = d.pos[2];
    });

    if (groupRef.current) {
      groupRef.current.scale.setScalar(Math.max(0.001, opacity));
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {debrisList.map((d, i) => (
        <group
          key={i}
          ref={(el) => (itemsRef.current[i] = el)}
          position={d.pos}
          rotation={d.rot}
          scale={d.scale}
        >
          {d.type === 'bottle' && <BottleObject />}
          {d.type === 'can' && <SodaCanObject />}
          {d.type === 'bag' && <CrumpledBagObject />}
          {d.type === 'rock' && (
            <mesh geometry={rockGeoms[d.geomIdx]} material={rockMat} />
          )}
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

  useEffect(() => {
    camera.position.set(0, HERO_CAMERA_Y, HERO_CAMERA_Z);
    camera.lookAt(0, -0.15, 0);
  }, [camera]);

  useFrame(({ clock }, delta) => {
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
        intensity={0.9 * activeDim}
      />
      {/* Low Ambient Light: Keeps dark hemisphere deep with golden lights */}
      <ambientLight color="#050811" intensity={0.12 * activeDim} />

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
