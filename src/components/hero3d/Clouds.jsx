import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  EARTH_RADIUS,
  BASE_ROTATION_SPEED,
  AXIAL_TILT_X,
  AXIAL_TILT_Z,
  INITIAL_ROTATION_Y
} from './Earth';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Clouds & Atmosphere Layers)
// ═══════════════════════════════════════════════════════════════
export const CLOUD_RADIUS_OFFSET = 0.012;     // Floats gracefully above terrain
export const CLOUD_SPEED_MULTIPLIER = 1.08;   // Rotates slightly faster for natural parallax

const CloudShader = {
  uniforms: {
    uMap:       { value: null },
    uHeal:      { value: 0.0 },
    uTime:      { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;

    void main() {
      vUv = uv;
      vViewNormal = normalize(normalMatrix * normal);
      vViewPos    = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D uMap;
    uniform float     uHeal;
    uniform float     uTime;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;

    void main() {
      vec4 tex = texture2D(uMap, vUv);

      // Contrast curve: crisp natural NASA weather systems and storm fronts
      float cloudDensity = smoothstep(0.18, 0.75, tex.r);
      if (cloudDensity < 0.02) discard;

      // Fully-lit diffuse lighting with wrap factor: no dark terminator
      vec3 V = normalize(-vViewPos);
      vec3 N = normalize(vViewNormal);
      vec3 keyDir = normalize(vec3(-0.35, 0.42, 0.84));
      float NdotL = dot(N, keyDir);
      float diffuse = 0.70 + 0.30 * clamp(NdotL, 0.0, 1.0);

      // Soft limb falloff
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, 0.30);

      // ── COLOR SHIFT DRIVEN BY uHeal ──
      // Polluted: smoky, dingy industrial gray-brown haze
      // Healed: pristine brilliant white clouds
      vec3 pollutedCloud = vec3(0.60, 0.56, 0.50);
      vec3 healedCloud   = vec3(1.00, 1.00, 1.00);
      vec3 cloudCol      = mix(pollutedCloud, healedCloud, uHeal) * diffuse * limb;

      float baseAlpha = mix(0.25, 0.45, uHeal);
      float alpha = cloudDensity * baseAlpha;

      gl_FragColor = vec4(cloudCol, alpha);
    }
  `
};

export const Clouds = ({ scrollRotation = 0, healProgress = 0 }) => {
  const cloudsRef = useRef(null);
  const matRef = useRef(null);

  const cloudsMap = useTexture('/textures/earth_clouds_2k.jpg');

  useEffect(() => {
    cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    cloudsMap.magFilter = THREE.LinearFilter;
    cloudsMap.generateMipmaps = true;
    cloudsMap.needsUpdate = true;
  }, [cloudsMap]);

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(CloudShader.uniforms);
    u.uMap.value = cloudsMap;
    u.uHeal.value = healProgress;
    return u;
  }, [cloudsMap]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (matRef.current) {
      matRef.current.uniforms.uHeal.value = healProgress;
      matRef.current.uniforms.uTime.value = t;
    }

    if (cloudsRef.current) {
      const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, 0.010, healProgress) * CLOUD_SPEED_MULTIPLIER;
      cloudsRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation * CLOUD_SPEED_MULTIPLIER;
    }
  });

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      <mesh ref={cloudsRef} scale={EARTH_RADIUS + CLOUD_RADIUS_OFFSET}>
        <sphereGeometry args={[1.0, 128, 128]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={CloudShader.vertexShader}
          fragmentShader={CloudShader.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
};

export default Clouds;
