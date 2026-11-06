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
 * StarField component for cosmic depth
 * Lightweight procedural points (no textures)
 */
const SubtleStarfield: React.FC = () => {
  const [positions] = useState(() => {
    const coords = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 40;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 40;
      coords[i * 3 + 2] = -10 - Math.random() * 20;
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
        size={0.08}
        color="#8da2fb"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * EarthCanvas Container
 * 
 * Houses the 3D scene with R3F:
 * - Earth sphere with custom GLSL procedural healing shader.
 * - Atmosphere glow halo.
 * - Smog dissipation layer.
 * - Floating leaf and spore particle system.
 * - Automatic hardware-capped pixel ratio (max 2) for sustainable power usage.
 * - Seamless fallback to EarthFallback2D when low-power mode is enabled.
 */
export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  healProgress,
  scrollRotation = 0,
  isLowPower = false,
}) => {
  // Mobile / small screen detection to reduce geometry workload
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
        camera={{ position: [0, 0, 2.7], fov: 45 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        className="w-full h-full pointer-events-auto"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.25} />
          <directionalLight position={[3, 2, 2]} intensity={1.8} />

          {/* Background subtle star field */}
          <SubtleStarfield />

          {/* Group containing all Earth planetary components */}
          <group position={[0, 0, 0]}>
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
