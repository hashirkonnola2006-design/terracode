import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShaderMaterial } from './shaders/earthShader';
import { AtmosphereShaderMaterial } from './shaders/atmosphereShader';

interface EarthSphereProps {
  healProgress: number;     // 0.0 to 1.0
  scrollRotation?: number;  // radians offset driven by scroll
  lowDetail?: boolean;
}

/**
 * EarthSphere Component
 * 
 * Clean, layered 3D planet:
 * 1. Earth Surface (scale 1.0): Custom ShaderMaterial with day map, normal map,
 *    specular map, and organic FBM wave healing.
 * 2. Cloud Sphere (scale 1.015): Rotating cloud layer that shifts from brown smog
 *    when polluted to crisp white clouds when healed.
 * 3. Atmosphere Halo (scale 1.10): BackSide Fresnel glow shifting from dim gray-red
 *    smog corona to bright cyan-green ozone shield.
 */
export const EarthSphere: React.FC<EarthSphereProps> = ({
  healProgress,
  scrollRotation = 0,
  lowDetail = false,
}) => {
  const earthRef   = useRef<THREE.Mesh>(null!);
  const cloudsRef  = useRef<THREE.Mesh>(null!);
  const atmoRef    = useRef<THREE.Mesh>(null!);
  const earthMat   = useRef<THREE.ShaderMaterial>(null!);
  const atmoMat    = useRef<THREE.ShaderMaterial>(null!);

  const { camera } = useThree();

  // Load 2K textures
  const [dayMap, specularMap, normalMap, cloudsMap] = useTexture([
    '/textures/earth_day_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_clouds.png',
  ]);

  [dayMap, specularMap, normalMap, cloudsMap].forEach((t) => {
    t.anisotropy = 4;
  });

  // Earth shader uniforms
  const earthUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms);
    u.uDayMap.value      = dayMap;
    u.uSpecularMap.value = specularMap;
    u.uNormalMap.value   = normalMap;
    return u;
  }, [dayMap, specularMap, normalMap]);

  // Atmosphere shader uniforms
  const atmoUniforms = useMemo(() => {
    return THREE.UniformsUtils.clone(AtmosphereShaderMaterial.uniforms);
  }, []);

  // Dedicated cloud material
  const cloudsMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 1.0,
      metalness: 0.0,
    });
  }, [cloudsMap]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const camPos = camera.position;

    if (earthMat.current) {
      const u = earthMat.current.uniforms;
      u.uTime.value = t;
      u.uHeal.value = THREE.MathUtils.lerp(u.uHeal.value, healProgress, 0.08);
      u.uCameraPos.value.copy(camPos);
    }

    if (atmoMat.current) {
      const u = atmoMat.current.uniforms;
      u.uHeal.value = THREE.MathUtils.lerp(u.uHeal.value, healProgress, 0.08);
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

      // Cloud tint & opacity: dark brown smog when polluted, bright white when healed
      const currentHeal = earthMat.current?.uniforms.uHeal.value ?? healProgress;
      cloudsMat.color.lerpColors(
        new THREE.Color(0.26, 0.22, 0.16), // smog brown
        new THREE.Color(1.0,  1.0,  1.0),  // clean white
        currentHeal
      );
      cloudsMat.opacity = THREE.MathUtils.lerp(0.58, 0.45, currentHeal);
    }

    if (atmoRef.current) {
      atmoRef.current.rotation.set(tiltX, baseRotation, tiltZ);
    }
  });

  const seg = lowDetail ? 36 : 64;

  return (
    <group>
      {/* 1. Atmosphere halo (BackSide, scaled slightly larger) */}
      <mesh ref={atmoRef} scale={1.11}>
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

      {/* 2. Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          ref={earthMat}
          uniforms={earthUniforms}
          vertexShader={EarthShaderMaterial.vertexShader}
          fragmentShader={EarthShaderMaterial.fragmentShader}
        />
      </mesh>

      {/* 3. Separate Cloud Sphere */}
      <mesh ref={cloudsRef} scale={1.015}>
        <sphereGeometry args={[1, seg, seg]} />
        <primitive object={cloudsMat} attach="material" />
      </mesh>
    </group>
  );
};
