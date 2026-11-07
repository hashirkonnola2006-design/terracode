import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * MINIMAL SUN SHADERS: SOFT RADIAL GLOW & FAINT DIRECTIONAL RAY
 * ═══════════════════════════════════════════════════════════════
 * Provides:
 * 1. SunCoronaMaterial: Soft, small additive radial glow sprite
 *    (warm white core -> warm orange mid -> transparent amber rim).
 * 2. AnamorphicStreakMaterial: Optional faint, short directional ray
 *    pointing toward the Earth (< 2 units length).
 * 3. LensGhostMaterial: Preserved export for backwards compatibility.
 */

export const SunCoronaMaterial = {
  uniforms: {
    uTime:       { value: 0.0 },
    uColorCore:  { value: new THREE.Color('#fff8eb') },
    uColorGlow:  { value: new THREE.Color('#ff9922') },
    uColorOuter: { value: new THREE.Color('#ff5500') },
    uIntensity:  { value: 1.2 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3  uColorCore;
    uniform vec3  uColorGlow;
    uniform vec3  uColorOuter;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float dist = length(p);
      if (dist > 1.0) discard;

      // Soft natural exponential glow falloff (no hard edges, no disk blowouts)
      float falloff = pow(max(1.0 - dist, 0.0), 2.8) * exp(-dist * 1.8);
      float alpha = clamp(falloff * uIntensity, 0.0, 1.0);
      if (alpha < 0.003) discard;

      // Color gradient: warm-white core -> golden amber -> soft warm orange
      vec3 col = mix(uColorGlow, uColorCore, pow(max(1.0 - dist, 0.0), 3.5));
      col = mix(uColorOuter, col, smoothstep(0.7, 0.15, dist));

      gl_FragColor = vec4(col * alpha, alpha);
    }
  `
};

export const AnamorphicStreakMaterial = {
  uniforms: {
    uColorBeam: { value: new THREE.Color('#fff5e0') },
    uColorHalo: { value: new THREE.Color('#ff9020') },
    uIntensity: { value: 0.28 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3  uColorBeam;
    uniform vec3  uColorHalo;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {
      // Centered coordinate
      vec2 p = vUv - vec2(0.5);
      float dx = abs(p.x) * 2.0; // Along length (0 to 1)
      float dy = abs(p.y) * 2.0; // Across width (0 to 1)

      if (dx > 1.0 || dy > 1.0) discard;

      // Faint, thin ray that tapers softly toward both ends
      float core = pow(max(1.0 - dy, 0.0), 8.0);
      float halo = pow(max(1.0 - dy, 0.0), 2.2) * 0.35;
      float taper = pow(max(1.0 - dx, 0.0), 1.8);

      float alpha = (core + halo) * taper * uIntensity;
      if (alpha < 0.002) discard;

      vec3 col = mix(uColorHalo, uColorBeam, core);
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `
};

// Legacy stub preserved for interface compatibility
export const LensGhostMaterial = {
  uniforms: {
    uColor:    { value: new THREE.Color('#ff9944') },
    uAlpha:    { value: 0.0 },
    uShape:    { value: 0.0 },
    uEdgeFade: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() { discard; }
  `
};
