import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SmogShaderMaterial } from './shaders/smogShader';

interface SmogLayerProps {
  healProgress: number;
  lowDetail?: boolean;
}

/**
 * SmogLayer Component
 * 
 * Volumetric toxic smog cloud layer circling the polluted planet.
 * Rotates counter to planetary spin to simulate complex atmospheric winds,
 * and dissolves completely into clean air as uHeal approaches 1.0.
 */
export const SmogLayer: React.FC<SmogLayerProps> = ({
  healProgress,
  lowDetail = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const shaderData = useMemo(() => {
    return {
      uniforms: THREE.UniformsUtils.clone(SmogShaderMaterial.uniforms),
      vertexShader: SmogShaderMaterial.vertexShader,
      fragmentShader: SmogShaderMaterial.fragmentShader,
    };
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    
    // Smooth heal progress
    const currentHeal = materialRef.current.uniforms.uHeal.value;
    materialRef.current.uniforms.uHeal.value = THREE.MathUtils.lerp(
      currentHeal,
      healProgress,
      0.1
    );

    // Smog rotates at different rate to create depth
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.x += delta * 0.02;
  });

  const segments = lowDetail ? 32 : 48;

  return (
    <mesh ref={meshRef} scale={[1.025, 1.025, 1.025]}>
      <sphereGeometry args={[1, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={shaderData.uniforms}
        vertexShader={shaderData.vertexShader}
        fragmentShader={shaderData.fragmentShader}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

