import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EarthShaderMaterial } from './shaders/earthShader';

interface EarthSphereProps {
  healProgress: number; // 0.0 to 1.0
  scrollRotation?: number; // radians offset driven by scroll
  lowDetail?: boolean;
}

/**
 * EarthSphere Component
 * 
 * Renders the central 3D planet using our custom procedural + textured EarthShader.
 * - Samples 2K Blue Marble maps for recognizable realistic continents and oceans.
 * - Procedural degradation (Voronoi cracks, toxic oil sludge) when uHeal = 0.
 * - Organic noise wave transition with emerald glowing frontier edge (#4ADE80).
 * - Multi-layer cloud sphere with independent rotation for depth.
 */
export const EarthSphere: React.FC<EarthSphereProps> = ({
  healProgress,
  scrollRotation = 0,
  lowDetail = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Load 2K textures
  const [dayMap, specularMap, cloudsMap] = useTexture([
    '/textures/earth_atmos_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_clouds_1024.png',
  ]);

  // Clone shader material uniforms
  const shaderData = useMemo(() => {
    const uniforms = THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms);
    uniforms.uDayMap.value = dayMap;
    uniforms.uSpecularMap.value = specularMap;
    uniforms.uCloudsMap.value = cloudsMap;

    return {
      uniforms,
      vertexShader: EarthShaderMaterial.vertexShader,
      fragmentShader: EarthShaderMaterial.fragmentShader,
    };
  }, [dayMap, specularMap, cloudsMap]);

  useFrame((state) => {
    if (!materialRef.current || !meshRef.current) return;

    // Advance time uniform
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Smoothly interpolate uHeal uniform
    const currentHeal = materialRef.current.uniforms.uHeal.value;
    materialRef.current.uniforms.uHeal.value = THREE.MathUtils.lerp(
      currentHeal,
      healProgress,
      0.1
    );

    // Idle axial rotation + scroll rotation
    const baseRotation = (state.clock.elapsedTime * 0.05) + scrollRotation;
    meshRef.current.rotation.y = baseRotation;
    // Natural axial tilt (23.5 degrees)
    meshRef.current.rotation.z = 0.22;
    meshRef.current.rotation.x = 0.12;

    // Rotate separate clouds layer slightly faster for 3D depth
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = baseRotation * 1.15;
      cloudsRef.current.rotation.z = 0.22;
      cloudsRef.current.rotation.x = 0.12;
    }
  });

  const segments = lowDetail ? 36 : 64;

  return (
    <group>
      {/* Main Earth Surface Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, segments, segments]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={shaderData.uniforms}
          vertexShader={shaderData.vertexShader}
          fragmentShader={shaderData.fragmentShader}
        />
      </mesh>

      {/* Outer 3D Cloud Sphere with Translucency */}
      <mesh ref={cloudsRef} scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[1, segments, segments]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.35 + healProgress * 0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
