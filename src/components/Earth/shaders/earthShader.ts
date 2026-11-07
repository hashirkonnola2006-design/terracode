import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════
 *  EARTH SHADER — "Green Tomorrow" (TerraCode Competition)
 * ═══════════════════════════════════════════════════════════
 *
 * Clean, robust procedural + texture-based planetary shader:
 * - Samples 2K cloudless Blue Marble day map (uDayMap).
 * - Samples 2K ocean specular mask (uSpecularMap).
 * - Samples 2K normal/bump map (uNormalMap) with gentle perturbation.
 * - Directional sun from upper-left with soft terminator line.
 * - Polluted state: desaturated gray-brown continents with cracked soil,
 *   dark oily oceans with subtle rainbow sheen.
 * - Healed state: vibrant emerald vegetation, sparkling blue-to-cyan oceans.
 * - Scroll-driven uHeal (0 to 1) spreads an organic FBM noise wave across
 *   the entire sphere, bounded by a thin glowing emerald green edge (#4ADE80).
 */
export const EarthShaderMaterial = {
  uniforms: {
    uHeal:        { value: 0.0 },
    uTime:        { value: 0.0 },
    uDayMap:      { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uNormalMap:   { value: null as THREE.Texture | null },
    uSunDir:      { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 3.0) },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv          = uv;
      vNormal      = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float     uHeal;
    uniform float     uTime;
    uniform sampler2D uDayMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uNormalMap;
    uniform vec3      uSunDir;
    uniform vec3      uCameraPos;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    // Fast 3D Simplex noise for organic wave propagation
    vec4 _p(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = _p(_p(_p(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * vec3(0.0, 2.0, 1.0) - vec3(1.0, 0.0, 2.0) * n_;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 xs = x_ * ns.x + ns.yyyy;
      vec4 ys = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(xs) - abs(ys);
      vec4 b0 = vec4(xs.xy, ys.xy);
      vec4 b1 = vec4(xs.zw, ys.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 nrm = 1.79284291 - 0.85373472 * vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
      p0 *= nrm.x; p1 *= nrm.y; p2 *= nrm.z; p3 *= nrm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p){
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * snoise(p);
        p *= 2.04;
        a *= 0.5;
      }
      return v;
    }

    // Cellular noise for cracked parched ground on polluted continents
    float cracks(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float d = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 n = vec2(float(x), float(y));
          vec2 pt = vec2(
            fract(sin(dot(i + n, vec2(127.1, 311.7))) * 43758.5453),
            fract(sin(dot(i + n, vec2(269.5, 183.3))) * 43758.5453)
          );
          d = min(d, length(n + pt - f));
        }
      }
      return d;
    }

    void main() {
      vec3 wn = normalize(vWorldNormal);

      // Sample normal map with subtle gentle bump strength
      vec3 normalSample = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      vec3 perturbedNormal = normalize(wn + vec3(normalSample.xy * 0.06, 0.0));

      // Directional Sun lighting with smooth terminator
      vec3 sunDir = normalize(uSunDir);
      float NdotL = dot(perturbedNormal, sunDir);
      float diffuse = smoothstep(-0.15, 0.55, NdotL);

      // Texture samples: cloudless day map and ocean specular mask
      vec3 dayCol = texture2D(uDayMap, vUv).rgb;
      float isOcean = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land
      float isLand = 1.0 - isOcean;

      // ── 1. HEALED EARTH (Lush emerald land & deep sparkling blue oceans) ──
      vec3 landHealed = dayCol;
      // Gently boost healthy vegetation green on fertile areas
      landHealed.g = max(landHealed.g, landHealed.b * 1.15);
      landHealed = mix(landHealed, vec3(0.14, 0.52, 0.22), clamp(dayCol.g - dayCol.r, 0.0, 1.0) * 0.35);

      vec3 deepOceanHealed = vec3(0.015, 0.07, 0.22);
      vec3 shallowOceanHealed = vec3(0.04, 0.38, 0.50);
      vec3 oceanHealed = mix(deepOceanHealed, shallowOceanHealed, clamp(dayCol.b * 1.3 - dayCol.r * 0.5, 0.0, 1.0) * 0.6);
      vec3 colHealed = mix(landHealed, oceanHealed, isOcean);

      // ── 2. POLLUTED EARTH (Same continents, desaturated gray-brown, oily oceans) ──
      // Luminance-only desaturation preserves crisp continental coastlines
      float luma = dot(dayCol, vec3(0.299, 0.587, 0.114));
      vec3 parchedLand = vec3(luma * 0.62 + 0.10, luma * 0.54 + 0.08, luma * 0.40 + 0.05);

      // Fissured cracked ground on land
      float crk = cracks(vUv * 64.0);
      float crackLines = smoothstep(0.04, 0.16, crk);
      parchedLand *= (crackLines * 0.45 + 0.55);

      // Toxic stagnant oil-slick ocean
      vec3 oilOcean = vec3(0.06, 0.065, 0.05);
      float oilSheen = sin(snoise(wn * 8.0 + vec3(uTime * 0.015, 0.0, 0.0)) * 6.28) * 0.5 + 0.5;
      oilOcean += vec3(0.025, 0.02, 0.01) * oilSheen;

      vec3 colPolluted = mix(parchedLand, oilOcean, isOcean);

      // ── 3. ORGANIC NOISE HEALING WAVE ──
      // FBM wave front progresses across the entire sphere with uHeal (0 to 1)
      float waveNoise = fbm(wn * 2.8 + vec3(1.4, 2.7, 3.8)) * 0.28;
      float healFront = (uHeal * 1.56) - (waveNoise + (1.0 - wn.y) * 0.16);
      float healFactor = smoothstep(0.0, 0.26, healFront);

      // Thin bio-luminescent emerald green laser edge right at the wavefront (#4ADE80)
      float edgeMask = smoothstep(-0.02, 0.09, healFront) * (1.0 - smoothstep(0.09, 0.24, healFront));
      vec3 edgeGlow = vec3(0.29, 0.98, 0.55) * edgeMask * 2.5;

      vec3 surfaceCol = mix(colPolluted, colHealed, healFactor);
      if (uHeal > 0.005 && uHeal < 0.995) {
        surfaceCol += edgeGlow;
      }

      // ── 4. LIGHTING & SPECULAR SHADING ──
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(perturbedNormal, halfH), 0.0);

      // Specular shine strictly on oceans (cleaner when healed, dull oily when polluted)
      float specPower = mix(14.0, 64.0, healFactor);
      float spec = pow(NdotH, specPower) * isOcean * max(NdotL, 0.0);
      vec3 specCol = mix(vec3(0.18, 0.15, 0.10), vec3(0.9, 0.95, 1.0), healFactor) * spec * 1.2;

      // Soft ambient space illumination
      vec3 ambient = mix(vec3(0.03, 0.03, 0.04), vec3(0.04, 0.06, 0.09), healFactor);

      vec3 finalColor = surfaceCol * (diffuse * 1.15 + ambient) + specCol;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
