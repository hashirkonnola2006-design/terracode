import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SunCoronaMaterial, AnamorphicStreakMaterial, LensGhostMaterial } from './shaders/sunShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Minimal Sun & Directional Light with Shadows)
// ═══════════════════════════════════════════════════════════════
// Sun Visual Dimensions (Small, elegant point light source)
export const SUN_CORE_RADIUS        = 0.065;      // Small sun core radius (0.05 to 0.08 units)
export const SUN_GLOW_SIZE_POLLUTED = 0.88;       // Soft radial glow size (~6% to 8% screen width)
export const SUN_GLOW_SIZE_HEALED   = 0.76;       // Slightly crisper when atmosphere is healed
export const FAINT_RAY_LENGTH       = 1.55;       // Short directional ray pointing toward Earth (< 2 units)
export const FAINT_RAY_WIDTH        = 0.045;      // Very thin ray width

// Responsive Viewport Positioning (Safe margins away from navbar & left boundary)
export const SUN_ANCHOR_X_DESKTOP   = 0.41;       // Fraction of viewport width from center (left)
export const SUN_ANCHOR_Y_DESKTOP   = 0.36;       // Fraction of viewport height from center (top, below nav)
export const SUN_ANCHOR_X_MOBILE    = 0.36;       // Portrait mobile horizontal anchor
export const SUN_ANCHOR_Y_MOBILE    = 0.40;       // Portrait mobile vertical anchor
export const SUN_POSITION           = [-1.95, 1.10, 0.15]; // Fallback world coordinates

// Directional Light & Shadow Parameters
export const LIGHT_DISTANCE         = 9.0;        // Distance along sun direction vector
export const SUN_LIGHT_INTENSITY_POLLUTED = 4.8;  // Warm amber light with rich shadow contrast
export const SUN_LIGHT_INTENSITY_HEALED   = 6.2;  // Radiant warm-white sunlight
export const SUN_LIGHT_COLOR_POLLUTED     = '#ffcf9e'; // Warm amber-white
export const SUN_LIGHT_COLOR_HEALED       = '#fff1dd'; // Clean warm-white (#fff1dd)

export const SHADOW_MAP_SIZE_HIGH   = 2048;       // High-quality PCF soft shadow resolution
export const SHADOW_MAP_SIZE_LOW    = 1024;       // Low-tier mobile shadow resolution
export const SHADOW_FRUSTUM_SIZE    = 3.4;        // Orthographic bounds [-3.4, 3.4] covering Earth & debris
export const SHADOW_BIAS            = -0.0005;    // Prevents shadow acne artifacts
export const SHADOW_NORMAL_BIAS     = 0.04;       // Eliminates shadow peter-panning on sphere edges
export const SHADOW_RADIUS          = 3.5;        // Soft PCF filter blur radius
export const SHADOW_NEAR            = 0.1;
export const SHADOW_FAR             = 28.0;

// Ambient & Rim Fill Lighting
export const AMBIENT_COLOR          = '#081020';  // Cool deep space fill (prevents pitch-black shadows)
export const AMBIENT_INTENSITY      = 0.18;
export const RIM_LIGHT_COLOR        = '#527da8';  // Faint cool rim light from opposite side
export const RIM_LIGHT_INTENSITY    = 0.70;

// Pulse & Backward Compatibility Exports
export const PULSE_SPEED            = 0.8;
export const PULSE_AMPLITUDE        = 0.012;
export const CORONA_SCALE_POLLUTED  = SUN_GLOW_SIZE_POLLUTED;
export const CORONA_SCALE_HEALED    = SUN_GLOW_SIZE_HEALED;
export const STREAK_WIDTH_POLLUTED  = FAINT_RAY_LENGTH;
export const STREAK_WIDTH_HEALED    = FAINT_RAY_LENGTH;
export const STREAK_HEIGHT          = FAINT_RAY_WIDTH;

export const Sun = ({ healProgress = 0, reducedMotion = false, isLowEnd = false }) => {
  const { viewport } = useThree();
  const isPortrait = viewport.width < viewport.height;

  // Object & Material Refs
  const sunGroupRef    = useRef(null);
  const coreRef        = useRef(null);
  const glowRef        = useRef(null);
  const rayRef         = useRef(null);
  const dirLightRef    = useRef(null);
  const lightTargetRef = useRef(null);

  // Pre-allocated Vector3s & Colors to guarantee ZERO per-frame allocations
  const sunPosRef       = useRef(new THREE.Vector3());
  const sunDirRef       = useRef(new THREE.Vector3());
  const lightPosRef     = useRef(new THREE.Vector3());
  const rayOffsetRef    = useRef(new THREE.Vector3());
  const lightColorLerp  = useRef(new THREE.Color());

  const colPolluted = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_POLLUTED), []);
  const colHealed   = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_HEALED), []);

  // Compute responsive sun position from current viewport (clear of navbar)
  const anchorX = isPortrait ? SUN_ANCHOR_X_MOBILE : SUN_ANCHOR_X_DESKTOP;
  const anchorY = isPortrait ? SUN_ANCHOR_Y_MOBILE : SUN_ANCHOR_Y_DESKTOP;
  const currentSunX = -viewport.width * anchorX;
  const currentSunY =  viewport.height * anchorY;
  const currentSunZ =  0.15;

  sunPosRef.current.set(currentSunX, currentSunY, currentSunZ);
  sunDirRef.current.copy(sunPosRef.current).normalize();
  lightPosRef.current.copy(sunDirRef.current).multiplyScalar(LIGHT_DISTANCE);

  // Angle from sun to Earth center (0, 0, 0)
  const toEarthX = -currentSunX;
  const toEarthY = -currentSunY;
  const rayAngle = Math.atan2(toEarthY, toEarthX);
  const rayLenHalf = FAINT_RAY_LENGTH * 0.45;
  rayOffsetRef.current.set(
    Math.cos(rayAngle) * rayLenHalf,
    Math.sin(rayAngle) * rayLenHalf,
    0.01
  );

  // Clone uniforms for safe isolated instance state
  const glowUniforms = useMemo(() => THREE.UniformsUtils.clone(SunCoronaMaterial.uniforms), []);
  const rayUniforms  = useMemo(() => THREE.UniformsUtils.clone(AnamorphicStreakMaterial.uniforms), []);

  // Attach target properly without invalid props
  useLayoutEffect(() => {
    if (dirLightRef.current && lightTargetRef.current) {
      dirLightRef.current.target = lightTargetRef.current;
    }
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulseAmp = reducedMotion ? 0.004 : PULSE_AMPLITUDE;
    const pulse = 1.0 + Math.sin(t * PULSE_SPEED) * pulseAmp;

    // 1. Soft radial glow size & color mood transition
    const glowScale = THREE.MathUtils.lerp(SUN_GLOW_SIZE_POLLUTED, SUN_GLOW_SIZE_HEALED, healProgress) * pulse;
    if (glowRef.current) {
      glowRef.current.scale.set(glowScale, glowScale, 1);
    }
    glowUniforms.uIntensity.value = THREE.MathUtils.lerp(1.10, 1.35, healProgress);
    glowUniforms.uColorGlow.value.set(healProgress > 0.5 ? '#ffaa2e' : '#ff8512');

    // 2. Faint directional ray scale
    if (rayRef.current) {
      rayRef.current.scale.set(
        FAINT_RAY_LENGTH * pulse,
        FAINT_RAY_WIDTH * pulse,
        1
      );
    }

    // 3. Directional Light: Position, Color & Intensity lerp
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

      {/* ── 3. Deep Space Ambient Fill (Softens the night side) ── */}
      <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />

      {/* ── 4. Faint Cool Rim Light (From opposite quadrant for edge definition) ── */}
      <directionalLight
        position={[-lightPosRef.current.x * 0.75, -lightPosRef.current.y * 0.75, -lightPosRef.current.z * 0.6]}
        color={RIM_LIGHT_COLOR}
        intensity={RIM_LIGHT_INTENSITY}
        castShadow={false}
      />

      {/* ── 5. Minimal Sun Visual (Upper-Left Viewport Anchor) ── */}
      <group position={[currentSunX, currentSunY, currentSunZ]}>
        {/* Tiny bright core (radius 0.065, toneMapped={false} for slight bloom glow) */}
        <mesh ref={coreRef} renderOrder={9}>
          <sphereGeometry args={[SUN_CORE_RADIUS, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
          />
        </mesh>

        {/* ONE soft, small radial glow sprite (additive, radius ~6% to 8% screen width) */}
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

        {/* Faint short ray pointing toward Earth (< 2 world units) */}
        <mesh
          ref={rayRef}
          position={[rayOffsetRef.current.x, rayOffsetRef.current.y, 0.01]}
          rotation={[0, 0, rayAngle]}
          renderOrder={11}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={rayUniforms}
            vertexShader={AnamorphicStreakMaterial.vertexShader}
            fragmentShader={AnamorphicStreakMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
};

export default Sun;
