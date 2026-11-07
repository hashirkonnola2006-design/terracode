import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShader } from './shaders/EarthShader';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Earth Geometry & Orientation)
// ═══════════════════════════════════════════════════════════════
export const EARTH_RADIUS = 1.0;            // Base sphere radius
export const EARTH_SEGMENTS = 128;          // 128x128 SphereGeometry
export const BASE_ROTATION_SPEED = 0.016;   // Initial slow spin
export const HEALED_ROTATION_SPEED = 0.010; // Slows slightly as Earth heals
export const AXIAL_TILT_X = 0.20;           // North hemisphere tilted gently towards camera
export const AXIAL_TILT_Z = -0.10;          // Subtle natural axial tilt
export const INITIAL_ROTATION_Y = 2.94;     // Centers India & the Indian Ocean matching 3d_earth.png
export const HEAL_SCALE_EXPANSION = 0.035;  // Expands ~3.5% as biosphere restores

export const Earth = ({ onEarthMesh, scrollRotation = 0, healProgress = 0 }) => {
  const earthRef = useRef(null);
  const shaderMatRef = useRef(null);

  // Load NASA 2K Blue Marble textures with linear mipmap filtering
  const [dayMap, atmosMap, normalMap, specularMap] = useTexture([
    '/textures/earth_day_2048.jpg',
    '/textures/earth_atmos_2048.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_specular_2048.jpg',
  ]);

  useMemo(() => {
    [dayMap, atmosMap, normalMap, specularMap].forEach((t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [dayMap, atmosMap, normalMap, specularMap]);

  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShader.uniforms);
    u.uDayMap.value = dayMap;
    u.uAtmosMap.value = atmosMap;
    u.uNormalMap.value = normalMap;
    u.uSpecularMap.value = specularMap;
    u.uSunDir.value.set(-1.95, 1.10, 0.55).normalize();
    u.uHeal.value = healProgress;
    return u;
  }, [dayMap, atmosMap, normalMap, specularMap]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uHeal.value = healProgress;
    }

    if (earthRef.current) {
      // Rotation slows slightly as Earth recovers
      const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, HEALED_ROTATION_SPEED, healProgress);
      earthRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation;

      // Gentle scale expansion as biosphere recovers
      const s = 1.0 + healProgress * HEAL_SCALE_EXPANSION;
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
