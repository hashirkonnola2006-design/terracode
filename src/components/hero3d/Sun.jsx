import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SunCoronaMaterial, AnamorphicStreakMaterial, LensGhostMaterial } from './shaders/sunShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (The Sun)
// ═══════════════════════════════════════════════════════════════
export const SUN_POSITION = [-1.95, 1.10, 0.15]; // Upper-left corner of the viewport
export const SUN_LIGHT_INTENSITY = 7.2;           // Blazing directional sunlight
export const SUN_LIGHT_COLOR = '#fff8ed';
export const CORONA_SCALE = 3.2;                  // Warm golden-orange radial corona
export const ANAMORPHIC_STREAK_WIDTH = 14.5;      // Spans horizontally across the sky
export const ANAMORPHIC_STREAK_HEIGHT = 0.38;     // Crisp anamorphic laser beam
export const PULSE_SPEED = 1.2;
export const PULSE_AMPLITUDE = 0.035;

export const Sun = ({ healProgress = 0 }) => {
  const sunGroupRef = useRef(null);
  const coronaRef = useRef(null);
  const streakRef = useRef(null);
  const dirLightRef = useRef(null);
  const ghostsGroupRef = useRef(null);

  const coronaUniforms = useMemo(() => THREE.UniformsUtils.clone(SunCoronaMaterial.uniforms), []);
  const streakUniforms = useMemo(() => THREE.UniformsUtils.clone(AnamorphicStreakMaterial.uniforms), []);
  const ghostUniforms1 = useMemo(() => THREE.UniformsUtils.clone(LensGhostMaterial.uniforms), []);
  const ghostUniforms2 = useMemo(() => THREE.UniformsUtils.clone(LensGhostMaterial.uniforms), []);
  const ghostUniforms3 = useMemo(() => THREE.UniformsUtils.clone(LensGhostMaterial.uniforms), []);

  useMemo(() => {
    ghostUniforms1.uColor.value.set('#ff9944');
    ghostUniforms1.uAlpha.value = 0.22;
    ghostUniforms2.uColor.value.set('#44bbff');
    ghostUniforms2.uAlpha.value = 0.16;
    ghostUniforms3.uColor.value.set('#ffcc66');
    ghostUniforms3.uAlpha.value = 0.14;
  }, [ghostUniforms1, ghostUniforms2, ghostUniforms3]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1.0 + Math.sin(t * PULSE_SPEED) * PULSE_AMPLITUDE;

    if (coronaRef.current) {
      coronaRef.current.scale.set(CORONA_SCALE * pulse, CORONA_SCALE * pulse, 1);
    }

    if (streakRef.current) {
      streakRef.current.scale.set(
        ANAMORPHIC_STREAK_WIDTH * pulse,
        ANAMORPHIC_STREAK_HEIGHT * (1.0 + Math.sin(t * 1.8) * 0.05),
        1
      );
    }

    if (dirLightRef.current) {
      dirLightRef.current.intensity = (SUN_LIGHT_INTENSITY + healProgress * 0.6) * pulse;
    }

    if (ghostsGroupRef.current) {
      ghostsGroupRef.current.position.x = Math.sin(t * 0.6) * 0.015;
      ghostsGroupRef.current.position.y = Math.cos(t * 0.5) * 0.015;
    }
  });

  const sunPos = new THREE.Vector3(...SUN_POSITION);
  const toCenter = new THREE.Vector3(0, 0, 0).sub(sunPos);

  const g1Pos = sunPos.clone().add(toCenter.clone().multiplyScalar(0.35));
  const g2Pos = sunPos.clone().add(toCenter.clone().multiplyScalar(0.70));
  const g3Pos = sunPos.clone().add(toCenter.clone().multiplyScalar(1.10));

  return (
    <group ref={sunGroupRef}>
      {/* Main Directional Sun Light illuminating Earth & Debris */}
      <directionalLight
        ref={dirLightRef}
        position={[SUN_POSITION[0] * 1.5, SUN_POSITION[1] * 1.5, 2.2]}
        target-position={[0, 0, 0]}
        intensity={SUN_LIGHT_INTENSITY}
        color={SUN_LIGHT_COLOR}
        castShadow={false}
      />

      {/* Deep Space Ambient Light */}
      <ambientLight intensity={0.06} color="#050a16" />

      {/* Sun Core & Flares in Upper-Left */}
      <group position={SUN_POSITION}>
        {/* Blinding white-hot core sphere */}
        <mesh>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            toneMapped={false}
          />
        </mesh>

        {/* Golden-orange radial corona glow billboard */}
        <mesh ref={coronaRef} scale={[CORONA_SCALE, CORONA_SCALE, 1]}>
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

        {/* Razor-thin anamorphic horizontal flare beam passing directly through the sun */}
        <mesh
          ref={streakRef}
          position={[0, 0, 0.01]}
          scale={[ANAMORPHIC_STREAK_WIDTH, ANAMORPHIC_STREAK_HEIGHT, 1]}
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

      {/* Subtle Lens Flare Ghosts along optical axis */}
      <group ref={ghostsGroupRef}>
        <mesh position={g1Pos} scale={[0.38, 0.38, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={ghostUniforms1}
            vertexShader={LensGhostMaterial.vertexShader}
            fragmentShader={LensGhostMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh position={g2Pos} scale={[0.24, 0.24, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={ghostUniforms2}
            vertexShader={LensGhostMaterial.vertexShader}
            fragmentShader={LensGhostMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh position={g3Pos} scale={[0.55, 0.55, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            uniforms={ghostUniforms3}
            vertexShader={LensGhostMaterial.vertexShader}
            fragmentShader={LensGhostMaterial.fragmentShader}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
};
