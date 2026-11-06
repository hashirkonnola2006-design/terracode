import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EarthSphere } from './EarthSphere';
import { SmogLayer } from './SmogLayer';
import { LeafParticles } from './LeafParticles';
import { EarthFallback2D } from './EarthFallback2D';

/* ═══════════════════════════════════════════════════════════
   STARFIELD (3-layer, 3 000 points, procedural twinkle)
   ═══════════════════════════════════════════════════════════
   Three depth layers with different sizes simulate perspective.
   Twinkle is a cheap sin(time + phase) on opacity inside the shader.
*/
interface StarfieldLayer {
  count:  number;
  spread: number;
  depth:  number;
  size:   number;
}

const STAR_LAYERS: StarfieldLayer[] = [
  { count: 1200, spread: 60, depth: -18, size: 0.055 }, // far stars, tiny
  { count:  900, spread: 45, depth: -12, size: 0.090 }, // mid stars
  { count:  600, spread: 30, depth:  -7, size: 0.130 }, // near stars, brighter
];

// Vertex shader concept: add per-star phase for cheap twinkle (unused — using opacity lerp instead)

const StarLayer: React.FC<StarfieldLayer & { mobile: boolean }> = ({
  count, spread, depth, size, mobile,
}) => {
  const matRef = useRef<THREE.PointsMaterial>(null!);
  const realCount = mobile ? Math.round(count * 0.45) : count;

  const positions = useMemo(() => {
    const a = new Float32Array(realCount * 3);
    for (let i = 0; i < realCount; i++) {
      // Uniform distribution on a flat plane + slight Z scatter
      a[i*3]   = (Math.random() - 0.5) * spread;
      a[i*3+1] = (Math.random() - 0.5) * spread;
      a[i*3+2] = depth - Math.random() * 5;
    }
    return a;
  }, [realCount, spread, depth]);

  // Per-star twinkle phase stored as an attribute (0…2π)
  const phases = useMemo(() => {
    const a = new Float32Array(realCount);
    for (let i = 0; i < realCount; i++) a[i] = Math.random() * Math.PI * 2;
    return a;
  }, [realCount]);

  // Animate opacity with gentle sin to fake twinkling
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity = 0.55 + 0.30 * Math.sin(clock.elapsedTime * 0.9);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase"   args={[phases,    1]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={size}
        color="#dde8ff"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

/* ═══════════════════════════════════════════════════════════
   NEBULA GLOW (simple dark-blue plane with additive blending)
   Sits behind the starfield to give a soft galactic atmosphere.
   ═══════════════════════════════════════════════════════════ */
const NebulaGlow: React.FC = () => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.02, 0.06, 0.18),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  return (
    <mesh position={[0, 0, -24]}>
      <planeGeometry args={[80, 60]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

/* ═══════════════════════════════════════════════════════════
   EARTH CANVAS
   ═══════════════════════════════════════════════════════════ */
interface EarthCanvasProps {
  healProgress:   number;
  scrollRotation?: number;
  isLowPower?:    boolean;
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  healProgress,
  scrollRotation = 0,
  isLowPower = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isLowPower) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <EarthFallback2D healProgress={healProgress} />
      </div>
    );
  }

  return (
    /*
     * The <Canvas> must be TRANSPARENT (alpha:true + no background colour)
     * so the CSS nebula gradient behind it shows through.
     * The outer div has NO background colour – the page bg (#030712)
     * and the CSS nebula gradient provide the space environment.
     */
    <Canvas
      camera={{ position: [0, 0, 2.75], fov: 38 }}
      dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {/* ── Nebula plane (deepest background) ── */}
        <NebulaGlow />

        {/* ── Starfield (3 depth layers) ── */}
        {STAR_LAYERS.map((layer, i) => (
          <StarLayer key={i} {...layer} mobile={isMobile} />
        ))}

        {/*
          Sun light from upper-left matches the uSunDir uniform in
          earthShader.ts so built-in cloud lighting is consistent.
          Position: [ -4, 3, 2 ] → normalises to roughly [-1.6, 1.2, 0.8]
        */}
        <ambientLight    intensity={0.18} />
        <directionalLight
          position={[-4, 3, 2]}
          intensity={2.4}
          castShadow={false}
        />

        {/*
          Earth group positioned slightly below center so the top of
          the sphere clears the navbar (navbar is ~72px ≈ 0.08 world units).
          Negative Y shifts the sphere DOWN in view space.
        */}
        <group position={[0, -0.05, 0]}>
          <EarthSphere
            healProgress={healProgress}
            scrollRotation={scrollRotation}
            lowDetail={isMobile}
          />
          <SmogLayer
            healProgress={healProgress}
            lowDetail={isMobile}
          />
          <LeafParticles
            healProgress={healProgress}
            count={isMobile ? 80 : 220}
          />
        </group>
      </Suspense>
    </Canvas>
  );
};
