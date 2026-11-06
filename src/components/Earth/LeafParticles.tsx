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
 * Only appear and swirl around the globe as planetary healing progresses (uHeal > 0.15).
 * Swirls organically in a gentle solar-wind orbit around the greening continents.
 */
export const LeafParticles: React.FC<LeafParticlesProps> = ({
  healProgress,
  count = 250,
}) => {
  const pointsRef = useRef<THREE.Points>(null!);

  // Generate particle positions and varying colors
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const leafPalette = [
      new THREE.Color('#4ade80'), // vibrant emerald
      new THREE.Color('#86efac'), // light spring green
      new THREE.Color('#22c55e'), // forest green
      new THREE.Color('#38bdf8'), // clean water droplet cyan
      new THREE.Color('#a7f3d0'), // pale bio-glow
    ];

    for (let i = 0; i < count; i++) {
      // Distribute in a spherical halo around Earth (radius 1.25 to 2.1)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.25 + Math.random() * 0.85;

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const chosenColor = leafPalette[Math.floor(Math.random() * leafPalette.length)];
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, [count]);

  // Texture for rounded soft organic particle
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw glowing leaf/oval shape
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(74, 222, 128, 0.85)');
    gradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(32, 32, 28, 16, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;

    // Slow orbital rotation around the Earth
    pointsRef.current.rotation.y += delta * 0.12;
    pointsRef.current.rotation.x += delta * 0.04;

    // Fade in and out based on healProgress
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (material) {
      // Particles begin to awaken at heal >= 0.2, reaching full vibrance at heal >= 0.8
      const targetOpacity = Math.max(0, Math.min(1, (healProgress - 0.2) * 1.4));
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.08);
      material.size = THREE.MathUtils.lerp(
        material.size,
        0.06 * Math.max(0.1, healProgress),
        0.08
      );
    }
  });

  return (
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
        size={0.06}
        map={particleTexture}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
