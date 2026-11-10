import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShader } from './shaders/EarthShader';
import { healMask } from '../../three/HealMask';
import { useGameStore } from '../../store/gameStore';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Earth Geometry & Orientation)
// ═══════════════════════════════════════════════════════════════
export const EARTH_RADIUS = 1.0;            // Base sphere radius
export const EARTH_SEGMENTS = 128;          // 128x128 SphereGeometry for smooth curvature
export const BASE_ROTATION_SPEED = 0.016;   // Initial slow spin
export const HEALED_ROTATION_SPEED = 0.010; // Slows slightly as Earth heals
export const AXIAL_TILT_X = 0.20;           // North hemisphere tilted gently towards camera
export const AXIAL_TILT_Z = -0.10;          // Subtle natural axial tilt
export const INITIAL_ROTATION_Y = 2.94;     // Centers India & the Indian Ocean
export const HEAL_SCALE_EXPANSION = 0.035;  // Expands ~3.5% as biosphere restores

export const Earth = ({
  onEarthMesh,
  scrollRotation = 0,
  healProgress = 0,
  pollution = 1.0,
  dim = 1.0,
  hover = 0.0,
  isLowEnd = false,
  autoRotate = true,
  noGroupTilt = false,
  healMaskManager = null,
}) => {
  const { gl } = useThree();
  const earthRef = useRef(null);
  const shaderMatRef = useRef(null);
  const activeMask = healMaskManager || healMask;

  const planetPulseTrigger = useGameStore((s) => s.planetPulseTrigger);
  const lastPulseRef = useRef(0);
  const pulseIntensityRef = useRef(0);

  // Progressive Loading: Load lightweight 2K maps + city lights
  const [dayMap2k, normalMap, specularMap, lightsMap] = useTexture([
    '/textures/earth_day_2k.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_lights_2048.png',
  ]);

  useEffect(() => {
    const maxAnisotropy = gl.capabilities ? gl.capabilities.getMaxAnisotropy() : 8;

    dayMap2k.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    specularMap.colorSpace = THREE.NoColorSpace;
    lightsMap.colorSpace = THREE.SRGBColorSpace;

    [dayMap2k, normalMap, specularMap, lightsMap].forEach((t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAnisotropy;
      t.needsUpdate = true;
    });
  }, [dayMap2k, normalMap, specularMap, lightsMap, gl, isLowEnd]);

  // Listen to milestone pulse triggers
  useEffect(() => {
    if (planetPulseTrigger && planetPulseTrigger !== lastPulseRef.current) {
      lastPulseRef.current = planetPulseTrigger;
      pulseIntensityRef.current = 1.0;
    }
  }, [planetPulseTrigger]);

  const initialPollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShader.uniforms);
    u.uDayMap.value = dayMap2k;
    u.uNormalMap.value = normalMap;
    u.uSpecularMap.value = specularMap;
    u.uLightsMap.value = lightsMap;
    u.uHealMask.value = activeMask.getTexture();
    u.uPollution.value = initialPollution;
    u.uHeal.value = 1.0 - initialPollution;
    u.uPulse.value = 0.0;
    return u;
  }, [dayMap2k, normalMap, specularMap, lightsMap]);

  const smoothPollutionRef = useRef(initialPollution);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const targetPollution = pollution !== undefined ? pollution : 1.0 - healProgress;
    smoothPollutionRef.current = THREE.MathUtils.lerp(
      smoothPollutionRef.current,
      targetPollution,
      Math.min(delta * 4.0, 1.0)
    );

    // Fade out pulse
    if (pulseIntensityRef.current > 0.001) {
      pulseIntensityRef.current = Math.max(0.0, pulseIntensityRef.current - delta * 1.2);
    }

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uPollution.value = smoothPollutionRef.current;
      shaderMatRef.current.uniforms.uHeal.value = 1.0 - smoothPollutionRef.current;
      shaderMatRef.current.uniforms.uPulse.value = pulseIntensityRef.current;
      shaderMatRef.current.uniforms.uTime.value = t;
      shaderMatRef.current.uniforms.uHealMask.value = activeMask.getTexture();
      shaderMatRef.current.uniforms.uDim.value = THREE.MathUtils.lerp(
        shaderMatRef.current.uniforms.uDim.value,
        dim,
        Math.min(delta * 5.0, 1.0)
      );
      shaderMatRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
        shaderMatRef.current.uniforms.uHover.value,
        hover,
        Math.min(delta * 6.0, 1.0)
      );
    }

    if (earthRef.current) {
      const cleanProgress = 1.0 - smoothPollutionRef.current;
      
      // When autoRotate is true (Landing page), rotate mesh internally
      // When autoRotate is false (/clean page), rotation is handled on the parent planetGroup
      if (autoRotate) {
        const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, HEALED_ROTATION_SPEED, cleanProgress);
        earthRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation;
      }

      const s = 1.0 + cleanProgress * HEAL_SCALE_EXPANSION;
      earthRef.current.scale.set(s, s, s);
    }
  });

  const meshNode = (
    <mesh
      ref={(m) => {
        if (m) {
          earthRef.current = m;
          if (onEarthMesh) onEarthMesh(m);
        }
      }}
      castShadow={!isLowEnd}
      receiveShadow={!isLowEnd}
    >
      <sphereGeometry args={[EARTH_RADIUS, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
      <shaderMaterial
        ref={shaderMatRef}
        uniforms={earthUniforms}
        vertexShader={EarthShader.vertexShader}
        fragmentShader={EarthShader.fragmentShader}
      />
    </mesh>
  );

  if (noGroupTilt) {
    return meshNode;
  }

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      {meshNode}
    </group>
  );
};

export default Earth;
