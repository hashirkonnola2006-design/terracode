import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS, AXIAL_TILT_X, AXIAL_TILT_Z } from './Earth';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Atmosphere Rim Glow & Smog Haze)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SCALE = 1.022;         // Thin atmospheric envelope (2.2% of radius)
export const ATMOSPHERE_INTENSITY = 1.85;      // Soft luminous radiance without solid ring
export const SMOG_SCALE = 1.018;               // Semi-transparent smog envelope hugging planet

// ── 1. ATMOSPHERE RIM GLOW SHADER (Dull orange-brown when polluted; bright cyan when clean) ──
const AtmosphereShader = {
  uniforms: {
    uPollution: { value: 1.0 },
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
    uniform float uPollution;
    uniform float uHeal;
    uniform float uIntensity;
    uniform vec3  uCameraPos;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      float pollution = clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);

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

      // Colors: Dull orange-brown when polluted; bright electric cyan-blue when clean
      vec3 colPolluted = vec3(0.58, 0.28, 0.12); // Dull orange-brown
      vec3 colClean    = vec3(0.00, 0.78, 1.00); // Bright electric cyan
      vec3 crestPolluted = vec3(0.68, 0.38, 0.16);
      vec3 crestClean    = vec3(0.72, 0.90, 1.00);

      vec3 atmoColor = mix(colClean, colPolluted, pollution);
      vec3 crestColor = mix(crestClean, crestPolluted, pollution);
      atmoColor = mix(atmoColor, crestColor, pow(fresnel, 8.5) * 0.35);

      float alpha = rim * rimMod * uIntensity;
      if (alpha < 0.001) discard;

      gl_FragColor = vec4(atmoColor, clamp(alpha, 0.0, 1.0));
    }
  `
};

// ── 2. SMOG LAYER SHADER (Semi-transparent brownish-gray haze thicker near horizon) ──
const SmogShader = {
  uniforms: {
    uPollution: { value: 1.0 },
    uHeal:      { value: 0.0 },
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
    uniform float uPollution;
    uniform float uHeal;
    uniform vec3  uCameraPos;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      float pollution = clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);
      if (pollution < 0.01) discard;

      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      float NdotV = clamp(dot(wn, viewDir), 0.0, 1.0);

      // Thicker near the horizon (where NdotV approaches 0)
      float horizon = pow(1.0 - NdotV, 2.2);

      // Brownish-gray haze tones (darker toward center, dusty hazy at horizon)
      vec3 smogCenter = vec3(0.32, 0.27, 0.22);
      vec3 smogHorizon = vec3(0.48, 0.38, 0.28);
      vec3 smogColor = mix(smogCenter, smogHorizon, horizon);

      // Semi-transparent: subtle across center, noticeably dense at horizon
      float alpha = mix(0.12, 0.68, horizon) * pollution;

      gl_FragColor = vec4(smogColor, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const Atmosphere = ({ healProgress = 0, pollution = 1.0 }) => {
  const atmoRef = useRef(null);
  const smogRef = useRef(null);
  const atmoMatRef = useRef(null);
  const smogMatRef = useRef(null);
  const { camera } = useThree();

  const initialPollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  const atmoUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(AtmosphereShader.uniforms);
    u.uPollution.value = initialPollution;
    u.uHeal.value = 1.0 - initialPollution;
    return u;
  }, []);

  const smogUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(SmogShader.uniforms);
    u.uPollution.value = initialPollution;
    u.uHeal.value = 1.0 - initialPollution;
    return u;
  }, []);

  useFrame((_, delta) => {
    const targetPollution = pollution !== undefined ? pollution : 1.0 - healProgress;
    
    if (atmoMatRef.current) {
      atmoMatRef.current.uniforms.uCameraPos.value.copy(camera.position);
      atmoMatRef.current.uniforms.uPollution.value = THREE.MathUtils.lerp(
        atmoMatRef.current.uniforms.uPollution.value,
        targetPollution,
        Math.min(delta * 4.0, 1.0)
      );
      atmoMatRef.current.uniforms.uHeal.value = 1.0 - atmoMatRef.current.uniforms.uPollution.value;
    }

    if (smogMatRef.current) {
      smogMatRef.current.uniforms.uCameraPos.value.copy(camera.position);
      smogMatRef.current.uniforms.uPollution.value = THREE.MathUtils.lerp(
        smogMatRef.current.uniforms.uPollution.value,
        targetPollution,
        Math.min(delta * 4.0, 1.0)
      );
      smogMatRef.current.uniforms.uHeal.value = 1.0 - smogMatRef.current.uniforms.uPollution.value;
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      {/* 1. Smog Envelope: Semi-transparent brownish-gray haze thicker near horizon */}
      <mesh ref={smogRef} scale={EARTH_RADIUS * SMOG_SCALE}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={smogMatRef}
          uniforms={smogUniforms}
          vertexShader={SmogShader.vertexShader}
          fragmentShader={SmogShader.fragmentShader}
          side={THREE.FrontSide}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* 2. Atmosphere Rim Glow: Dull orange-brown when polluted; bright cyan when clean */}
      <mesh ref={atmoRef} scale={EARTH_RADIUS * ATMOSPHERE_SCALE}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={atmoMatRef}
          uniforms={atmoUniforms}
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
