import * as THREE from 'three';

/**
 * Atmosphere Rim Glow Shader
 *
 * Scale: 1.035 x Earth radius.
 * - side: THREE.BackSide
 * - transparent: true
 * - depthWrite: false
 * - blending: THREE.AdditiveBlending
 *
 * Physics & Geometry for BackSide:
 * - At the outer geometry boundary (costheta = 0.0), alpha is strictly 0 (no hard edge!).
 * - Peaks softly as it approaches the Earth limb (costheta ≈ 0.20-0.25).
 * - Sunlit crescent is brighter via dot(sunDir, -wn).
 * - Isolated test mode (?mode=atmosphere): displays bright magenta for exact radius measurement.
 */
export const AtmosphereShaderMaterial = {
  uniforms: {
    uHeal:           { value: 0.0 },
    uSunDir:         { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos:      { value: new THREE.Vector3(0, 0, 2.85) },
    uBrightness:     { value: 1.0 },
    uModeAtmosphere: { value: 0.0 }, // 1.0 when ?mode=atmosphere
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
    uniform vec3  uSunDir;
    uniform vec3  uCameraPos;
    uniform float uBrightness;
    uniform float uModeAtmosphere;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // On BackSide sphere: facing is 1.0 at center, 0.0 at outer limb
      float facing = dot(wn, -viewDir);
      float costheta = clamp(facing, 0.0, 1.0);

      // The outer edge of the geometry is at costheta = 0.0
      // Alpha MUST be 0 at costheta = 0 so there is NO hard outer cutoff line!
      float edgeFade = smoothstep(0.0, 0.20, costheta);
      float innerGlow = pow(1.0 - costheta, 2.2);
      float alpha = edgeFade * innerGlow;

      // Sunlit crescent contribution
      float sunFacing = smoothstep(-0.25, 0.75, dot(normalize(uSunDir), -wn));

      // Test Isolation Mode: ?mode=atmosphere displays bright magenta
      if (uModeAtmosphere > 0.5) {
        gl_FragColor = vec4(1.0, 0.0, 1.0, alpha * (sunFacing * 0.5 + 0.5));
        return;
      }

      // Atmospheric colors: dim gray-red smog -> bright cyan-green ozone
      vec3 pollutedColor = vec3(0.42, 0.20, 0.12);
      vec3 healedColor   = vec3(0.08, 0.82, 0.62);
      vec3 atmoColor = mix(pollutedColor, healedColor, smoothstep(0.1, 0.9, uHeal));

      float intensity = mix(0.55, 1.25, uHeal);
      float finalAlpha = alpha * intensity * (sunFacing * 0.65 + 0.35) * uBrightness;

      gl_FragColor = vec4(atmoColor, clamp(finalAlpha, 0.0, 1.0));
    }
  `
};
