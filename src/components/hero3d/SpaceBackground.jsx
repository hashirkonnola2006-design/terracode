import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  StarShaderMaterial,
  NebulaShaderMaterial,
  ShootingStarMaterial,
} from './shaders/starShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Space Background & Celestial Vault)
// ═══════════════════════════════════════════════════════════════
export const QUALITY_TIER = 'AUTO'; // 'HIGH' | 'MEDIUM' | 'LOW' | 'AUTO'

export const STARS_COUNT_HIGH   = 6500;
export const STARS_COUNT_MEDIUM = 3800;
export const STARS_COUNT_LOW    = 1800;

export const NEBULA_OPACITY = 0.36;    // Subtle deep indigo/violet cosmic dust
export const STAR_BASE_SIZE = 1.15;    // Crisp celestial pinpricks

export const PARALLAX_STARS_STRENGTH  = 0.035;
export const PARALLAX_NEBULA_STRENGTH = 0.016;

export const SHOOTING_STAR_INTERVAL_MIN = 9.0;  // Seconds between shooting stars
export const SHOOTING_STAR_INTERVAL_MAX = 15.0;
export const SHOOTING_STAR_DURATION     = 1.15; // Flight duration in seconds

export const SpaceBackground = ({
  mousePos = { x: 0, y: 0 },
  reducedMotion = false,
  qualityOverride = null
}) => {
  const { gl } = useThree();

  const starsGroupRef   = useRef(null);
  const nebulaMeshRef   = useRef(null);
  const shootingStarRef = useRef(null);

  const starMatRef     = useRef(null);
  const nebulaMatRef   = useRef(null);
  const shootMatRef    = useRef(null);

  // Pre-allocated vectors for shooting star flight path (Zero GC allocations in useFrame)
  const shootStartPosRef = useRef(new THREE.Vector3());
  const shootEndPosRef   = useRef(new THREE.Vector3());
  const shootCurPosRef   = useRef(new THREE.Vector3());
  const shootTimerRef    = useRef({
    nextTriggerTime: 8.0,
    startTime: 0,
    active: false,
  });

  // Determine active quality tier
  const activeTier = useMemo(() => {
    if (qualityOverride) return qualityOverride;
    if (QUALITY_TIER !== 'AUTO') return QUALITY_TIER;

    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const lowThreads = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
      if (isMobile || lowThreads) return 'LOW';
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 8) return 'MEDIUM';
    }
    return 'HIGH';
  }, [qualityOverride]);

  const starCount = useMemo(() => {
    if (activeTier === 'LOW') return STARS_COUNT_LOW;
    if (activeTier === 'MEDIUM') return STARS_COUNT_MEDIUM;
    return STARS_COUNT_HIGH;
  }, [activeTier]);

  // ── 1. PROCEDURAL FORWARD-WEIGHTED CELESTIAL STARS ──
  const [positions, sizes, colors, twkSpeeds, twkAmps, twkPhases, beacons] = useMemo(() => {
    const total = starCount;
    const pos = new Float32Array(total * 3);
    const siz = new Float32Array(total);
    const col = new Float32Array(total * 3);
    const spd = new Float32Array(total);
    const amp = new Float32Array(total);
    const phs = new Float32Array(total);
    const bcn = new Float32Array(total);

    // Natural stellar spectral types
    const palettes = [
      new THREE.Color('#ffffff'), // O/B-type Diamond White (45%)
      new THREE.Color('#ffffff'),
      new THREE.Color('#dceeff'), // A-type Pale Sapphire (25%)
      new THREE.Color('#fff4de'), // G-type Solar Golden (20%)
      new THREE.Color('#c5e8ff'), // B-type Electric Cyan (10%)
    ];

    let seed = 98765;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < total; i++) {
      // Forward-weighted distribution: all stars placed in front hemispherical frustum (-Z)
      // Generous field of view so stars fill screen even during parallax
      let x, y, z;
      const isMilkyWay = rand() < 0.28;

      if (isMilkyWay) {
        // Dense subtle galactic stream drifting from top-right to center
        const t = (rand() - 0.5) * 2.0;
        x = 10.0 + t * 24.0 + (rand() - 0.5) * 8.0;
        y =  6.0 - t * 18.0 + (rand() - 0.5) * 6.0;
        z = -35.0 - rand() * 25.0;
      } else {
        const spreadX = 42.0;
        const spreadY = 28.0;
        x = (rand() - 0.5) * spreadX * 2.2;
        y = (rand() - 0.5) * spreadY * 2.2;
        z = -25.0 - rand() * 45.0;
      }

      pos[i * 3]     = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Varied magnitudes: 96% subtle pinpricks, ~4% brighter beacon stars with diffraction spikes
      const isBeacon = rand() < 0.035;
      bcn[i] = isBeacon ? 1.0 : 0.0;
      siz[i] = STAR_BASE_SIZE * (isBeacon ? (1.6 + rand() * 0.9) : (0.55 + rand() * 0.65));

      const c = palettes[Math.floor(rand() * palettes.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      // Varied twinkle rates & phases
      spd[i] = 1.0 + rand() * 2.4;
      amp[i] = 0.15 + rand() * 0.25;
      phs[i] = rand() * Math.PI * 2;
    }

    return [pos, siz, col, spd, amp, phs, bcn];
  }, [starCount]);

  // Uniforms
  const starUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(StarShaderMaterial.uniforms);
    u.uDpr.value = Math.min(gl.getPixelRatio(), 2.0);
    return u;
  }, [gl]);

  const nebulaUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(NebulaShaderMaterial.uniforms);
    u.uOpacity.value = NEBULA_OPACITY;
    u.uQuality.value = activeTier === 'HIGH' ? 3.0 : activeTier === 'MEDIUM' ? 2.0 : 1.0;
    return u;
  }, [activeTier]);

  const shootUniforms = useMemo(() => {
    return THREE.UniformsUtils.clone(ShootingStarMaterial.uniforms);
  }, []);

  // Update loop
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Stars twinkle
    if (starMatRef.current) {
      starMatRef.current.uniforms.uTime.value = t;
    }

    // 2. Nebula slow drift
    if (nebulaMatRef.current) {
      nebulaMatRef.current.uniforms.uTime.value = t;
    }

    // 3. Subtle mouse parallax (reduced/disabled for touch or reduced-motion)
    const parallaxFactor = reducedMotion ? 0.0 : 1.0;
    if (starsGroupRef.current) {
      const targetX = mousePos.x * PARALLAX_STARS_STRENGTH * parallaxFactor;
      const targetY = mousePos.y * PARALLAX_STARS_STRENGTH * parallaxFactor;
      starsGroupRef.current.position.x = THREE.MathUtils.lerp(starsGroupRef.current.position.x, targetX, 0.05);
      starsGroupRef.current.position.y = THREE.MathUtils.lerp(starsGroupRef.current.position.y, targetY, 0.05);
    }

    if (nebulaMeshRef.current) {
      const targetX = 14 + mousePos.x * PARALLAX_NEBULA_STRENGTH * parallaxFactor;
      const targetY =  1 + mousePos.y * PARALLAX_NEBULA_STRENGTH * parallaxFactor;
      nebulaMeshRef.current.position.x = THREE.MathUtils.lerp(nebulaMeshRef.current.position.x, targetX, 0.05);
      nebulaMeshRef.current.position.y = THREE.MathUtils.lerp(nebulaMeshRef.current.position.y, targetY, 0.05);
    }

    // 4. Tasteful Shooting Star (Active on MEDIUM & HIGH tiers, skipped on reduced-motion)
    if (activeTier !== 'LOW' && !reducedMotion && shootingStarRef.current) {
      const timer = shootTimerRef.current;

      if (!timer.active && t > timer.nextTriggerTime) {
        // Launch a new shooting star across upper/mid sky
        timer.active = true;
        timer.startTime = t;
        const startX = -12.0 + Math.random() * 8.0;
        const startY =   7.0 + Math.random() * 4.0;
        const startZ = -28.0;

        const distance = 14.0 + Math.random() * 6.0;
        const angle = -0.55 - Math.random() * 0.25; // Diagonal streak heading down-right

        shootStartPosRef.current.set(startX, startY, startZ);
        shootEndPosRef.current.set(
          startX + Math.cos(angle) * distance,
          startY + Math.sin(angle) * distance,
          startZ
        );

        shootingStarRef.current.rotation.z = angle;
      }

      if (timer.active) {
        const elapsed = t - timer.startTime;
        const progress = Math.min(1.0, elapsed / SHOOTING_STAR_DURATION);

        // Move position along streak
        shootCurPosRef.current.copy(shootStartPosRef.current).lerp(shootEndPosRef.current, progress);
        shootingStarRef.current.position.copy(shootCurPosRef.current);

        // Fade in rapidly, then fade out
        const alpha = Math.sin(progress * Math.PI) * 0.85;
        shootUniforms.uAlpha.value = alpha;
        shootUniforms.uProgress.value = progress;

        if (progress >= 1.0) {
          timer.active = false;
          shootUniforms.uAlpha.value = 0.0;
          timer.nextTriggerTime = t + SHOOTING_STAR_INTERVAL_MIN + Math.random() * (SHOOTING_STAR_INTERVAL_MAX - SHOOTING_STAR_INTERVAL_MIN);
        }
      }
    }
  });

  return (
    <group>
      {/* ── Deep Space Dark Void ── */}
      <mesh position={[0, 0, -48]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color="#02040b" depthWrite={false} />
      </mesh>

      {/* ── Procedural Domain-Warped Cosmic Nebula (Right side balance) ── */}
      <mesh
        ref={nebulaMeshRef}
        position={[14, 1, -30]}
        rotation={[0, 0, -0.15]}
        renderOrder={1}
      >
        <planeGeometry args={[38, 38]} />
        <shaderMaterial
          ref={nebulaMatRef}
          uniforms={nebulaUniforms}
          vertexShader={NebulaShaderMaterial.vertexShader}
          fragmentShader={NebulaShaderMaterial.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── 6,500 Crisp Forward-Weighted Stars ── */}
      <points ref={starsGroupRef} renderOrder={2}>
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
            attach="attributes-aTwinkleSpeed"
            args={[twkSpeeds, 1]}
          />
          <bufferAttribute
            attach="attributes-aTwinkleAmp"
            args={[twkAmps, 1]}
          />
          <bufferAttribute
            attach="attributes-aTwinklePhase"
            args={[twkPhases, 1]}
          />
          <bufferAttribute
            attach="attributes-aIsBeacon"
            args={[beacons, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={starMatRef}
          uniforms={starUniforms}
          vertexShader={StarShaderMaterial.vertexShader}
          fragmentShader={StarShaderMaterial.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ── Rare Tasteful Shooting Star ── */}
      <mesh
        ref={shootingStarRef}
        scale={[3.2, 0.08, 1]}
        position={[0, 100, -28]}
        renderOrder={3}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={shootMatRef}
          uniforms={shootUniforms}
          vertexShader={ShootingStarMaterial.vertexShader}
          fragmentShader={ShootingStarMaterial.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default SpaceBackground;
