import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Earth PBR Shader)
// ═══════════════════════════════════════════════════════════════
export const HEAL_FRONT_WIDTH = 0.08;         // Thickness of the glowing healing wave front
export const HEAL_FRONT_COLOR = '#44ffaa';    // Glowing emerald green edge at the healing front
export const NORMAL_INTENSITY = 0.55;         // Terrain relief bump depth
export const SUN_LIGHT_BOOST = 1.75;          // Sunlight radiance

export const EarthShader = {
  uniforms: {
    uDayMap:      { value: null },
    uAtmosMap:    { value: null },
    uNormalMap:   { value: null },
    uSpecularMap: { value: null },
    uLightsMap:   { value: null },
    uTime:        { value: 0.0 },
    uHeal:        { value: 0.0 },
    uSunDir:      { value: new THREE.Vector3(-1.95, 1.10, 0.55).normalize() },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 3.2) },
    uSunColor:    { value: new THREE.Color('#fffbf0') },
    uAmbientColor:{ value: new THREE.Color('#020612') },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D uDayMap;
    uniform sampler2D uAtmosMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uLightsMap;
    uniform float     uTime;
    uniform float     uHeal;
    uniform vec3      uSunDir;
    uniform vec3      uCameraPos;
    uniform vec3      uSunColor;
    uniform vec3      uAmbientColor;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    // Fast 3D Simplex noise & FBM for organic wave propagation
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

    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * snoise(p);
        p *= 2.15;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 wn = normalize(vWorldNormal);
      vec3 sunDir = normalize(uSunDir);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Base NASA 2K maps
      vec3 atmosTex = texture2D(uAtmosMap, vUv).rgb; // Dark navy oceans + rich tan/ochre deserts
      vec3 dayTex   = texture2D(uDayMap, vUv).rgb;   // Pristine standard Blue Marble
      vec3 normalMap = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
      float specular = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land
      float oceanMask = specular;

      // Realistic terrain normal perturbation (subtle relief without skewing world orientation)
      vec3 normal = wn;

      // ── 1. POLLUTED STATE (Realistic NASA Earth with subtle smog haze and murky navy oceans) ──
      float landLuma = dot(atmosTex, vec3(0.299, 0.587, 0.114));
      vec3 desatLand = mix(atmosTex, vec3(landLuma), 0.20);
      vec3 smogColor = vec3(0.52, 0.45, 0.36);
      vec3 pollutedLand = mix(desatLand, smogColor, 0.15);

      // Deep murky navy ocean
      vec3 pollutedOcean = mix(
        atmosTex * vec3(0.70, 0.82, 1.15),
        vec3(0.012, 0.038, 0.11),
        0.50
      );
      vec3 pollutedColor = mix(pollutedLand, pollutedOcean, oceanMask);

      // ── 2. HEALTHY RESTORED STATE ──
      vec3 healthyLand = atmosTex;
      float vegMask = smoothstep(0.08, 0.35, atmosTex.g - atmosTex.r * 0.80);
      vec3 lushGreen = vec3(0.06, 0.74, 0.22);
      healthyLand = mix(healthyLand, lushGreen, vegMask * 0.65);
      float luma = dot(healthyLand, vec3(0.299, 0.587, 0.114));
      healthyLand = mix(vec3(luma), healthyLand, 1.30);

      vec3 healthyOcean = mix(
        vec3(0.015, 0.16, 0.58),
        vec3(0.030, 0.45, 0.72),
        smoothstep(0.15, 0.65, atmosTex.b - atmosTex.r)
      );
      vec3 healthyColor = mix(healthyLand, healthyOcean, oceanMask);

      // ── 3. NOISE-DRIVEN HEALING WAVE CROSSFADE ──
      float waveNoise = fbm(wn * 3.4 + vec3(1.2, 2.8, 4.4)) * 0.40;
      float healThreshold = waveNoise + 0.5;
      float healFactor = clamp(smoothstep(healThreshold - 0.22, healThreshold + 0.22, uHeal * 1.44 - 0.22), 0.0, 1.0);
      if (uHeal <= 0.001) healFactor = 0.0;
      if (uHeal >= 0.999) healFactor = 1.0;

      float frontDist = abs(healFactor - 0.5) * 2.0;
      float frontGlow = pow(max(1.0 - frontDist, 0.0), 3.2) * smoothstep(0.02, 0.98, uHeal);
      vec3 frontColor = vec3(0.26, 1.0, 0.60);

      vec3 surfaceColor = mix(pollutedColor, healthyColor, healFactor);

      // ── 4. LIGHTING & SPECULAR HIGHLIGHTS ──
      float NdotL = dot(normal, sunDir);
      float sunDiffuse = smoothstep(-0.06, 0.44, NdotL);

      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfH), 0.0);
      float specPower = mix(24.0, 60.0, healFactor);
      float specIntensity = mix(1.6, 3.2, healFactor);
      float oceanSpec = pow(NdotH, specPower) * oceanMask * smoothstep(0.0, 0.28, NdotL) * specIntensity;

      vec3 finalCol = surfaceColor * (uSunColor * sunDiffuse * 1.75 + uAmbientColor)
                    + vec3(oceanSpec) * uSunColor
                    + frontColor * frontGlow * 1.55 * sunDiffuse;

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `
};
