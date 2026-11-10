import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Earth, AXIAL_TILT_X, AXIAL_TILT_Z, INITIAL_ROTATION_Y } from '../hero3d/Earth';
import { Clouds } from '../hero3d/Clouds';
import { Atmosphere } from '../hero3d/Atmosphere';
import { HERO_CONFIG } from '../../config/heroSolutions';

// ═══════════════════════════════════════════════════════════════
// TUNABLE CONSTANTS (Solutions Hero Destroyed Earth Look)
// ═══════════════════════════════════════════════════════════════
export const HERO_CAMERA_FOV = HERO_CONFIG.cameraFov;
export const HERO_CAMERA_Z = HERO_CONFIG.cameraZDesktop;
export const HERO_CAMERA_Y = 0.0;
export const HERO_PLANET_Y = HERO_CONFIG.planetYDesktop;
export const HERO_PLANET_SCALE = HERO_CONFIG.planetScaleDesktop;
export const HERO_ROTATION_SPEED = HERO_CONFIG.rotationSpeed;

// Lat/Lon to Sphere Cartesian Coordinate converter
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// ── 1. BILLBOARD SMOKE PLUMES RISING FROM FIRES ──
const SMOKE_SOURCES = [
  { lat: 18, lon: 32 },  // Sahara / Nubian desert edge
  { lat: 10, lon: 42 },  // Horn of Africa
  { lat: 28, lon: 24 },  // North Africa fissure
  { lat: 0,  lon: 34 },  // Central rift valley
  { lat: 22, lon: 48 },  // Arabian peninsula fissure
  { lat: 34, lon: 36 },  // Levant rift
  { lat: -8, lon: 26 },  // Southern rift basin
];

const SmokePlumes = ({ isLowEnd = false }) => {
  const meshRef = useRef(null);
  const count = isLowEnd ? 24 : 55;
  const { camera } = useThree();

  const smokeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(48, 50, 56, 0.90)');
    grad.addColorStop(0.35, 'rgba(38, 40, 46, 0.55)');
    grad.addColorStop(0.70, 'rgba(28, 30, 36, 0.20)');
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

  useFrame(({ clock }) => {
    if (!meshRef.current || isLowEnd) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, idx) => {
      const progress = ((t * p.speed + p.seed) % 1.0);
      const currentHeight = 1.002 + progress * 0.28;
      const pos = p.basePos.clone().normalize().multiplyScalar(currentHeight);
      
      // Wind drift towards upper atmosphere
      pos.y += progress * 0.055;
      pos.x += p.drift * progress;

      dummy.position.copy(pos);
      // Billboard facing camera
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(p.scale * (1.2 + progress * 3.2));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(idx, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={smokeTexture}
        transparent
        depthWrite={false}
        opacity={isLowEnd ? 0.35 : 0.75}
        blending={THREE.NormalBlending}
      />
    </instancedMesh>
  );
};

// ── 2. SINGLE GREEN TREE (Sign of Hope in Cracked Land) ──
const SignOfHopeTree = () => {
  const treePos = useMemo(() => {
    // Placed on visible African landmass in lower-center foreground
    return latLonToVector3(4.0, 31.0, 1.004);
  }, []);

  const orientation = useMemo(() => {
    const normal = treePos.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  }, [treePos]);

  return (
    <group position={treePos} quaternion={orientation} scale={[0.028, 0.038, 0.028]}>
      {/* Brown trunk */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.10, 0.6, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      {/* Lush Green Foliage (Sign of Hope) */}
      <mesh position={[0, 0.75, 0]}>
        <dodecahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial
          color="#34d399"
          emissive="#059669"
          emissiveIntensity={0.25}
          roughness={0.65}
        />
      </mesh>
      <mesh position={[0.1, 0.95, 0]} scale={0.75}>
        <dodecahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#10b981" roughness={0.6} />
      </mesh>
    </group>
  );
};

// ── 3. OCEAN FLOATING PLASTIC & TRASH PATCHES ──
const OceanSurfaceDebris = ({ isLowEnd = false }) => {
  const meshRef = useRef(null);
  const count = isLowEnd ? 25 : 60;

  const positions = useMemo(() => {
    const pts = [];
    // Coastal ocean gyres and current boundaries (off West Africa, Indian Ocean)
    const oceanClusters = [
      { lat: -5, lon: -10 },
      { lat: 12, lon: 62 },
      { lat: -15, lon: 58 },
      { lat: 5, lon: 75 },
    ];
    for (let i = 0; i < count; i++) {
      const center = oceanClusters[i % oceanClusters.length];
      const lat = center.lat + (Math.random() - 0.5) * 12.0;
      const lon = center.lon + (Math.random() - 0.5) * 16.0;
      const pos = latLonToVector3(lat, lon, 1.003);
      const normal = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      pts.push({ pos, quat, scale: 0.007 + Math.random() * 0.012 });
    }
    return pts;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    positions.forEach((p, i) => {
      dummy.position.copy(p.pos);
      dummy.quaternion.copy(p.quat);
      dummy.scale.set(p.scale, p.scale * 0.6, p.scale * 1.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#e2e8f0"
        roughness={0.7}
        metalness={0.1}
      />
    </instancedMesh>
  );
};

// ── 4. FAINT ORBITING DEBRIS RING DRIFTING IN FRONT OF PLANET ──
const OrbitalDebrisRing = ({ isLowEnd = false }) => {
  const groupRef = useRef(null);
  const count = isLowEnd ? 18 : 36;

  const debris = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 1.08 + Math.random() * 0.32;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.35 + Math.sin(angle * 2) * 0.15;
      items.push({
        pos: [x, y, z],
        rotSpeed: [Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.02],
        scale: 0.008 + Math.random() * 0.018,
        type: i % 3,
      });
    }
    return items;
  }, [count]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.014;
      groupRef.current.rotation.z += delta * 0.003;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.42, 0.2, -0.3]}>
      {debris.map((d, i) => (
        <mesh key={i} position={d.pos} scale={d.scale}>
          {d.type === 0 && <cylinderGeometry args={[0.4, 0.4, 1.2, 5]} />}
          {d.type === 1 && <boxGeometry args={[0.8, 0.8, 0.8]} />}
          {d.type === 2 && <dodecahedronGeometry args={[0.6, 0]} />}
          <meshStandardMaterial
            color={d.type === 0 ? '#cbd5e1' : d.type === 1 ? '#78716c' : '#334155'}
            roughness={0.8}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

// ── 5. SCENE CONTROLLER (Camera Drift, Slow Spin, Planet Group) ──
const HeroPlanetController = ({ liteMode = false }) => {
  const planetGroupRef = useRef(null);
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = size.width < 768 || aspect < 1.05;

  const targetPlanetY = isMobile ? HERO_CONFIG.planetYMobile : HERO_CONFIG.planetYDesktop;
  const targetScale = isMobile ? HERO_CONFIG.planetScaleMobile : HERO_CONFIG.planetScaleDesktop;
  const targetCamZ = isMobile ? HERO_CONFIG.cameraZMobile : HERO_CONFIG.cameraZDesktop;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    camera.position.set(0, HERO_CAMERA_Y, targetCamZ);
    camera.lookAt(0, -0.15, 0);
  }, [camera, targetCamZ]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Rotate locked planet group very slowly (~1 revolution per 4 minutes)
    if (planetGroupRef.current && !prefersReducedMotion) {
      planetGroupRef.current.rotation.y += delta * HERO_ROTATION_SPEED;
    }

    // Subtle natural camera drift for depth
    if (!prefersReducedMotion) {
      const driftX = Math.sin(t * 0.18) * 0.022;
      const driftY = Math.cos(t * 0.22) * 0.012;
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
        intensity={2.8}
      />
      {/* Subtle Blue Secondary Fill */}
      <directionalLight
        position={[-1.0, -1.0, 0.5]}
        color="#38bdf8"
        intensity={0.4}
      />
      {/* Low Ambient Light: Keeps right side in deep shadow */}
      <ambientLight color="#050811" intensity={0.12} />

      {/* ── Master Planet Group (Single Transform Hierarchy for Earth + Surface Objects) ── */}
      <group
        ref={planetGroupRef}
        position={[0, targetPlanetY, 0]}
        scale={targetScale}
        rotation={[AXIAL_TILT_X + 0.14, INITIAL_ROTATION_Y - 0.28, AXIAL_TILT_Z]}
      >
        {/* Core Destroyed Earth with High-Res NASA Textures & Procedural Fissures */}
        <Earth
          pollution={1.0}
          autoRotate={false}
          heroSolutions={true}
          isLowEnd={liteMode}
        />

        {/* Cloud Layer with Slow Parallax */}
        <Clouds pollution={1.0} />

        {/* Atmospheric Rim in Cold Blue-Grey (Zero Amber Halo) */}
        <Atmosphere pollution={1.0} coldRim={true} />

        {/* Billowing Smoke Plumes rising into space */}
        <SmokePlumes isLowEnd={liteMode} />

        {/* Ocean Surface Plastic & Debris Clusters */}
        <OceanSurfaceDebris isLowEnd={liteMode} />

        {/* Tiny Green Tree of Hope in Lower Cracked Continent */}
        <SignOfHopeTree />

        {/* Orbiting Debris Ring in Foreground Space */}
        <OrbitalDebrisRing isLowEnd={liteMode} />
      </group>
    </>
  );
};

// ── 6. EXPORTED CANVAS SCENE COMPONENT ──
export const SolutionsHeroScene = ({ isVisible = true, liteMode = false }) => {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: !liteMode,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, HERO_CAMERA_Y, HERO_CAMERA_Z], fov: HERO_CAMERA_FOV }}
      dpr={[1, liteMode ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
      frameloop={isVisible ? 'always' : 'never'}
      className="w-full h-full pointer-events-none"
    >
      <HeroPlanetController liteMode={liteMode} />
    </Canvas>
  );
};

export default SolutionsHeroScene;
