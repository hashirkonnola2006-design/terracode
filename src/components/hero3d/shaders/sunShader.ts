import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * SUN SHADERS: CORONA, ANAMORPHIC STREAK & LENS FLARE
 * ═══════════════════════════════════════════════════════════════
 * Perfectly matches Image 1:
 * - Blinding white-hot core
 * - Vast, warm golden-orange radial corona glow
 * - Razor-thin horizontal anamorphic flare beam passing through the sun
 * - Soft warm lens flare ghosts along the optical axis
 */

export const SunCoronaMaterial = {
  uniforms: {
    uColorCore:  { value: new THREE.Color('#fffdf5') },
    uColorGlow:  { value: new THREE.Color('#ff7800') },
    uColorOuter: { value: new THREE.Color('#ff2b00') },
    uIntensity:  { value: 3.5 },
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
    varying vec2  vUv;

    void main() {
      vec2 center = vUv - vec2(0.5);
      float dist = length(center) * 2.0;
      if (dist > 1.0) discard;

      // Soft non-linear radial exponential falloff
      float inner = pow(max(1.0 - dist * 3.2, 0.0), 3.0);
      float mid   = pow(max(1.0 - dist * 1.6, 0.0), 2.2);
      float outer = pow(1.0 - dist, 2.4);

      vec3 col = mix(uColorOuter, uColorGlow, mid);
      col = mix(col, uColorCore, inner);

      float alpha = (outer * 0.42 + mid * 0.58 + inner * 1.8) * uIntensity;
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const AnamorphicStreakMaterial = {
  uniforms: {
    uIntensity: { value: 3.8 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uIntensity;
    varying vec2  vUv;

    void main() {
      float dy = abs(vUv.y - 0.5) * 2.0;
      float dx = abs(vUv.x - 0.5) * 2.0;

      // Core sharp laser beam
      float vertCore = pow(max(1.0 - dy, 0.0), 16.0);
      // Soft warm amber flare halo around beam
      float vertHalo = pow(max(1.0 - dy, 0.0), 3.5) * 0.35;

      // Long horizontal reach across the sky
      float horiz = pow(max(1.0 - dx, 0.0), 0.85);

      float beam = (vertCore + vertHalo) * horiz * uIntensity;
      if (beam < 0.005) discard;

      vec3 amberEdge = vec3(1.0, 0.45, 0.08);
      vec3 goldBeam  = vec3(1.0, 0.78, 0.25);
      vec3 whiteCore = vec3(1.0, 0.98, 0.92);

      vec3 col = mix(amberEdge, goldBeam, vertHalo * 2.0);
      col = mix(col, whiteCore, vertCore);

      gl_FragColor = vec4(col, clamp(beam, 0.0, 1.0));
    }
  `
};

export const LensGhostMaterial = {
  uniforms: {
    uColor: { value: new THREE.Color(1.0, 0.65, 0.25) },
    uAlpha: { value: 0.22 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3  uColor;
    uniform float uAlpha;
    varying vec2  vUv;

    void main() {
      vec2 p = vUv - vec2(0.5);
      float d = length(p) * 2.0;
      if (d > 1.0) discard;

      float ring = smoothstep(0.75, 0.95, d) * smoothstep(1.0, 0.95, d);
      float fill = pow(1.0 - d, 2.0) * 0.4;
      float a = (ring * 0.6 + fill) * uAlpha;

      gl_FragColor = vec4(uColor, a);
    }
  `
};
