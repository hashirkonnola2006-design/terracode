import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS, AXIAL_TILT_X, AXIAL_TILT_Z } from './Earth';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Atmosphere Rim Glow)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SCALE = 1.022;         // Thin atmospheric envelope (2.2% of radius)
export const ATMOSPHERE_INTENSITY = 1.85;      // Soft luminous radiance without solid ring

const AtmosphereShader = {
  uniforms: {
    uHeal:      { value: 0.0 },
    uIntensity: { value: ATMOSPHERE_INTENSITY },
    uCameraPos: { value: new THREE.Vector3(0, 0, 3.65) },
  },

  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform float uIntensity;
    uniform vec3  uCameraPos;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Thin, soft Fresnel limb: 0 in center, peaks at silhouette edge
      float NdotV = max(dot(wn, viewDir), 0.0);
      float fresnel = 1.0 - NdotV;
      
      // High exponent keeps it tightly bounded to a thin 2-3% rim
      float rim = pow(fresnel, 5.2);

      // Light direction: brighter on the upper-left (sun direction)
      vec3 lightDir = normalize(vec3(-0.55, 0.65, 0.52));
      float sunDot = max(dot(wn, lightDir), 0.0);
      float rimMod = 0.55 + 0.70 * pow(sunDot, 1.5);

      // Soft electric cyan-blue color
      vec3 colPolluted = vec3(0.18, 0.48, 0.82);
      vec3 colHealed   = vec3(0.00, 0.78, 1.00);
      vec3 crestWhite  = vec3(0.72, 0.90, 1.00);

      vec3 atmoColor = mix(colPolluted, colHealed, uHeal);
      atmoColor = mix(atmoColor, crestWhite, pow(fresnel, 8.5) * 0.35);

      float alpha = rim * rimMod * uIntensity;
      if (alpha < 0.001) discard;

      gl_FragColor = vec4(atmoColor, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const Atmosphere = ({ healProgress = 0 }) => {
  const atmoRef = useRef(null);
  const matRef = useRef(null);
  const { camera } = useThree();

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(AtmosphereShader.uniforms);
    u.uHeal.value = healProgress;
    return u;
  }, []);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uCameraPos.value.copy(camera.position);
      matRef.current.uniforms.uHeal.value = healProgress;
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      <mesh ref={atmoRef} scale={EARTH_RADIUS * ATMOSPHERE_SCALE}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={AtmosphereShader.vertexShader}
          fragmentShader={AtmosphereShader.fragmentShader}
          side={THREE.FrontSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default Atmosphere;
