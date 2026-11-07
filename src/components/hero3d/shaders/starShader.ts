/**
 * ═══════════════════════════════════════════════════════════════
 * CELESTIAL SHADERS: STARS, DOMAIN-WARPED NEBULA & SHOOTING STAR
 * ═══════════════════════════════════════════════════════════════
 */

// ── 1. DELICATE CIRCULAR STARS WITH TWINKLE & DIFFRACTION SPIKES ──
export const StarShaderMaterial = {
  uniforms: {
    uTime: { value: 0.0 },
    uDpr:  { value: 1.5 },
  },

  vertexShader: `
    attribute float aSize;
    attribute vec3  aColor;
    attribute float aTwinkleSpeed;
    attribute float aTwinkleAmp;
    attribute float aTwinklePhase;
    attribute float aIsBeacon;

    uniform float uTime;
    uniform float uDpr;

    varying vec3  vColor;
    varying float vTwinkle;
    varying float vIsBeacon;

    void main() {
      vColor = aColor;
      vIsBeacon = aIsBeacon;

      // Unique multi-speed twinkle per star
      float twk = sin(uTime * aTwinkleSpeed + aTwinklePhase);
      vTwinkle = clamp(1.0 + twk * aTwinkleAmp, 0.45, 1.35);

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      // Scale with devicePixelRatio so high-DPI screens look razor sharp & consistent
      float baseSize = aSize * uDpr * (65.0 / -mvPosition.z);
      gl_PointSize = clamp(baseSize * vTwinkle, 1.0, 5.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    varying vec3  vColor;
    varying float vTwinkle;
    varying float vIsBeacon;

    void main() {
      vec2 coord = (gl_PointCoord - vec2(0.5)) * 2.0;
      float dist = length(coord);
      if (dist > 1.0) discard;

      // Soft Gaussian circle falloff
      float alpha = exp(-dist * dist * 3.8);
      // Bright pinpoint core
      float core = exp(-dist * dist * 18.0) * 0.75;

      // Tiny diffraction cross spikes for rare beacon stars
      if (vIsBeacon > 0.5) {
        float spikeX = exp(-abs(coord.x) * 45.0) * exp(-abs(coord.y) * 4.0);
        float spikeY = exp(-abs(coord.y) * 45.0) * exp(-abs(coord.x) * 4.0);
        core += (spikeX + spikeY) * 0.85;
      }

      gl_FragColor = vec4(vColor + vec3(core), clamp((alpha + core) * vTwinkle, 0.0, 1.0));
    }
  `
};

// ── 2. PROCEDURAL DOMAIN-WARPED CELESTIAL NEBULA ──
// 3 deep cosmic dust layers in indigo, violet & teal with anti-banding dither
export const NebulaShaderMaterial = {
  uniforms: {
    uTime:     { value: 0.0 },
    uOpacity:  { value: 0.38 },
    uQuality:  { value: 2.0 }, // 1.0 (Low), 2.0 (Med), 3.0 (High)
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
    uniform float uOpacity;
    uniform float uQuality;
    varying vec2  vUv;

    // Fast pseudo-noise & FBM
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      int octaves = (uQuality > 2.5) ? 4 : (uQuality > 1.5) ? 3 : 2;
      for (int i = 0; i < 4; i++) {
        if (i >= octaves) break;
        v += a * noise(p);
        p = rot * p * 2.08;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Coordinate mapped to plane, centered on the right cosmic region
      vec2 p = (vUv - vec2(0.5)) * 3.4;

      // Soft elliptical boundary mask so nebula fades to true black void at margins
      float boundary = clamp(1.0 - length(p * vec2(0.85, 1.15)), 0.0, 1.0);
      boundary = pow(boundary, 2.2);
      if (boundary < 0.005) discard;

      // Domain warping: creates organic wispy dust tendrils
      float t = uTime * 0.015;
      vec2 q = vec2(fbm(p + vec2(t * 0.4, -t * 0.3)), fbm(p + vec2(2.4, 5.1)));
      vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) - t * 0.2), fbm(p + 3.2 * q + vec2(8.3, 2.8)));
      float f = fbm(p + 3.6 * r);

      // Deep color palette: Indigo backdrop, Violet core, and Teal highlight dust
      vec3 colIndigo = vec3(0.05, 0.04, 0.16); // Deep space purple-indigo
      vec3 colViolet = vec3(0.24, 0.08, 0.38); // Glowing violet filaments
      vec3 colTeal   = vec3(0.03, 0.18, 0.26); // Cool sapphire/cyan dust shelf
      vec3 colStarlight = vec3(0.85, 0.92, 1.0); // Micro starlight density

      vec3 col = mix(colIndigo, colViolet, smoothstep(0.15, 0.75, f));
      col = mix(col, colTeal, smoothstep(0.40, 0.85, q.x));
      col += colStarlight * pow(max(f - 0.55, 0.0), 3.0) * 0.85;

      // Triangular anti-banding dither to prevent color stepping on 8-bit displays
      float dither = (hash(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0);
      col += dither;

      float alpha = f * boundary * uOpacity;
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `
};

// ── 3. RARE TASTEFUL SHOOTING STAR ──
export const ShootingStarMaterial = {
  uniforms: {
    uProgress: { value: 0.0 }, // 0.0 to 1.0 along its flight path
    uAlpha:    { value: 0.0 }, // Fade in / fade out
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uProgress;
    uniform float uAlpha;
    varying vec2  vUv;

    void main() {
      // Long sharp streak along X with tapered head and fading tail
      float head = smoothstep(0.0, 0.08, vUv.x);
      float tail = pow(1.0 - vUv.x, 1.8);
      float beam = pow(max(1.0 - abs(vUv.y - 0.5) * 2.0, 0.0), 4.0);

      float alpha = head * tail * beam * uAlpha;
      if (alpha < 0.005) discard;

      vec3 colHead = vec3(1.0, 1.0, 1.0);
      vec3 colTail = vec3(0.4, 0.75, 1.0);
      vec3 col = mix(colTail, colHead, vUv.x);

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `
};
