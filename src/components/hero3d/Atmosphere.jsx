import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_RADIUS, AXIAL_TILT_X, AXIAL_TILT_Z } from './Earth';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Atmosphere Rim Glow)
// ═══════════════════════════════════════════════════════════════
export const ATMOSPHERE_SCALE = 1.034;         // Thin limb glow hugging planet edge
export const ATMOSPHERE_INTENSITY = 2.6;       // Radiance on sunlit crescent
export const ATMOSPHERE_POLLUTED_COLOR = '#889280'; // Dim, yellow-grey smoggy haze at heal = 0
export const ATMOSPHERE_HEALED_COLOR   = '#00b4ff'; // Brilliant clean electric cyan at heal = 1

const AtmosphereShader = {
  uniforms: {
    uSunDir:     { value: new THREE.Vector3(-1.95, 1.10, 0.55).normalize() },
    uCameraPos:  { value: new THREE.Vector3(0, 0, 3.2) },
    uHeal:       { value: 0.0 },
    uIntensity:  { value: ATMOSPHERE_INTENSITY },
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
    uniform vec3  uSunDir;
    uniform vec3  uCameraPos;
    uniform float uHeal;
    uniform float uIntensity;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Limb fresnel: silhouette edge where dot(wn, viewDir) is 0.0
      float costheta = clamp(abs(dot(wn, viewDir)), 0.0, 1.0);
      float rim = pow(1.0 - costheta, 3.6);
      float outerFade = smoothstep(0.0, 0.16, costheta);
      float limbAlpha = rim * outerFade;

      // Directional gating: wn points toward upper-left sun on sunlit limb
      float sunDot = dot(normalize(uSunDir), wn);
      float sunMask = smoothstep(0.12, 0.78, sunDot);

      if (sunMask < 0.005) discard;

      // ── COLOR SHIFT DRIVEN BY uHeal ──
      // Heal = 0: dim, yellowish-grey smog haze
      // Heal = 1: brilliant, radiant cyan ozone
      vec3 colPolluted = vec3(0.55, 0.58, 0.50);
      vec3 colHealed   = vec3(0.00, 0.72, 1.00);
      vec3 crestSun    = vec3(1.00, 0.98, 0.92);

      vec3 baseColor = mix(colPolluted, colHealed, uHeal);
      vec3 finalColor = mix(baseColor, crestSun, smoothstep(0.40, 0.90, sunDot) * 0.65);

      float intensity = mix(uIntensity * 0.75, uIntensity * 1.15, uHeal);
      float finalAlpha = limbAlpha * sunMask * intensity;

      gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
    }
  `
};

export const Atmosphere = ({ healProgress = 0 }) => {
  const atmoRef = useRef(null);
  const matRef = useRef(null);
  const { camera, viewport } = useThree();

  const isPortrait = viewport.width < viewport.height;
  const anchorX = isPortrait ? 0.36 : 0.41;
  const anchorY = isPortrait ? 0.40 : 0.36;
  const sunDir = useMemo(() => {
    return new THREE.Vector3(-viewport.width * anchorX, viewport.height * anchorY, 0.15).normalize();
  }, [viewport.width, viewport.height, anchorX, anchorY]);

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(AtmosphereShader.uniforms);
    u.uSunDir.value.copy(sunDir);
    u.uHeal.value = healProgress;
    return u;
  }, [sunDir]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uniforms.uCameraPos.value.copy(camera.position);
      matRef.current.uniforms.uSunDir.value.copy(sunDir);
      matRef.current.uniforms.uHeal.value = healProgress;
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      <mesh ref={atmoRef} scale={EARTH_RADIUS * ATMOSPHERE_SCALE}>
        <sphereGeometry args={[1, 64, 64]} />
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
