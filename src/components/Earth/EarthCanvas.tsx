import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EarthSphere } from './EarthSphere';
import { LeafParticles } from './LeafParticles';
import { EarthFallback2D } from './EarthFallback2D';

interface StarfieldLayer {
  count:  number;
  spread: number;
  depth:  number;
  size:   number;
}

const STAR_LAYERS: StarfieldLayer[] = [
  { count: 1500, spread: 65, depth: -20, size: 0.055 }, // far stars
  { count: 1000, spread: 48, depth: -13, size: 0.085 }, // mid stars
  { count:  600, spread: 32, depth:  -7, size: 0.120 }, // foreground bright stars
];

const StarLayer: React.FC<StarfieldLayer & { mobile: boolean; mousePos: { x: number; y: number } }> = ({
  count, spread, depth, size, mobile, mousePos,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.PointsMaterial>(null!);
  const realCount = mobile ? Math.round(count * 0.45) : count;

  const positions = useMemo(() => {
    const a = new Float32Array(realCount * 3);
    for (let i = 0; i < realCount; i++) {
      a[i * 3]     = (Math.random() - 0.5) * spread;
      a[i * 3 + 1] = (Math.random() - 0.5) * spread;
      a[i * 3 + 2] = depth - Math.random() * 5;
    }
    return a;
  }, [realCount, spread, depth]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      // Gentle sine twinkle
      matRef.current.opacity = 0.55 + 0.35 * Math.sin(clock.elapsedTime * 1.1 + depth);
    }
    if (pointsRef.current) {
      // Subtle mouse parallax depth
      const parallaxFactor = 0.15 / Math.abs(depth);
      pointsRef.current.position.x = THREE.MathUtils.lerp(
        pointsRef.current.position.x,
        mousePos.x * parallaxFactor * 10,
        0.05
      );
      pointsRef.current.position.y = THREE.MathUtils.lerp(
        pointsRef.current.position.y,
        mousePos.y * parallaxFactor * 10,
        0.05
      );
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={size}
        color="#e0eaff"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const NebulaGlow: React.FC = () => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.015, 0.055, 0.14),
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  return (
    <mesh position={[0, 0, -22]}>
      <planeGeometry args={[90, 65]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

interface EarthControllerProps {
  healProgress:   number;
  scrollProgress: number;
  scrollVelocity: number;
  mobile:         boolean;
  mousePos:       { x: number; y: number };
  reducedMotion:  boolean;
}

/**
 * EarthController
 * 
 * Smoothly interpolates the Earth's position and scale across story sections:
 * - Hero: Centered, large [0, -0.05, 0], scale 1.0
 * - Stats / About: Centered, slightly smaller [0, 0, 0], scale 0.82
 * - Impact Step 1 (Energy): Slides right [0.65, 0.02, 0], scale 0.90
 * - Impact Step 2 (Forests): Slides left [-0.65, 0.02, 0], scale 0.90
 * - Impact Step 3 (Water): Slides right [0.65, 0.02, 0], scale 0.90
 * - Healed moment: Centered, large, bright [0, 0, 0], scale 1.06
 * - Get Involved / Footer: Centered, calm [0, -0.06, 0], scale 0.85
 * 
 * Also drives idle rotation + scroll-velocity-proportional spin.
 */
const EarthController: React.FC<EarthControllerProps> = ({
  healProgress,
  scrollProgress,
  scrollVelocity,
  mobile,
  mousePos,
  reducedMotion,
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const currentRotation = useRef(0);
  const smoothedVelocity = useRef(0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // 1. Calculate section-based target position and scale
    let targetX = 0;
    let targetY = -0.05;
    let targetScale = 1.0;

    if (scrollProgress < 0.16) {
      // Hero: centered, large
      targetX = 0;
      targetY = mobile ? 0.08 : -0.05;
      targetScale = mobile ? 0.82 : 1.0;
    } else if (scrollProgress < 0.38) {
      // Stats & About: centered, slightly smaller
      targetX = 0;
      targetY = mobile ? 0.12 : 0.0;
      targetScale = mobile ? 0.70 : 0.82;
    } else if (scrollProgress < 0.54) {
      // Impact Step 1 (Clean Energy): card on left, Earth slides right
      targetX = mobile ? 0.0 : 0.65;
      targetY = mobile ? 0.16 : 0.02;
      targetScale = mobile ? 0.68 : 0.90;
    } else if (scrollProgress < 0.70) {
      // Impact Step 2 (Forests): card on right, Earth slides left
      targetX = mobile ? 0.0 : -0.65;
      targetY = mobile ? 0.16 : 0.02;
      targetScale = mobile ? 0.68 : 0.90;
    } else if (scrollProgress < 0.84) {
      // Impact Step 3 (Water & Waste): card on left, Earth slides right
      targetX = mobile ? 0.0 : 0.65;
      targetY = mobile ? 0.16 : 0.02;
      targetScale = mobile ? 0.68 : 0.90;
    } else if (scrollProgress < 0.94) {
      // Healed Moment: back to center, large and glowing
      targetX = 0;
      targetY = mobile ? 0.06 : 0.0;
      targetScale = mobile ? 0.85 : 1.06;
    } else {
      // Get Involved & Footer: centered and calm
      targetX = 0;
      targetY = mobile ? 0.05 : -0.05;
      targetScale = mobile ? 0.72 : 0.86;
    }

    // Smoothly lerp position and scale
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.06);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.06);
    groupRef.current.scale.set(s, s, s);

    // 2. Mouse Parallax Tilt
    if (!reducedMotion) {
      const tiltX = 0.16 + mousePos.y * 0.10;
      const tiltZ = 0.04 - mousePos.x * 0.10;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 0.06);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 0.06);
    }

    // 3. Dynamic Rotation: Idle spin + Scroll Velocity Spin
    smoothedVelocity.current = THREE.MathUtils.lerp(smoothedVelocity.current, scrollVelocity, 0.1);
    const idleSpin = delta * 0.05;
    const scrollSpin = reducedMotion ? 0 : smoothedVelocity.current * 0.003;
    currentRotation.current += idleSpin + scrollSpin;
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]}>
      <EarthSphere
        healProgress={healProgress}
        scrollRotation={currentRotation.current}
        lowDetail={mobile}
      />
      <LeafParticles
        healProgress={healProgress}
        count={mobile ? 75 : 200}
      />
    </group>
  );
};

export interface EarthCanvasProps {
  healProgress:   number;
  scrollProgress: number;
  scrollVelocity: number;
  isLowPower?:    boolean;
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  healProgress,
  scrollProgress,
  scrollVelocity,
  isLowPower = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (isLowPower) {
    return (
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <EarthFallback2D healProgress={healProgress} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 2.85], fov: 38 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Deep space nebula */}
          <NebulaGlow />

          {/* 3-Depth Starfield */}
          {STAR_LAYERS.map((layer, i) => (
            <StarLayer
              key={i}
              {...layer}
              mobile={isMobile}
              mousePos={mousePos}
            />
          ))}

          {/* Sun Directional Light matching uSunDir [-1.6, 1.2, 1.0] */}
          <ambientLight intensity={0.20} />
          <directionalLight
            position={[-4.5, 3.2, 2.5]}
            intensity={2.5}
            castShadow={false}
          />

          {/* Section-Aware Scroll-Driven Earth */}
          <EarthController
            healProgress={healProgress}
            scrollProgress={scrollProgress}
            scrollVelocity={scrollVelocity}
            mobile={isMobile}
            mousePos={mousePos}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
