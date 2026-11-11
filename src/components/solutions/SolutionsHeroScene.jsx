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

// ── 2. REALISTIC PLASTIC WATER BOTTLE (Image 1 Reference) ──
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

// ── 3. DENTED METALLIC SODA CAN (Image 1 Reference) ──
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

// ── 5. CINEMATIC FLOATING DEBRIS & ASTEROIDS FIELD (Image 1 Reference Match) ──
const FloatingDebrisField = ({ mouseRef, prefersReducedMotion = false }) => {
  const groupRef = useRef(null);

  // Rock Geometries
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
    });
  }, []);

  // 8-12 floating objects positioned matching target Reference Image 1
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
      // 3. Dented Soda Can: Right-Bottom (lower down in space)
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
    if (prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    const mx = mouseRef.current ? mouseRef.current.x : 0;
    const my = mouseRef.current ? mouseRef.current.y : 0;

    itemsRef.current.forEach((itemObj, idx) => {
      if (!itemObj) return;
      const d = debrisList[idx];
      // Slow realistic tumble
      itemObj.rotation.x += d.spin[0] * delta * 60;
      itemObj.rotation.y += d.spin[1] * delta * 60;
      itemObj.rotation.z += d.spin[2] * delta * 60;

      // Gentle floating bob & mouse parallax
      const bobY = Math.sin(t * 0.7 + idx * 1.5) * 0.015;
      const bobX = Math.cos(t * 0.5 + idx * 1.2) * 0.012;
      itemObj.position.x = d.pos[0] + bobX + mx * d.drift;
      itemObj.position.y = d.pos[1] + bobY + my * d.drift;
      itemObj.position.z = d.pos[2];
    });
  });

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

// ── 7. SCENE CONTROLLER (Camera Drift, Slow Spin, Mouse Parallax, Lighting) ──
const HeroPlanetController = ({ liteMode = false, mouseRef }) => {
  const planetGroupRef = useRef(null);
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isMobile = size.width < 768 || aspect < 1.05;

  const targetPlanetY = isMobile ? HERO_CONFIG.planetYMobile : HERO_CONFIG.planetYDesktop;
  const targetPlanetX = isMobile ? HERO_CONFIG.planetXMobile : HERO_CONFIG.planetXDesktop;
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
    const mx = mouseRef.current ? mouseRef.current.x : 0;
    const my = mouseRef.current ? mouseRef.current.y : 0;

    // Rotate locked planet group very slowly (~1 revolution per 5 minutes)
    if (planetGroupRef.current && !prefersReducedMotion) {
      planetGroupRef.current.rotation.y += delta * HERO_ROTATION_SPEED;
      // Gentle mouse tilt
      planetGroupRef.current.rotation.x = (AXIAL_TILT_X + 0.14) + my * 0.035;
      planetGroupRef.current.rotation.z = AXIAL_TILT_Z - mx * 0.035;
    }

    // Subtle natural camera drift + mouse parallax for deep cinematic dimension
    if (!prefersReducedMotion) {
      const driftX = Math.sin(t * 0.18) * 0.020 + mx * 0.06;
      const driftY = Math.cos(t * 0.22) * 0.012 + my * 0.04;
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
        intensity={3.0}
      />
      {/* Intense Cyan Horizon Rim Light */}
      <directionalLight
        position={[-0.8, 2.4, 0.4]}
        color="#38bdf8"
        intensity={1.8}
      />
      {/* Specular Glint Light for Floating Debris & Asteroids */}
      <directionalLight
        position={[1.8, 1.2, 1.6]}
        color="#bae6fd"
        intensity={0.9}
      />
      {/* Low Ambient Light: Keeps right side in deep shadow with golden city lights */}
      <ambientLight color="#050811" intensity={0.10} />

      {/* ── Master Planet Group (Shifted slightly right and down for perfect composition) ── */}
      <group
        ref={planetGroupRef}
        position={[targetPlanetX, targetPlanetY, 0]}
        scale={targetScale}
        rotation={[AXIAL_TILT_X + 0.14, INITIAL_ROTATION_Y - 0.28, AXIAL_TILT_Z]}
      >
        {/* Core Destroyed Earth with High-Res NASA Textures & Procedural Lava Fault Lines */}
        <Earth
          pollution={1.0}
          autoRotate={false}
          heroSolutions={true}
          isLowEnd={liteMode}
        />

        {/* Cloud Layer with Slow Parallax */}
        <Clouds pollution={1.0} />

        {/* Atmospheric Rim in Vivid Electric Cyan */}
        <Atmosphere pollution={1.0} coldRim={true} />

        {/* Billowing Smoke Plumes rising over damaged rifts */}
        <SmokePlumes isLowEnd={liteMode} />
      </group>

      {/* ── Floating Debris & Asteroids Field in Foreground Space (Image 1 Reference) ── */}
      <FloatingDebrisField
        mouseRef={mouseRef}
        prefersReducedMotion={prefersReducedMotion}
      />
    </>
  );
};

// ── 8. EXPORTED CANVAS SCENE COMPONENT ──
export const SolutionsHeroScene = ({ isVisible = true, liteMode = false }) => {
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

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
      <HeroPlanetController liteMode={liteMode} mouseRef={mouseRef} />
    </Canvas>
  );
};

export default SolutionsHeroScene;
