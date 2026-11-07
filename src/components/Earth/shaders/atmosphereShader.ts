import * as THREE from 'three';

/**
 * Atmosphere Rim Glow Shader
 *
 * Rendered on a slightly larger sphere (scale ~1.12) with:
 * - side: THREE.BackSide
 * - transparent: true
 * - depthWrite: false
 * - blending: THREE.AdditiveBlending
 *
 * Fresnel logic for BackSide:
 * - Center of the sphere is 100% transparent (alpha = 0).
 * - Outer rim/limb glows brightly, brighter on the sunlit crescent.
 * - Transitions from dim gray-red smog when polluted to bright cyan-green ozone when healed.
 */
export const AtmosphereShaderMaterial = {
  uniforms: {
    uHeal:      { value: 0.0 },
    uSunDir:    { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos: { value: new THREE.Vector3(0, 0, 3.0) },
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

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // On BackSide sphere: facing is 1.0 at center, 0.0 at outer limb
      float facing = dot(wn, -viewDir);
      float limb = 1.0 - clamp(facing, 0.0, 1.0);
      float rim = pow(limb, 3.8);

      // Brighter on the sunlit crescent
      float sunFacing = smoothstep(-0.25, 0.75, dot(normalize(uSunDir), -wn));

      // Colors: dim reddish-gray smog -> brilliant cyan-green ozone
      vec3 pollutedColor = vec3(0.42, 0.20, 0.12);
      vec3 healedColor   = vec3(0.08, 0.82, 0.62);
      vec3 atmoColor = mix(pollutedColor, healedColor, smoothstep(0.1, 0.9, uHeal));

      float intensity = mix(0.55, 1.15, uHeal);
      float alpha = rim * intensity * (sunFacing * 0.65 + 0.35);

      gl_FragColor = vec4(atmoColor, clamp(alpha, 0.0, 1.0));
    }
  `
};
