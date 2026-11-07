import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SunCoronaMaterial, AnamorphicStreakMaterial, LensGhostMaterial } from './shaders/sunShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (The Sun & Optical Flares)
// ═══════════════════════════════════════════════════════════════
export const SUN_POSITION = [-1.95, 1.10, 0.15]; // Fallback world position
export const SUN_ANCHOR_X_DESKTOP = 0.40;         // Fraction of viewport width from center (left)
export const SUN_ANCHOR_Y_DESKTOP = 0.38;         // Fraction of viewport height from center (top)
export const SUN_ANCHOR_X_MOBILE  = 0.34;         // Portrait mobile horizontal anchor
export const SUN_ANCHOR_Y_MOBILE  = 0.44;         // Portrait mobile vertical anchor

// Story-linked Lighting & Corona Dimensions
export const CORONA_SCALE_POLLUTED = 2.85;        // Dimmer, hazier corona when polluted
export const CORONA_SCALE_HEALED   = 3.65;        // Vast, brilliant solar corona when healed
export const STREAK_WIDTH_POLLUTED = 11.5;        // Shorter streak under heavy smog
export const STREAK_WIDTH_HEALED   = 16.5;        // Long, razor-crisp laser beam when healed
export const STREAK_HEIGHT         = 0.36;

export const SUN_LIGHT_INTENSITY_POLLUTED = 6.2;  // Warmer, dimmer directional light
export const SUN_LIGHT_INTENSITY_HEALED   = 7.8;  // Clean, radiant sunlight
export const SUN_LIGHT_COLOR_POLLUTED     = '#ffd8b3';
export const SUN_LIGHT_COLOR_HEALED       = '#fffaf2';

export const PULSE_SPEED = 1.15;
export const PULSE_AMPLITUDE = 0.032;

export const Sun = ({ healProgress = 0, reducedMotion = false }) => {
  const { viewport } = useThree();
  const isPortrait = viewport.width < viewport.height;

  // Object & Material Refs
  const sunGroupRef     = useRef(null);
  const coreRef         = useRef(null);
  const coronaRef       = useRef(null);
  const streakRef       = useRef(null);
  const dirLightRef     = useRef(null);
  const lightTargetRef  = useRef(null);
  const ghostsGroupRef  = useRef(null);
  const ghostMeshRefs   = useRef([]);

  // Pre-allocated Vector3s & Colors to guarantee ZERO per-frame allocations
  const sunPosRef    = useRef(new THREE.Vector3());
  const toCenterRef  = useRef(new THREE.Vector3());
  const ghostPosRefs = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);

  const lightColorLerp = useRef(new THREE.Color());
  const colPolluted = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_POLLUTED), []);
  const colHealed   = useMemo(() => new THREE.Color(SUN_LIGHT_COLOR_HEALED), []);

  // Compute responsive sun position from current viewport
  const anchorX = isPortrait ? SUN_ANCHOR_X_MOBILE : SUN_ANCHOR_X_DESKTOP;
  const anchorY = isPortrait ? SUN_ANCHOR_Y_MOBILE : SUN_ANCHOR_Y_DESKTOP;
  const currentSunX = -viewport.width * anchorX;
  const currentSunY =  viewport.height * anchorY;
  const currentSunZ =  0.15;

  sunPosRef.current.set(currentSunX, currentSunY, currentSunZ);

  // Clone uniforms
  const coronaUniforms = useMemo(() => THREE.UniformsUtils.clone(SunCoronaMaterial.uniforms), []);
  const streakUniforms = useMemo(() => THREE.UniformsUtils.clone(AnamorphicStreakMaterial.uniforms), []);

  // 4 Lens Ghosts: 1 Hexagonal aperture, 1 Halo ring, 2 Chromatic discs (tuned delicate optical flares)
  const ghostConfigs = useMemo(() => [
    { offsetRatio: 0.28, size: 0.32, shape: 1.0, color: '#ffaa44', alpha: 0.10 }, // Subtle hexagonal aperture
    { offsetRatio: 0.58, size: 0.52, shape: 2.0, color: '#4488cc', alpha: 0.05 }, // Faint delicate halo ring
    { offsetRatio: 0.88, size: 0.20, shape: 0.0, color: '#ffbb55', alpha: 0.08 }, // Soft warm circular disc
    { offsetRatio: 1.25, size: 0.38, shape: 0.0, color: '#3388bb', alpha: 0.04 }, // Soft chromatic secondary
  ], []);

  const ghostUniformsList = useMemo(() => {
    return ghostConfigs.map((cfg) => {
      const u = THREE.UniformsUtils.clone(LensGhostMaterial.uniforms);
      u.uColor.value.set(cfg.color);
      u.uAlpha.value = cfg.alpha;
      u.uShape.value = cfg.shape;
      u.uEdgeFade.value = 1.0;
      return u;
    });
  }, [ghostConfigs]);

  // Properly bind directional light target without invalid props
  useLayoutEffect(() => {
    if (dirLightRef.current && lightTargetRef.current) {
      dirLightRef.current.target = lightTargetRef.current;
    }
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulseAmp = reducedMotion ? 0.008 : PULSE_AMPLITUDE;
    const pulse = 1.0 + Math.sin(t * PULSE_SPEED) * pulseAmp;

    // 1. Update animated corona plasma noise & god-rays
    coronaUniforms.uTime.value = t;

    // Story-linked mood transition (polluted -> healed)
    const coronaScale = THREE.MathUtils.lerp(CORONA_SCALE_POLLUTED, CORONA_SCALE_HEALED, healProgress);
    const streakWidth = THREE.MathUtils.lerp(STREAK_WIDTH_POLLUTED, STREAK_WIDTH_HEALED, healProgress);

    // Corona colors: smoky orange/crimson -> pure solar gold
    coronaUniforms.uColorGlow.value.set(healProgress > 0.5 ? '#ffaa22' : '#ff7800');
    coronaUniforms.uIntensity.value = THREE.MathUtils.lerp(3.2, 4.4, healProgress);

    if (coronaRef.current) {
      coronaRef.current.scale.set(coronaScale * pulse, coronaScale * pulse, 1);
    }

    // 2. Anamorphic horizontal streak
    if (streakRef.current) {
      streakRef.current.scale.set(
        streakWidth * pulse,
        STREAK_HEIGHT * (1.0 + Math.sin(t * 1.8) * 0.05),
        1
      );
    }

    // 3. Directional light color & intensity lerp
    if (dirLightRef.current) {
      lightColorLerp.current.copy(colPolluted).lerp(colHealed, healProgress);
      dirLightRef.current.color.copy(lightColorLerp.current);
      const baseIntensity = THREE.MathUtils.lerp(
        SUN_LIGHT_INTENSITY_POLLUTED,
        SUN_LIGHT_INTENSITY_HEALED,
        healProgress
      );
      dirLightRef.current.intensity = baseIntensity * pulse;
    }

    // 4. Optical Lens Flare Ghosts calculation
    // Vector from sun to screen center (0, 0, 0)
    toCenterRef.current.set(0, 0, 0).sub(sunPosRef.current);

    // Screen-edge fade: smooth fadeout if sun is pushed off-screen
    const normX = Math.abs(currentSunX) / (viewport.width * 0.5);
    const normY = Math.abs(currentSunY) / (viewport.height * 0.5);
    const edgeDist = Math.max(normX, normY);
    const edgeFade = THREE.MathUtils.smoothstep(1.30, 0.88, edgeDist);

    // Subtle drift parallax
    const driftX = Math.sin(t * 0.45) * 0.012;
    const driftY = Math.cos(t * 0.40) * 0.012;

    for (let i = 0; i < ghostConfigs.length; i++) {
      const cfg = ghostConfigs[i];
      const ghostMesh = ghostMeshRefs.current[i];
      if (ghostMesh) {
        const pos = ghostPosRefs.current[i];
        pos.copy(sunPosRef.current)
           .addScaledVector(toCenterRef.current, cfg.offsetRatio);
        pos.x += driftX;
        pos.y += driftY;

        ghostMesh.position.copy(pos);
        ghostUniformsList[i].uEdgeFade.value = edgeFade;
      }
    }
  });

  return (
    <group ref={sunGroupRef}>
      {/* Target object for Directional Light */}
      <object3D ref={lightTargetRef} position={[0, 0, 0]} />

      {/* Main Directional Sun Light illuminating Earth & Scene */}
      <directionalLight
        ref={dirLightRef}
        position={[currentSunX * 1.4, currentSunY * 1.4, 2.2]}
        intensity={SUN_LIGHT_INTENSITY_POLLUTED}
        castShadow={false}
      />

      {/* Deep Space Ambient Light */}
      <ambientLight intensity={0.06} color="#050a16" />

      {/* ── Responsive Sun Core & Flares ── */}
      <group position={[currentSunX, currentSunY, currentSunZ]}>
        {/* Blinding white-hot core sphere (toneMapped={false} for pure bloom triggering) */}
        <mesh ref={coreRef} renderOrder={9}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
          />
        </mesh>

        {/* Animated swirling plasma corona with god-rays */}
        <mesh ref={coronaRef} renderOrder={10}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={coronaUniforms}
            vertexShader={SunCoronaMaterial.vertexShader}
            fragmentShader={SunCoronaMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Razor-thin anamorphic horizontal laser beam passing through the sun */}
        <mesh
          ref={streakRef}
          position={[0, 0, 0.01]}
          renderOrder={11}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={streakUniforms}
            vertexShader={AnamorphicStreakMaterial.vertexShader}
            fragmentShader={AnamorphicStreakMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── Screen-Space Optical Lens Ghosts along the optical axis ── */}
      <group ref={ghostsGroupRef}>
        {ghostConfigs.map((cfg, idx) => (
          <mesh
            key={idx}
            ref={(m) => { ghostMeshRefs.current[idx] = m; }}
            scale={[cfg.size, cfg.size, 1]}
            renderOrder={12}
          >
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              uniforms={ghostUniformsList[idx]}
              vertexShader={LensGhostMaterial.vertexShader}
              fragmentShader={LensGhostMaterial.fragmentShader}
              transparent={true}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default Sun;
