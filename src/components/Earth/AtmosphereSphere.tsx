import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AtmosphereShaderMaterial } from './shaders/atmosphereShader';

interface AtmosphereSphereProps {
  healProgress: number;
  lowDetail?: boolean;
}

/**
 * AtmosphereSphere Component
 * 
 * Renders the glowing atmospheric envelope around Earth.
 * Dynamically shifts from a choking reddish-brown smog shroud
 * to a brilliant cyan-green protective ozone layer.
 */
export const AtmosphereSphere: React.FC<AtmosphereSphereProps> = ({
  healProgress,
  lowDetail = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const shaderData = useMemo(() => {
    return {
      uniforms: THREE.UniformsUtils.clone(AtmosphereShaderMaterial.uniforms),
      vertexShader: AtmosphereShaderMaterial.vertexShader,
      fragmentShader: AtmosphereShaderMaterial.fragmentShader,
    };
  }, []);

  useFrame(() => {
    if (!materialRef.current) return;
    const currentHeal = materialRef.current.uniforms.uHeal.value;
    materialRef.current.uniforms.uHeal.value = THREE.MathUtils.lerp(
      currentHeal,
      healProgress,
      0.1
    );
  });

  const segments = lowDetail ? 32 : 48;

  return (
    <mesh ref={meshRef} scale={[1.08, 1.08, 1.08]}>
      <sphereGeometry args={[1, segments, segments]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={shaderData.uniforms}
        vertexShader={shaderData.vertexShader}
        fragmentShader={shaderData.fragmentShader}
        transparent={true}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

