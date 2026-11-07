import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * ATMOSPHERE FRESNEL SHADER (Hero 3D Cinematic Scene)
 * ═══════════════════════════════════════════════════════════════
 * Correctly illuminates the sunlit upper-left limb of Earth:
 * - SphereGeometry normal 'wn' points outward
 * - Sun is at upper-left: sunDot = dot(sunDir, wn) > 0 for sunlit limb
 * - Pure electric cyan crescent strictly on sunlit limb
 * - 100% zero glow on dark night side
 */

export const AtmosphereShaderMaterial = {
  uniforms: {
    uSunDir:     { value: new THREE.Vector3(-2.05, 1.15, 0.55).normalize() },
    uCameraPos:  { value: new THREE.Vector3(0, 0, 3.2) },
    uGlowColor:  { value: new THREE.Color('#00b4ff') },    // Brilliant electric cyan
    uSunGlowCol: { value: new THREE.Color('#fffbf0') },    // Blazing sunlight crest
    uIntensity:  { value: 2.8 },
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
    uniform vec3  uGlowColor;
    uniform vec3  uSunGlowCol;
    uniform float uIntensity;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      // Outward surface normal in world space
      vec3 wn = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Limb fresnel: at the silhouette edge, dot(wn, viewDir) is 0.0
      float costheta = clamp(abs(dot(wn, viewDir)), 0.0, 1.0);
      float rim = pow(1.0 - costheta, 3.6);
      float outerFade = smoothstep(0.0, 0.16, costheta);
      float limbAlpha = rim * outerFade;

      // Directional gating: wn points toward upper-left sun on sunlit limb
      float sunDot = dot(normalize(uSunDir), wn);
      // Strictly gated to the sunlit upper-left crescent!
      float sunMask = smoothstep(0.10, 0.75, sunDot);

      if (sunMask < 0.005) discard;

      // Blend from atmospheric cyan-blue to warm sunlit crest
      vec3 color = mix(uGlowColor, uSunGlowCol, smoothstep(0.35, 0.90, sunDot) * 0.70);

      float finalAlpha = limbAlpha * sunMask * uIntensity;
      gl_FragColor = vec4(color, clamp(finalAlpha, 0.0, 1.0));
    }
  `
};
