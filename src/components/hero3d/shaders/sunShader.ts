import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * SUN SHADERS: CORONA, ANAMORPHIC STREAK & LENS GHOSTS
 * ═══════════════════════════════════════════════════════════════
 * Features:
 * - Animated plasma corona with domain-warped FBM noise & subtle god-rays
 * - Chromatic radial fringe (white core -> golden yellow -> warm solar amber)
 * - Razor-thin anamorphic streak with soft halo
 * - Screen-space lens flare ghosts (hexagonal aperture, soft chromatic discs, thin halo ring)
 * - Edge fade when sun nears the screen boundaries
 */

export const SunCoronaMaterial = {
  uniforms: {
    uTime:       { value: 0.0 },
    uColorCore:  { value: new THREE.Color('#fffdf8') },
    uColorGlow:  { value: new THREE.Color('#ff8c00') },
    uColorOuter: { value: new THREE.Color('#ff3000') },
    uIntensity:  { value: 3.6 },
    uNoiseScale: { value: 3.2 },
    uRayCount:   { value: 10.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uTime;
    uniform vec3  uColorCore;
    uniform vec3  uColorGlow;
    uniform vec3  uColorOuter;
    uniform float uIntensity;
    uniform float uNoiseScale;
    uniform float uRayCount;

    varying vec2 vUv;

    // Fast 2D Simplex noise for organic plasma swirling
    vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                              dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * snoise(p);
        p *= 2.15;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = vUv - vec2(0.5);
      float dist = length(p) * 2.0;
      if (dist > 1.0) discard;

      float angle = atan(p.y, p.x);

      // 1. Swirling plasma noise at edges
      vec2 noiseCoord = vec2(cos(angle), sin(angle)) * dist * uNoiseScale;
      float plasma = fbm(noiseCoord + vec2(uTime * 0.12, -uTime * 0.09)) * 0.18;
      float warpedDist = clamp(dist + plasma * (dist * 0.85), 0.0, 1.0);

      // 2. Subtle rotating god-ray filaments
      float rays = pow(max(sin(angle * uRayCount + uTime * 0.18) * 0.5 + 0.5, 0.0), 3.2);
      float rays2 = pow(max(sin(angle * (uRayCount * 0.6) - uTime * 0.25) * 0.5 + 0.5, 0.0), 2.5);
      float rayGlow = (rays * 0.65 + rays2 * 0.35) * pow(max(1.0 - dist, 0.0), 1.8) * 0.35;

      // 3. Multi-tier radial exponential falloffs
      float inner = pow(max(1.0 - warpedDist * 3.4, 0.0), 2.8);
      float mid   = pow(max(1.0 - warpedDist * 1.5, 0.0), 2.2);
      float outer = pow(max(1.0 - warpedDist, 0.0), 2.6);

      // 4. Chromatic fringe: outer crimson -> solar gold -> pure blinding white core
      vec3 col = mix(uColorOuter, uColorGlow, mid);
      col = mix(col, uColorCore, inner);

      // Add god-ray luminance
      col += uColorGlow * rayGlow * 1.5;

      float alpha = (outer * 0.38 + mid * 0.62 + inner * 2.2 + rayGlow) * uIntensity;
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const AnamorphicStreakMaterial = {
  uniforms: {
    uIntensity: { value: 3.8 },
    uColorBeam: { value: new THREE.Color('#fffaf0') },
    uColorHalo: { value: new THREE.Color('#ff8811') },
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
    uniform vec3  uColorBeam;
    uniform vec3  uColorHalo;
    varying vec2  vUv;

    void main() {
      float dy = abs(vUv.y - 0.5) * 2.0;
      float dx = abs(vUv.x - 0.5) * 2.0;

      // Razor-thin core laser beam
      float vertCore = pow(max(1.0 - dy, 0.0), 18.0);
      // Soft amber halo enveloping beam
      float vertHalo = pow(max(1.0 - dy, 0.0), 3.2) * 0.36;

      // Long horizontal reach with soft tip falloff
      float horiz = pow(max(1.0 - dx, 0.0), 0.88);

      float beam = (vertCore + vertHalo) * horiz * uIntensity;
      if (beam < 0.003) discard;

      vec3 col = mix(uColorHalo, uColorBeam, vertCore);
      gl_FragColor = vec4(col, clamp(beam, 0.0, 1.0));
    }
  `
};

export const LensGhostMaterial = {
  uniforms: {
    uColor:    { value: new THREE.Color('#ff9944') },
    uAlpha:    { value: 0.22 },
    uShape:    { value: 0.0 }, // 0: circle, 1: hexagon, 2: halo ring
    uEdgeFade: { value: 1.0 }, // Fades out near screen boundary
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
    uniform float uShape;
    uniform float uEdgeFade;
    varying vec2  vUv;

    // Soft hexagon signed distance
    float hexSdf(vec2 p) {
      p = abs(p);
      return max(p.x * 0.866025 + p.y * 0.5, p.y);
    }

    void main() {
      vec2 p = (vUv - vec2(0.5)) * 2.0;
      float a = 0.0;

      // Shape 0: Soft circular disc
      if (uShape < 0.5) {
        float d = length(p);
        if (d > 1.0) discard;
        float fill = pow(1.0 - d, 2.4) * 0.35;
        float rim  = smoothstep(0.78, 0.97, d) * smoothstep(1.0, 0.95, d);
        a = (fill + rim * 0.45) * uAlpha;
      }
      // Shape 1: Hexagonal camera aperture ghost
      else if (uShape < 1.5) {
        float d = hexSdf(p);
        if (d > 1.0) discard;
        float fill = pow(1.0 - d, 2.0) * 0.30;
        float rim  = smoothstep(0.82, 0.97, d) * smoothstep(1.0, 0.95, d);
        a = (fill + rim * 0.50) * uAlpha;
      }
      // Shape 2: Faint delicate halo ring
      else {
        float d = length(p);
        if (d > 1.0) discard;
        float ring = smoothstep(0.88, 0.96, d) * smoothstep(1.0, 0.94, d);
        a = ring * uAlpha * 0.90;
      }

      a *= uEdgeFade;
      if (a < 0.002) discard;

      gl_FragColor = vec4(uColor, a);
    }
  `
};
