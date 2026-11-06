import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EarthSphere } from './EarthSphere';
import { AtmosphereSphere } from './AtmosphereSphere';
import { SmogLayer } from './SmogLayer';
import { LeafParticles } from './LeafParticles';
import { EarthFallback2D } from './EarthFallback2D';

interface EarthCanvasProps {
  healProgress: number; // 0.0 to 1.0
  scrollRotation?: number; // radians offset
  isLowPower?: boolean;
}

/**
 * Procedural Cosmic Starfield
 * Lightweight mathematical points (no image downloads)
 */
const SubtleStarfield: React.FC = () => {
  const [positions] = useState(() => {
    const coords = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 50;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 50;
      coords[i * 3 + 2] = -12 - Math.random() * 25;
    }
    return coords;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#c7d2fe"
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * EarthCanvas Container
 * 
 * Houses the 3D scene with R3F:
 * - Full uncropped 3D sphere with visible continents, oceans, clouds, and atmosphere.
 * - Perfectly centered behind the hero typography (matching Target Design B).
 * - Capped DPR (max 2) for digital sustainability.
 * - Instant fallback to zero-GPU 2D vector graphic in Low-Power mode.
 */
export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  healProgress,
  scrollRotation = 0,
  isLowPower = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Low-Power mode: swap 3D WebGL completely for lightweight 2D SVG
  if (isLowPower) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <EarthFallback2D healProgress={healProgress} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        camera={{ position: [0, 0, 3.1], fov: 42 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Ambient space light */}
          <ambientLight intensity={0.25} />
          {/* Directional Sun light */}
          <directionalLight position={[3.2, 1.8, 2.2]} intensity={2.0} />

          {/* Cosmic background stars */}
          <SubtleStarfield />

          {/* Centered Earth group - positioned with comfortable margins to prevent any cropping */}
          <group position={[0, isMobile ? 0.05 : 0.12, 0]}>
            <EarthSphere
              healProgress={healProgress}
              scrollRotation={scrollRotation}
              lowDetail={isMobile}
            />
            <SmogLayer
              healProgress={healProgress}
              lowDetail={isMobile}
            />
            <AtmosphereSphere
              healProgress={healProgress}
              lowDetail={isMobile}
            />
            <LeafParticles
              healProgress={healProgress}
              count={isMobile ? 120 : 250}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};
