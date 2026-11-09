import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SunCoronaMaterial,
  AnamorphicStreakMaterial,
  SunRayStreakMaterial,
  LensGhostMaterial,
} from './shaders/sunShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Cinematic Sun, Soft Rays & Flare)
// ═══════════════════════════════════════════════════════════════
export const SUN_CORE_RADIUS        = 0.09;       // Radiant sun core
export const SUN_GLOW_SIZE_POLLUTED = 1.65;       // Soft radial glow size
export const SUN_GLOW_SIZE_HEALED   = 1.45;       // Slightly crisper when healed
export const RAY_COUNT              = 10;         // 10 soft radiating light rays
export const RAY_LENGTH             = 2.4;        // Soft ray extending across space
export const RAY_WIDTH              = 0.085;      // Delicate width
export const ANAMORPHIC_WIDTH       = 2.4;        // Horizontal flare streak
export const ANAMORPHIC_HEIGHT      = 0.035;

// Responsive Viewport Positioning (Upper-left corner, partly off-screen)
export const SUN_ANCHOR_X_DESKTOP   = 0.46;       // Fraction of viewport width from center (left)
export const SUN_ANCHOR_Y_DESKTOP   = 0.38;       // Fraction of viewport height from center (top)
export const SUN_ANCHOR_X_MOBILE    = 0.38;
export const SUN_ANCHOR_Y_MOBILE    = 0.42;
export const SUN_POSITION           = [-1.95, 1.10, 0.15];

// Directional Light & Shadow Parameters
export const LIGHT_DISTANCE         = 9.0;
export const SUN_LIGHT_INTENSITY_POLLUTED = 4.8;
export const SUN_LIGHT_INTENSITY_HEALED   = 6.2;
export const SUN_LIGHT_COLOR_POLLUTED     = '#ffcf9e';
export const SUN_LIGHT_COLOR_HEALED       = '#fff1dd';

export const SHADOW_MAP_SIZE_HIGH   = 2048;
export const SHADOW_MAP_SIZE_LOW    = 1024;
export const SHADOW_FRUSTUM_SIZE    = 3.4;
export const SHADOW_BIAS            = -0.0005;
export const SHADOW_NORMAL_BIAS     = 0.04;
export const SHADOW_RADIUS          = 3.5;
export const SHADOW_NEAR            = 0.1;
export const SHADOW_FAR             = 28.0;

// Ambient & Rim Fill Lighting
export const AMBIENT_COLOR          = '#060d1a';
export const AMBIENT_INTENSITY      = 0.22;
export const RIM_LIGHT_COLOR        = '#527da8';
export const RIM_LIGHT_INTENSITY    = 0.65;

// Backward Compatibility Exports
export const PULSE_SPEED            = 0.8;
export const PULSE_AMPLITUDE        = 0.015;
export const CORONA_SCALE_POLLUTED  = SUN_GLOW_SIZE_POLLUTED;
export const CORONA_SCALE_HEALED    = SUN_GLOW_SIZE_HEALED;
export const STREAK_WIDTH_POLLUTED  = ANAMORPHIC_WIDTH;
export const STREAK_WIDTH_HEALED    = ANAMORPHIC_WIDTH;
export const STREAK_HEIGHT          = ANAMORPHIC_HEIGHT;

export const Sun = ({ healProgress = 0, reducedMotion = false, isLowEnd = false }) => {
  const { viewport } = useThree();
  const isPortrait = viewport.width < viewport.height;

  // Object & Material Refs
  const sunGroupRef     = useRef(null);
  const coreRef         = useRef(null);
  const glowRef         = useRef(null);
  const raysGroupRef    = useRef(null);
  const anamorphicRef   = useRef(null);
  const dirLightRef     = useRef(null);
  const lightTargetRef  = useRef(null);

  // Pre-allocated Vector3s & Colors to guarantee ZERO per-frame allocations
  const sunPosRef       = useRef(new THREE.Vector3());
  const sunDirRef       = useRef(new THREE.Vector3());
  const lightPosRef     = useRef(new THREE.Vector3());
  const lightColorLerp  = useRef(new THREE.Color());

  const colPolluted = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_POLLUTED), []);
  const colHealed   = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_HEALED), []);

  // Compute responsive sun position from current viewport
  const anchorX = isPortrait ? SUN_ANCHOR_X_MOBILE : SUN_ANCHOR_X_DESKTOP;
  const anchorY = isPortrait ? SUN_ANCHOR_Y_MOBILE : SUN_ANCHOR_Y_DESKTOP;
  const currentSunX = -viewport.width * anchorX;
  const currentSunY =  viewport.height * anchorY;
  const currentSunZ =  0.15;

  sunPosRef.current.set(currentSunX, currentSunY, currentSunZ);
  sunDirRef.current.copy(sunPosRef.current).normalize();
  lightPosRef.current.copy(sunDirRef.current).multiplyScalar(LIGHT_DISTANCE);

  // Clone uniforms for safe isolated instance state
  const glowUniforms       = useMemo(() => THREE.UniformsUtils.clone(SunCoronaMaterial.uniforms), []);
  const anamorphicUniforms = useMemo(() => THREE.UniformsUtils.clone(AnamorphicStreakMaterial.uniforms), []);

  // Ray configurations for 10 radiating soft streaks
  const raysData = useMemo(() => {
    const list = [];
    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2 + (i % 2 === 0 ? 0.05 : -0.05);
      const lengthMult = 0.85 + (i % 3) * 0.22;
      const uniforms = THREE.UniformsUtils.clone(SunRayStreakMaterial.uniforms);
      uniforms.uPhase.value = i * 0.7;
      list.push({ angle, lengthMult, uniforms });
    }
    return list;
  }, []);

  // Ghost flare data along vector from sun toward screen center (0, 0)
  const ghostsData = useMemo(() => {
    return [
      { distFrac: 0.28, size: 0.18, color: '#ffbb44', alpha: 0.16 },
      { distFrac: 0.52, size: 0.32, color: '#ff8822', alpha: 0.12 },
      { distFrac: 0.78, size: 0.12, color: '#ffaa55', alpha: 0.14 },
    ].map((g) => {
      const uniforms = THREE.UniformsUtils.clone(LensGhostMaterial.uniforms);
      uniforms.uColor.value.set(g.color);
      uniforms.uAlpha.value = g.alpha;
      return { ...g, uniforms };
    });
  }, []);

  // Attach target properly without invalid props
  useLayoutEffect(() => {
    if (dirLightRef.current && lightTargetRef.current) {
      dirLightRef.current.target = lightTargetRef.current;
    }
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const pulseAmp = reducedMotion ? 0.005 : PULSE_AMPLITUDE;
    const pulse = 1.0 + Math.sin(t * PULSE_SPEED) * pulseAmp;

    // 1. Soft radial glow size & color
    const glowScale = THREE.MathUtils.lerp(SUN_GLOW_SIZE_POLLUTED, SUN_GLOW_SIZE_HEALED, healProgress) * pulse;
    if (glowRef.current) {
      glowRef.current.scale.set(glowScale, glowScale, 1);
    }
    glowUniforms.uTime.value = t;
    glowUniforms.uIntensity.value = THREE.MathUtils.lerp(1.25, 1.45, healProgress);

    // 2. Anamorphic streak
    if (anamorphicRef.current) {
      anamorphicRef.current.scale.set(ANAMORPHIC_WIDTH * pulse, ANAMORPHIC_HEIGHT, 1);
    }

    // 3. Slowly rotating soft light rays
    if (raysGroupRef.current && !reducedMotion) {
      raysGroupRef.current.rotation.z += delta * 0.018;
    }
    raysData.forEach(({ uniforms }) => {
      uniforms.uTime.value = t;
      uniforms.uIntensity.value = THREE.MathUtils.lerp(0.32, 0.45, healProgress);
    });

    // 4. Directional light
    if (dirLightRef.current) {
      dirLightRef.current.position.copy(lightPosRef.current);
      lightColorLerp.current.copy(colPolluted).lerp(colHealed, healProgress);
      dirLightRef.current.color.copy(lightColorLerp.current);

      const baseIntensity = THREE.MathUtils.lerp(
        SUN_LIGHT_INTENSITY_POLLUTED,
        SUN_LIGHT_INTENSITY_HEALED,
        healProgress
      );
      dirLightRef.current.intensity = baseIntensity * pulse;
    }
  });

  const shadowMapSize = isLowEnd ? SHADOW_MAP_SIZE_LOW : SHADOW_MAP_SIZE_HIGH;

  return (
    <group ref={sunGroupRef}>
      {/* ── 1. Target Object for Directional Light (At Earth's Center) ── */}
      <object3D ref={lightTargetRef} position={[0, 0, 0]} />

      {/* ── 2. Primary Directional Sunlight with Real Cast Shadows ── */}
      <directionalLight
        ref={dirLightRef}
        position={[lightPosRef.current.x, lightPosRef.current.y, lightPosRef.current.z]}
        intensity={SUN_LIGHT_INTENSITY_POLLUTED}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-SHADOW_FRUSTUM_SIZE}
        shadow-camera-right={SHADOW_FRUSTUM_SIZE}
        shadow-camera-top={SHADOW_FRUSTUM_SIZE}
        shadow-camera-bottom={-SHADOW_FRUSTUM_SIZE}
        shadow-camera-near={SHADOW_NEAR}
        shadow-camera-far={SHADOW_FAR}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
        shadow-radius={SHADOW_RADIUS}
      />

      {/* ── 3. Deep Space Ambient Fill ── */}
      <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />

      {/* ── 4. Cool Rim Light from opposite quadrant ── */}
      <directionalLight
        position={[-lightPosRef.current.x * 0.75, -lightPosRef.current.y * 0.75, -lightPosRef.current.z * 0.6]}
        color={RIM_LIGHT_COLOR}
        intensity={RIM_LIGHT_INTENSITY}
        castShadow={false}
      />

      {/* ── 5. Minimal Sun Visual (Upper-Left Viewport Anchor) ── */}
      <group position={[currentSunX, currentSunY, currentSunZ]}>
        {/* Tiny hot-white core (toneMapped={false} for slight bloom glow) */}
        <mesh ref={coreRef} renderOrder={9}>
          <sphereGeometry args={[SUN_CORE_RADIUS, 24, 24]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>

        {/* Soft, small radial glow sprite (additive) */}
        <mesh ref={glowRef} renderOrder={10}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={glowUniforms}
            vertexShader={SunCoronaMaterial.vertexShader}
            fragmentShader={SunCoronaMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Thin horizontal anamorphic streak */}
        <mesh ref={anamorphicRef} renderOrder={11}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={anamorphicUniforms}
            vertexShader={AnamorphicStreakMaterial.vertexShader}
            fragmentShader={AnamorphicStreakMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 8-12 long soft light rays radiating outward */}
        {!isLowEnd && (
          <group ref={raysGroupRef} renderOrder={8}>
            {raysData.map((ray, i) => (
              <mesh
                key={i}
                rotation={[0, 0, ray.angle]}
                position={[
                  Math.cos(ray.angle) * (RAY_LENGTH * ray.lengthMult * 0.45),
                  Math.sin(ray.angle) * (RAY_LENGTH * ray.lengthMult * 0.45),
                  -0.01,
                ]}
                scale={[RAY_LENGTH * ray.lengthMult, RAY_WIDTH, 1]}
              >
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                  uniforms={ray.uniforms}
                  vertexShader={SunRayStreakMaterial.vertexShader}
                  fragmentShader={SunRayStreakMaterial.fragmentShader}
                  transparent={true}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Subtle lens flare ghost circles along vector to center */}
        {!isLowEnd &&
          ghostsData.map((ghost, i) => {
            // Position along vector from sun (-currentSunX, -currentSunY) toward (0,0)
            const gx = -currentSunX * ghost.distFrac;
            const gy = -currentSunY * ghost.distFrac;
            return (
              <mesh
                key={i}
                position={[gx, gy, 0.05]}
                scale={[ghost.size, ghost.size, 1]}
                renderOrder={12 + i}
              >
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                  uniforms={ghost.uniforms}
                  vertexShader={LensGhostMaterial.vertexShader}
                  fragmentShader={LensGhostMaterial.fragmentShader}
                  transparent={true}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
      </group>
    </group>
  );
};

export default Sun;
