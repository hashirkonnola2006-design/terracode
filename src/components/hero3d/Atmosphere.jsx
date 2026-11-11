import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS, AXIAL_TILT_X, AXIAL_TILT_Z } from './Earth';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Atmosphere Rim Glow)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SCALE = 1.022;         // Thin atmospheric envelope (2.2% of radius)
export const ATMOSPHERE_INTENSITY = 1.45;      // Subtle rim glow, no bright glowing halo

const AtmosphereShader = {
  uniforms: {
    uPollution: { value: 1.0 },
    uHeal:      { value: 0.0 },
    uIntensity: { value: ATMOSPHERE_INTENSITY },
    uCameraPos: { value: new THREE.Vector3(0, 0, 3.65) },
    uColdRim:   { value: 0.0 },
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
    uniform float uColdRim;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      float pollution = clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);

      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Thin, crisp Fresnel limb
      float NdotV = max(dot(wn, viewDir), 0.0);
      float fresnel = 1.0 - NdotV;
      float rim = pow(fresnel, mix(5.6, 7.2, uColdRim));

      // Light direction & horizon arc modulation
      vec3 lightDir = normalize(mix(vec3(-0.55, 0.65, 0.52), vec3(-0.75, 0.58, 0.32), uColdRim));
      float sunDot = max(dot(wn, lightDir), 0.0);
      float topArc = smoothstep(-0.15, 0.55, wn.y);
      float rimMod = mix(0.50 + 0.55 * pow(sunDot, 1.5), 0.55 + 0.95 * topArc, uColdRim);

      // Colors: Muted rust-gray when polluted standard; bright electric cyan when coldRim=1 (hero target reference)
      vec3 colStandardPolluted = vec3(0.42, 0.28, 0.22);
      vec3 colColdPolluted     = vec3(0.04, 0.82, 1.00);
      vec3 colPolluted   = mix(colStandardPolluted, colColdPolluted, uColdRim);

      vec3 colClean      = vec3(0.00, 0.78, 1.00); // Bright electric cyan
      vec3 crestPolluted = mix(vec3(0.50, 0.35, 0.26), vec3(0.40, 0.90, 1.00), uColdRim);
      vec3 crestClean    = vec3(0.72, 0.90, 1.00);

      vec3 atmoColor = mix(colClean, colPolluted, pollution);
      vec3 crestColor = mix(crestClean, crestPolluted, pollution);
      atmoColor = mix(atmoColor, crestColor, pow(fresnel, 8.5) * 0.35);

      float alpha = rim * rimMod * uIntensity * mix(1.0, 0.75, pollution);
      if (alpha < 0.001) discard;

      gl_FragColor = vec4(atmoColor, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const Atmosphere = ({ healProgress = 0, pollution = 1.0, coldRim = false }) => {
  const atmoRef = useRef(null);
  const atmoMatRef = useRef(null);
  const { camera } = useThree();

  const initialPollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  const atmoUniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(AtmosphereShader.uniforms);
    u.uPollution.value = initialPollution;
    u.uHeal.value = 1.0 - initialPollution;
    u.uColdRim.value = coldRim ? 1.0 : 0.0;
    return u;
  }, [coldRim]);

  useFrame((_, delta) => {
    const targetPollution = pollution !== undefined ? pollution : 1.0 - healProgress;
    
    if (atmoMatRef.current) {
      atmoMatRef.current.uniforms.uCameraPos.value.copy(camera.position);
      atmoMatRef.current.uniforms.uColdRim.value = coldRim ? 1.0 : 0.0;
      atmoMatRef.current.uniforms.uPollution.value = THREE.MathUtils.lerp(
        atmoMatRef.current.uniforms.uPollution.value,
        targetPollution,
        Math.min(delta * 4.0, 1.0)
      );
      atmoMatRef.current.uniforms.uHeal.value = 1.0 - atmoMatRef.current.uniforms.uPollution.value;
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
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
