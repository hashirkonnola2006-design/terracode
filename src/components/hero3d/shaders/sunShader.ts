import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * CINEMATIC SUN SHADERS: RADIAL GLOW, SOFT RAYS, ANAMORPHIC STREAK & GHOSTS
 * ═══════════════════════════════════════════════════════════════
 */

export const SunCoronaMaterial = {
  uniforms: {
    uTime:       { value: 0.0 },
    uColorCore:  { value: new THREE.Color('#fffdf5') },
    uColorGlow:  { value: new THREE.Color('#ffaa2b') },
    uColorOuter: { value: new THREE.Color('#ff5500') },
    uIntensity:  { value: 1.8 },
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

      // Soft natural exponential glow falloff
      float falloff = pow(max(1.0 - dist, 0.0), 2.2) * exp(-dist * 1.4);
      float alpha = clamp(falloff * uIntensity, 0.0, 1.0);
      if (alpha < 0.002) discard;

      // Color gradient: warm-white core -> golden amber -> soft warm orange
      vec3 col = mix(uColorGlow, uColorCore, pow(max(1.0 - dist, 0.0), 2.8));
      col = mix(uColorOuter, col, smoothstep(0.70, 0.15, dist));

      gl_FragColor = vec4(col, alpha);
    }
  `
};

export const AnamorphicStreakMaterial = {
  uniforms: {
    uColorBeam: { value: new THREE.Color('#fff9eb') },
    uColorHalo: { value: new THREE.Color('#ff9828') },
    uIntensity: { value: 0.75 },
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
      vec2 p = vUv - vec2(0.5);
      float dx = abs(p.x) * 2.0;
      float dy = abs(p.y) * 2.0;

      if (dx > 1.0 || dy > 1.0) discard;

      float core = pow(max(1.0 - dy, 0.0), 10.0);
      float halo = pow(max(1.0 - dy, 0.0), 2.2) * 0.45;
      float taper = pow(max(1.0 - dx, 0.0), 1.8);

      float alpha = (core + halo) * taper * uIntensity;
      if (alpha < 0.002) discard;

      vec3 col = mix(uColorHalo, uColorBeam, core);
      gl_FragColor = vec4(col, alpha);
    }
  `
};

export const SunRayStreakMaterial = {
  uniforms: {
    uColorRay:  { value: new THREE.Color('#ffdfa0') },
    uIntensity: { value: 0.70 },
    uTime:      { value: 0.0 },
    uPhase:     { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform vec3  uColorRay;
    uniform float uIntensity;
    uniform float uTime;
    uniform float uPhase;

    varying vec2 vUv;

    void main() {
      float x = vUv.x;
      float dy = abs(vUv.y - 0.5) * 2.0;

      if (dy > 1.0) discard;

      // Soft taper along length and width
      float lengthFade = pow(max(1.0 - x, 0.0), 1.2);
      float widthFade  = pow(max(1.0 - dy, 0.0), 2.5);
      float pulse = 0.85 + 0.15 * sin(uTime * 1.4 + uPhase);

      float alpha = lengthFade * widthFade * uIntensity * pulse;
      if (alpha < 0.002) discard;

      gl_FragColor = vec4(uColorRay, alpha);
    }
  `
};

export const LensGhostMaterial = {
  uniforms: {
    uColor:    { value: new THREE.Color('#ffb040') },
    uAlpha:    { value: 0.25 },
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

    varying vec2 vUv;

    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float dist = length(p);
      if (dist > 1.0) discard;

      float ring = smoothstep(0.35, 0.80, dist) * smoothstep(1.0, 0.75, dist);
      float disc = pow(max(1.0 - dist, 0.0), 2.0) * 0.45;
      float a = (ring + disc) * uAlpha;
      if (a < 0.002) discard;

      gl_FragColor = vec4(uColor, a);
    }
  `
};
