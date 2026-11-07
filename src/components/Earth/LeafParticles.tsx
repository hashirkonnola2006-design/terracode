import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LeafParticlesProps {
  healProgress: number; // 0 to 1
  count?: number;
}

/**
 * Floating Leaf & Bio-luminescent Spore Particles
 * 
 * STRICT REQUIREMENT (Bug 5 fix):
 * - Particles only appear as Earth heals (healProgress >= 0.18).
 * - Hidden completely on Hero (healProgress < 0.18).
 * - Rendered as crisp emerald leaves / organic spores (NO white or yellow core star sprites!).
 */
export const LeafParticles: React.FC<LeafParticlesProps> = ({
  healProgress,
  count = 200,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);

  // Generate particle positions and varying emerald green colors
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const leafPalette = [
      new THREE.Color('#4ade80'), // vibrant emerald green
      new THREE.Color('#22c55e'), // fresh foliage green
      new THREE.Color('#16a34a'), // rich forest green
      new THREE.Color('#10b981'), // bio-luminescent teal green
    ];

    for (let i = 0; i < count; i++) {
      // Distribute in a spherical orbit around Earth (radius 1.25 to 2.1)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.25 + Math.random() * 0.85;

      const sinPhi = Math.sin(phi);
      pos[i * 3]     = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = leafPalette[Math.floor(Math.random() * leafPalette.length)];
      col[i * 3]     = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, [count]);

  // Leaf texture: clean organic leaf silhouette with soft green glow (NO yellow, NO white star core!)
  const leafTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw leaf shape
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(Math.PI / 4);

    // Green radial gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.95)');
    gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.70)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(14, 0, 0, 20);
    ctx.quadraticCurveTo(-14, 0, 0, -20);
    ctx.fill();

    ctx.restore();
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;

    // Slow orbital swirling around the healing Earth
    pointsRef.current.rotation.y += delta * 0.08;
    pointsRef.current.rotation.x += delta * 0.03;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (material) {
      // Fade in smoothly only when healProgress >= 0.18
      const targetOpacity = healProgress < 0.18 ? 0 : Math.min(1, (healProgress - 0.18) * 1.6);
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
      material.size = THREE.MathUtils.lerp(
        material.size,
        0.055 * Math.max(0.1, healProgress),
        0.1
      );
    }
  });

  // Strictly hidden on Hero (healProgress < 0.18)
  const isVisible = healProgress >= 0.18;

  return (
    <group visible={isVisible}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          map={leafTexture}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
