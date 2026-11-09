import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
// TWEAKABLE CONSTANTS (Clouds & Atmospheric Smog)
// ═══════════════════════════════════════════════════════════════
export const CLOUD_RADIUS_OFFSET = 0.016;     // Floats just above Earth terrain
export const CLOUD_OPACITY_POLLUTED = 0.45;   // Wispy, atmospheric cloud banks
export const CLOUD_OPACITY_HEALED = 0.40;     // Clean, crisp white clouds
export const CLOUD_SPEED_MULTIPLIER = 1.08;   // Rotates slightly faster for natural parallax

const CloudShader = {
  uniforms: {
    uMap:       { value: null },
    uSunDir:    { value: new THREE.Vector3(-1.95, 1.10, 0.55).normalize() },
    uHeal:      { value: 0.0 },
    uTime:      { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;

    void main() {
      vUv = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    uniform vec3      uSunDir;
    uniform float     uHeal;
    uniform float     uTime;

    varying vec2 vUv;
    varying vec3 vWorldNormal;

    void main() {
      vec4 tex = texture2D(uMap, vUv);

      // Contrast curve: high threshold keeps clear skies crystal clear, only dense clouds render
      float cloudDensity = smoothstep(0.42, 0.88, tex.r);

      // ── PROCEDURAL CYCLONE / TYPHOON VORTEX (Western Pacific) ──
      // Placed at lon ~ 135°E, lat ~ 18°N (vUv: x=0.875, y=0.60)
      // Matches the iconic cyclone seen on the right hemisphere of 3d_earth.png
      vec2 cycloneCenter = vec2(0.875, 0.60);
      vec2 cUv = vUv - cycloneCenter;
      if (cUv.x > 0.5) cUv.x -= 1.0;
      if (cUv.x < -0.5) cUv.x += 1.0;
      float cDist = length(cUv * vec2(1.9, 1.0));
      if (cDist < 0.16) {
        float cAngle = atan(cUv.y, cUv.x) + 4.8 * log(cDist * 7.0 + 0.10) - uTime * 0.15;
        float spiralArms = pow(max(sin(cAngle * 2.5), 0.0), 2.2);
        float eyeHole = smoothstep(0.012, 0.038, cDist);
        float cycloneVortex = spiralArms * (1.0 - cDist / 0.16) * eyeHole;
        cloudDensity = max(cloudDensity, cycloneVortex * 0.95);
      }

      if (cloudDensity < 0.02) discard;

      // Directional sun lighting matching Earth terminator
      vec3 wn = normalize(vWorldNormal);
      float sunDiffuse = smoothstep(-0.06, 0.44, dot(wn, normalize(uSunDir)));

      // ── COLOR SHIFT & FADE-IN DRIVEN BY uHeal (Fades in after 50%) ──
      // Polluted: smoky smoggy clouds at low opacity
      // Healed: pure brilliant white clouds that emerge cleanly
      float cloudFade = smoothstep(0.35, 0.80, uHeal);
      vec3 pollutedCloud = mix(vec3(0.48, 0.44, 0.38), vec3(0.92, 0.88, 0.82), sunDiffuse);
      vec3 healedCloud   = mix(vec3(0.08, 0.12, 0.18), vec3(1.00, 1.00, 1.00), sunDiffuse);

      vec3 cloudCol = mix(pollutedCloud, healedCloud, uHeal);

      float baseOpacity = mix(${CLOUD_OPACITY_POLLUTED.toFixed(2)} * 0.3, ${CLOUD_OPACITY_HEALED.toFixed(2)}, cloudFade);
      float alpha = cloudDensity * (sunDiffuse * 0.88 + 0.12) * baseOpacity;

      gl_FragColor = vec4(cloudCol, alpha);
    }
  `
};

export const Clouds = ({ scrollRotation = 0, healProgress = 0 }) => {
  const { viewport } = useThree();
  const cloudsRef = useRef(null);
  const matRef = useRef(null);

  const isPortrait = viewport.width < viewport.height;
  const anchorX = isPortrait ? 0.36 : 0.41;
  const anchorY = isPortrait ? 0.40 : 0.36;
  const sunDir = useMemo(() => {
    return new THREE.Vector3(-viewport.width * anchorX, viewport.height * anchorY, 0.15).normalize();
  }, [viewport.width, viewport.height, anchorX, anchorY]);

  const cloudsMap = useTexture('/textures/earth_clouds_1024.png');

  useMemo(() => {
    cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    cloudsMap.magFilter = THREE.LinearFilter;
    cloudsMap.generateMipmaps = true;
    cloudsMap.needsUpdate = true;
  }, [cloudsMap]);

  const uniforms = useMemo(() => {
    const u = THREE.UniformsUtils.clone(CloudShader.uniforms);
    u.uMap.value = cloudsMap;
    u.uSunDir.value.copy(sunDir);
    u.uHeal.value = healProgress;
    return u;
  }, [cloudsMap, sunDir]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (matRef.current) {
      matRef.current.uniforms.uHeal.value = healProgress;
      matRef.current.uniforms.uSunDir.value.copy(sunDir);
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
        <sphereGeometry args={[1.0, 96, 96]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={CloudShader.vertexShader}
          fragmentShader={CloudShader.fragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
