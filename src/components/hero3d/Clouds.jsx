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
    uPollution: { value: 1.0 },
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
    uniform float     uPollution;
    uniform float     uHeal;
    uniform float     uTime;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;

    void main() {
      float pollution = clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);
      vec4 tex = texture2D(uMap, vUv);

      // Contrast curve: crisp natural NASA weather systems and storm fronts
      float cloudDensity = smoothstep(0.18, 0.75, tex.r);
      if (cloudDensity < 0.02) discard;

      // Lighting with wrapped diffuse (clean) or darker night side (polluted)
      vec3 V = normalize(-vViewPos);
      vec3 N = normalize(vViewNormal);
      vec3 keyDir = normalize(vec3(-0.35, 0.42, 0.84));
      float NdotL = dot(N, keyDir);

      float cleanDiffuse = 0.70 + 0.30 * clamp(NdotL, 0.0, 1.0);
      float pollutedDiffuse = clamp(NdotL * 0.85 + 0.15, 0.08, 1.0);
      float diffuse = mix(cleanDiffuse, pollutedDiffuse, pollution);

      // Soft limb falloff
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, 0.30);

      // Color: dingy sooty industrial brown-gray when polluted; pristine white when clean
      vec3 pollutedCloud = vec3(0.40, 0.35, 0.30);
      vec3 healedCloud   = vec3(1.00, 1.00, 1.00);
      vec3 cloudCol      = mix(healedCloud, pollutedCloud, pollution) * diffuse * limb;

      float baseAlpha = mix(0.40, 0.58, pollution);
      float alpha = cloudDensity * baseAlpha;

      gl_FragColor = vec4(cloudCol, alpha);
    }
  `
};

export const Clouds = ({
  scrollRotation = 0,
  healProgress = 0,
  pollution = 1.0,
  autoRotate = true,
  noGroupTilt = false,
}) => {
  const cloudsRef = useRef(null);
  const matRef = useRef(null);

  const cloudsMap = useTexture('/textures/earth_clouds_2k.jpg');

  useEffect(() => {
    cloudsMap.wrapS = THREE.RepeatWrapping;
    cloudsMap.wrapT = THREE.ClampToEdgeWrapping;
    cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    cloudsMap.magFilter = THREE.LinearFilter;
    cloudsMap.generateMipmaps = true;
    cloudsMap.needsUpdate = true;
  }, [cloudsMap]);

  const initialPollution = pollution !== undefined ? pollution : 1.0 - healProgress;

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(CloudShader.uniforms);
    u.uMap.value = cloudsMap;
    u.uPollution.value = initialPollution;
    u.uHeal.value = 1.0 - initialPollution;
    return u;
  }, [cloudsMap]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const targetPollution = pollution !== undefined ? pollution : 1.0 - healProgress;

    if (matRef.current) {
      matRef.current.uniforms.uPollution.value = THREE.MathUtils.lerp(
        matRef.current.uniforms.uPollution.value,
        targetPollution,
        Math.min(delta * 4.0, 1.0)
      );
      matRef.current.uniforms.uHeal.value = 1.0 - matRef.current.uniforms.uPollution.value;
      matRef.current.uniforms.uTime.value = t;
    }

    if (cloudsRef.current) {
      if (autoRotate) {
        const cleanProgress = 1.0 - (matRef.current ? matRef.current.uniforms.uPollution.value : initialPollution);
        const currentSpeed = THREE.MathUtils.lerp(BASE_ROTATION_SPEED, 0.010, cleanProgress) * CLOUD_SPEED_MULTIPLIER;
        cloudsRef.current.rotation.y = INITIAL_ROTATION_Y + t * currentSpeed + scrollRotation * CLOUD_SPEED_MULTIPLIER;
      } else {
        // Subtle natural cloud drift relative to the rotating planet
        cloudsRef.current.rotation.y += delta * 0.003;
      }
    }
  });

  const meshNode = (
    <mesh ref={cloudsRef} scale={EARTH_RADIUS + CLOUD_RADIUS_OFFSET}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={CloudShader.vertexShader}
        fragmentShader={CloudShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );

  if (noGroupTilt) {
    return meshNode;
  }

  return (
    <group rotation={[AXIAL_TILT_X, 0, AXIAL_TILT_Z]}>
      {meshNode}
    </group>
  );
};

export default Clouds;
