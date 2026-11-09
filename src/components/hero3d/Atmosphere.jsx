import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS, AXIAL_TILT_X, AXIAL_TILT_Z } from './Earth';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Atmosphere Rim Glow)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SCALE = 1.022;         // Atmospheric envelope hugging planet curvature
export const ATMOSPHERE_INTENSITY = 2.4;       // Luminous radiance of the rim

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

      // Fresnel limb: silhouette edge where dot(wn, viewDir) approaches 0.0
      float costheta = clamp(abs(dot(wn, viewDir)), 0.0, 1.0);
      float rim = pow(1.0 - costheta, 3.8);

      // Soft outer edge fade so atmosphere seamlessly dissolves into deep space void
      float outerFade = smoothstep(0.0, 0.22, costheta);
      float limbAlpha = rim * outerFade;

      if (limbAlpha < 0.005) discard;

      // ── COLOR PROFILE DRIVEN BY uHeal ──
      // Polluted: subtle deeper blue-gray ozone haze
      // Healed: brilliant, vibrant electric cyan-blue ozone
      vec3 colPolluted = vec3(0.12, 0.45, 0.72);
      vec3 colHealed   = vec3(0.00, 0.75, 1.00);
      vec3 crestWhite  = vec3(0.70, 0.92, 1.00);

      vec3 atmoColor = mix(colPolluted, colHealed, uHeal);
      // Bright inner crest rim
      atmoColor = mix(atmoColor, crestWhite, pow(rim, 6.0) * 0.45);

      float intensity = mix(uIntensity * 0.85, uIntensity * 1.25, uHeal);
      float finalAlpha = limbAlpha * intensity;

      gl_FragColor = vec4(atmoColor, clamp(finalAlpha, 0.0, 1.0));
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
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default Atmosphere;
