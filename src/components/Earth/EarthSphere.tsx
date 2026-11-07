import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShaderMaterial } from './shaders/earthShader';
import { AtmosphereShaderMaterial } from './shaders/atmosphereShader';

export interface EarthSphereProps {
  healProgress:    number; // 0.0 to 1.0
  scrollRotation?: number; // radians offset driven by scroll
  brightness?:     number; // 0.0 to 1.0 (dims behind text/stats)
  lowDetail?:      boolean;
  onAtmosphereMeshReady?: (mesh: THREE.Mesh) => void;
  onEarthMeshReady?:      (mesh: THREE.Mesh) => void;
}

/**
 * EarthSphere Component
 * 
 * Clean, layered 3D planet:
 * 1. Earth Surface (scale 1.0): Custom ShaderMaterial with 2K day map, normal map,
 *    specular map, and organic FBM wave healing.
 * 2. Cloud Sphere (scale 1.015): Rotating cloud layer that shifts from semi-transparent
 *    gray-brown smog when polluted to crisp white clouds when healed.
 * 3. Atmosphere Halo (scale 1.035): BackSide Fresnel glow shifting from dim gray-red
 *    smog corona to bright cyan-green ozone shield.
 */
export const EarthSphere: React.FC<EarthSphereProps> = ({
  healProgress,
  scrollRotation = 0,
  brightness = 1.0,
  lowDetail = false,
  onAtmosphereMeshReady,
  onEarthMeshReady,
}) => {
  const earthRef   = useRef<THREE.Mesh>(null!);
  const cloudsRef  = useRef<THREE.Mesh>(null!);
  const atmoRef    = useRef<THREE.Mesh>(null!);
  const earthMat   = useRef<THREE.ShaderMaterial>(null!);
  const atmoMat    = useRef<THREE.ShaderMaterial>(null!);

  const { camera } = useThree();

  // URL flags for automated testing: ?mode=atmosphere, ?mode=day, ?heal=0.5
  const [modeAtmosphere, setModeAtmosphere] = useState(false);
  const [modeDay, setModeDay]               = useState(false);
  const [forcedHeal, setForcedHeal]         = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mode') === 'atmosphere') setModeAtmosphere(true);
      if (p.get('mode') === 'day') setModeDay(true);
      const h = p.get('heal');
      if (h !== null && !isNaN(parseFloat(h))) {
        setForcedHeal(parseFloat(h));
      }
    }
  }, []);

  // Inform parent of refs for measurement
  useEffect(() => {
    if (earthRef.current && onEarthMeshReady) {
      onEarthMeshReady(earthRef.current);
    }
  }, [onEarthMeshReady]);

  useEffect(() => {
    if (atmoRef.current && onAtmosphereMeshReady) {
      onAtmosphereMeshReady(atmoRef.current);
    }
  }, [onAtmosphereMeshReady]);

  // Load 2K textures with linear mipmap filtering (Bug 2 fix)
  const [dayMap, specularMap, normalMap, cloudsMap] = useTexture([
    '/textures/earth_day_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_clouds.png',
  ]);

  useMemo(() => {
    [dayMap, specularMap, normalMap, cloudsMap].forEach((t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
  }, [dayMap, specularMap, normalMap, cloudsMap]);

  // CRITICAL: Uniforms cloned ONCE without brightness/heal dependencies to prevent
  // accidental uniform resets during scroll! (Bug 1 fix)
  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms);
    u.uDayMap.value         = dayMap;
    u.uSpecularMap.value    = specularMap;
    u.uNormalMap.value      = normalMap;
    u.uModeDay.value        = modeDay ? 1.0 : 0.0;
    u.uBrightness.value     = 1.0;
    u.uHeal.value           = 0.0;
    return u;
  }, [dayMap, specularMap, normalMap, modeDay]);

  const atmoUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(AtmosphereShaderMaterial.uniforms);
    u.uModeAtmosphere.value = modeAtmosphere ? 1.0 : 0.0;
    u.uBrightness.value     = 1.0;
    u.uHeal.value           = 0.0;
    return u;
  }, [modeAtmosphere]);

  // Cloud material: semi-transparent gray-brown smog when polluted, crisp white when healed
  const cloudsMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 1.0,
      metalness: 0.0,
    });
  }, [cloudsMap]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const camPos = camera.position;
    const effectiveHeal = forcedHeal !== null ? forcedHeal : healProgress;

    if (earthMat.current) {
      const u = earthMat.current.uniforms;
      u.uTime.value = t;
      u.uHeal.value = THREE.MathUtils.lerp(u.uHeal.value, effectiveHeal, 0.12);
      u.uBrightness.value = brightness;
      u.uCameraPos.value.copy(camPos);
      (window as any).__earthShaderUniformHeal = u.uHeal.value;
    }

    if (atmoMat.current) {
      const u = atmoMat.current.uniforms;
      u.uHeal.value = THREE.MathUtils.lerp(u.uHeal.value, effectiveHeal, 0.12);
      u.uBrightness.value = brightness;
      u.uCameraPos.value.copy(camPos);
    }

    // Planetary rotation: slow idle spin + scroll rotation
    const baseRotation = (t * 0.045) + scrollRotation;
    const tiltX = 0.16;
    const tiltZ = 0.04;

    if (earthRef.current) {
      earthRef.current.rotation.set(tiltX, baseRotation, tiltZ);
    }

    // Clouds rotate ~10% faster for atmospheric parallax
    if (cloudsRef.current) {
      cloudsRef.current.rotation.set(tiltX, baseRotation * 1.10, tiltZ);

      // Cloud tint & opacity: semi-transparent gray-brown smog -> clean white
      const currentHeal = earthMat.current?.uniforms.uHeal.value ?? effectiveHeal;
      cloudsMat.color.lerpColors(
        new THREE.Color(0.26, 0.22, 0.18), // semi-transparent smog gray-brown
        new THREE.Color(1.0,  1.0,  1.0),  // clean white
        currentHeal
      );
      cloudsMat.opacity = THREE.MathUtils.lerp(0.22, 0.38, currentHeal) * brightness;
      if (modeAtmosphere) {
        cloudsMat.opacity = 0.0;
      }
    }

    if (atmoRef.current) {
      atmoRef.current.rotation.set(tiltX, baseRotation, tiltZ);
    }
  });

  const seg = lowDetail ? 36 : 64;

  return (
    <group>
      {/* 1. Atmosphere Halo (BackSide, strictly scale 1.035 x Earth radius) */}
      <mesh ref={atmoRef} scale={1.035}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          ref={atmoMat}
          uniforms={atmoUniforms}
          vertexShader={AtmosphereShaderMaterial.vertexShader}
          fragmentShader={AtmosphereShaderMaterial.fragmentShader}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Earth Surface (Scale 1.0) */}
      <mesh ref={earthRef} visible={!modeAtmosphere}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          ref={earthMat}
          uniforms={earthUniforms}
          vertexShader={EarthShaderMaterial.vertexShader}
          fragmentShader={EarthShaderMaterial.fragmentShader}
        />
      </mesh>

      {/* 3. Separate Cloud Sphere (Scale 1.015) */}
      <mesh ref={cloudsRef} scale={1.015} visible={!modeAtmosphere}>
        <sphereGeometry args={[1, seg, seg]} />
        <primitive object={cloudsMat} attach="material" />
      </mesh>
    </group>
  );
};
