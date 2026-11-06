import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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
 * Renders the central 3D planet using our custom procedural EarthShaderMaterial.
 * Features:
 * - 0 texture downloads (100% procedural GLSL for maximum web sustainability).
 * - Organic healing wave propagation driven by healProgress (uHeal uniform).
 * - Dual idle rotation and scroll-bound planetary orbit.
 */
export const EarthSphere: React.FC<EarthSphereProps> = ({
  healProgress,
  scrollRotation = 0,
  lowDetail = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Clone shader material definition to maintain independent instance
  const shaderData = useMemo(() => {
    return {
      uniforms: THREE.UniformsUtils.clone(EarthShaderMaterial.uniforms),
      vertexShader: EarthShaderMaterial.vertexShader,
      fragmentShader: EarthShaderMaterial.fragmentShader,
    };
  }, []);

  useFrame((state) => {
    if (!materialRef.current || !meshRef.current) return;

    // Advance procedural time uniform for shimmering waves and cloud drift
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Smoothly interpolate uHeal uniform towards the target healProgress
    const currentHeal = materialRef.current.uniforms.uHeal.value;
    materialRef.current.uniforms.uHeal.value = THREE.MathUtils.lerp(
      currentHeal,
      healProgress,
      0.1
    );

    // Continuous idle axial rotation + scroll-driven rotation
    meshRef.current.rotation.y = (state.clock.elapsedTime * 0.06) + scrollRotation;
    // Gentle natural axial tilt (23.5 degrees = ~0.41 rads)
    meshRef.current.rotation.z = 0.22;
    meshRef.current.rotation.x = 0.12;
  });

  // Sphere geometry resolution: 64 segments for desktop, 36 for mobile/eco mode
  const segments = lowDetail ? 36 : 64;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={shaderData.uniforms}
        vertexShader={shaderData.vertexShader}
        fragmentShader={shaderData.fragmentShader}
      />
    </mesh>
  );
};
