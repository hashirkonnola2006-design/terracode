import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShader } from './shaders/EarthShader';

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

export const Earth = ({ onEarthMesh, scrollRotation = 0, healProgress = 0, isLowEnd = false }) => {
  const { gl } = useThree();
  const earthRef = useRef(null);
  const shaderMatRef = useRef(null);

  // Progressive Loading: Load lightweight 2K maps instantly (<100ms)
  const [dayMap2k, normalMap, specularMap] = useTexture([
    '/textures/earth_day_2k.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_specular_2048.jpg',
  ]);

  // Configure high-resolution mipmaps and maximum hardware anisotropy
  useEffect(() => {
    const maxAnisotropy = gl.capabilities ? gl.capabilities.getMaxAnisotropy() : 8;

    dayMap2k.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    specularMap.colorSpace = THREE.NoColorSpace;

    [dayMap2k, normalMap, specularMap].forEach((t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAnisotropy;
      t.needsUpdate = true;
    });

    // Progressive upgrade: If desktop / high-end mode, load 8K daymap in background
    // if (!isLowEnd) {
    //   const loader = new THREE.TextureLoader();
    //   loader.load('/textures/earth_day_8k.jpg', (tex8k) => {
    //     tex8k.colorSpace = THREE.SRGBColorSpace;
    //     tex8k.minFilter = THREE.LinearMipmapLinearFilter;
    //     tex8k.magFilter = THREE.LinearFilter;
    //     tex8k.generateMipmaps = true;
    //     tex8k.anisotropy = maxAnisotropy;
    //     tex8k.needsUpdate = true;
    //     if (shaderMatRef.current) {
    //       shaderMatRef.current.uniforms.uDayMap.value = tex8k;
    //       shaderMatRef.current.uniformsNeedUpdate = true;
    //     }
    //   });
    // }
  }, [dayMap2k, normalMap, specularMap, gl, isLowEnd]);

  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShader.uniforms);
    u.uDayMap.value = dayMap2k;
    u.uNormalMap.value = normalMap;
    u.uSpecularMap.value = specularMap;
    u.uHeal.value = healProgress;
    return u;
  }, [dayMap2k, normalMap, specularMap]);

  const smoothHealRef = useRef(healProgress);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    smoothHealRef.current = THREE.MathUtils.lerp(smoothHealRef.current, healProgress, Math.min(delta * 4.0, 1.0));

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uHeal.value = smoothHealRef.current;
      shaderMatRef.current.uniforms.uTime.value = t;
    }

    if (earthRef.current) {
      const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, HEALED_ROTATION_SPEED, smoothHealRef.current);
      earthRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation;

      const s = 1.0 + smoothHealRef.current * HEAL_SCALE_EXPANSION;
      earthRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
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
    </group>
  );
};

export default Earth;
