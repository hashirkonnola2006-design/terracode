import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StarShaderMaterial } from './shaders/starShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Space Background)
// ═══════════════════════════════════════════════════════════════
export const TOTAL_STARS = 6500;       // 6,500 crisp stars across the celestial vault
export const NEBULA_OPACITY = 0.38;    // Subtle deep indigo/violet cosmic dust
export const STAR_BASE_SIZE = 1.05;

/**
 * Procedural deep space nebula texture: subtle celestial dust cloud on the right
 */
function createNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 1024);

  // Soft purple-indigo dust clouds on right side
  const grad1 = ctx.createRadialGradient(680, 512, 40, 680, 512, 480);
  grad1.addColorStop(0.0, 'rgba(75, 45, 140, 0.40)');
  grad1.addColorStop(0.35, 'rgba(45, 25, 95, 0.22)');
  grad1.addColorStop(0.7, 'rgba(18, 14, 55, 0.08)');
  grad1.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, 1024, 1024);

  // Deep sapphire / cyan cosmic rim
  const grad2 = ctx.createRadialGradient(780, 420, 20, 780, 420, 360);
  grad2.addColorStop(0.0, 'rgba(25, 75, 145, 0.30)');
  grad2.addColorStop(0.5, 'rgba(12, 38, 85, 0.14)');
  grad2.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const SpaceBackground = () => {
  const pointsRef = useRef(null);
  const matRef = useRef(null);

  const nebulaTex = useMemo(() => createNebulaTexture(), []);

  // Generate 6,500 natural celestial stars
  const [positions, sizes, colors, twinkleOffsets] = useMemo(() => {
    const total = TOTAL_STARS;
    const pos = new Float32Array(total * 3);
    const siz = new Float32Array(total);
    const col = new Float32Array(total * 3);
    const twk = new Float32Array(total);

    // Stellar spectral types
    const palettes = [
      new THREE.Color('#ffffff'), // Pure white (40%)
      new THREE.Color('#ffffff'),
      new THREE.Color('#dceeff'), // Pale sapphire (30%)
      new THREE.Color('#fff4e0'), // Warm golden (20%)
      new THREE.Color('#bee5ff'), // Soft cyan (10%)
    ];

    for (let i = 0; i < total; i++) {
      // Natural spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 32 + Math.random() * 45;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Varied magnitudes: mostly subtle pinpricks, a few brighter beacon stars
      const isBright = Math.random() < 0.04;
      siz[i] = STAR_BASE_SIZE * (isBright ? (1.5 + Math.random() * 1.0) : (0.5 + Math.random() * 0.7));

      const c = palettes[Math.floor(Math.random() * palettes.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      twk[i] = Math.random() * 6.28;
    }

    return [pos, siz, col, twk];
  }, []);

  const uniforms = useMemo(() => {
    return THREE.UniformsUtils.clone(StarShaderMaterial.uniforms);
  }, []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* Deep space void backdrop */}
      <mesh position={[0, 0, -42]}>
        <planeGeometry args={[110, 110]} />
        <meshBasicMaterial color="#02050e" depthWrite={false} />
      </mesh>

      {/* Subtle Milky Way cosmic dust plane on the right */}
      <mesh position={[14, 1, -28]} rotation={[0, 0, -0.25]}>
        <planeGeometry args={[36, 36]} />
        <meshBasicMaterial
          map={nebulaTex}
          transparent={true}
          opacity={NEBULA_OPACITY}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 6,500 Crisp Pinprick Stars */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-aTwinkleOffset"
            args={[twinkleOffsets, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={StarShaderMaterial.vertexShader}
          fragmentShader={StarShaderMaterial.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
