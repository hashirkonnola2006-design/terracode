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
      vec3 normal = normalize(wn + vec3(normalMap.xy * 0.05, 0.0));

      // ── 1. POLLUTED STATE (exact match to ground truth image 3d_earth.png) ──
      // Tan/orange deserts (Arabia, Sahara, Australia interior)
      // Dark green vegetation (India, Southeast Asia)
      // Deep navy oceans with subtle bathymetry gradients and micro-grime
      vec3 pollutedBase = atmosTex;

      // Enhance warm tan ochre on arid deserts (Sahara, Arabia, Australia)
      float isDesert = smoothstep(0.14, 0.42, pollutedBase.r - pollutedBase.b * 0.85) * (1.0 - oceanMask);
      vec3 richDesert = pollutedBase * vec3(1.30, 1.10, 0.80) + vec3(0.06, 0.03, 0.0);
      vec3 pollutedLand = mix(pollutedBase, richDesert, isDesert * 0.90);

      // Deep forest green on vegetation (India, Congo, SE Asia)
      float isVeg = smoothstep(0.08, 0.35, pollutedBase.g - pollutedBase.r * 0.80) * (1.0 - oceanMask);
      vec3 darkForest = pollutedBase * vec3(0.68, 0.95, 0.62);
      pollutedLand = mix(pollutedLand, darkForest, isVeg * 0.75);

      // Grimy micro-dirt overlay on continents
      float microMud = snoise(wn * 32.0);
      pollutedLand = mix(pollutedLand, vec3(0.14, 0.11, 0.08), smoothstep(0.40, 0.80, microMud) * 0.24);

      // Deep navy ocean matching reference image exactly
      vec3 pollutedOcean = mix(
        pollutedBase * vec3(0.70, 0.82, 1.15),
        vec3(0.012, 0.038, 0.11),
        0.50
      );
      vec3 pollutedColor = mix(pollutedLand, pollutedOcean, oceanMask);

      // ── 2. HEALTHY RESTORED STATE ──
      // Brilliant crystal azure/sapphire oceans, rich emerald green continents
      vec3 healthyLand = dayTex;
      float vegMask = smoothstep(0.12, 0.40, dayTex.g - dayTex.r * 0.75);
      vec3 lushGreen = vec3(0.06, 0.74, 0.22);
      healthyLand = mix(healthyLand, lushGreen, vegMask * 0.72);
      // Boost land vibrance
      float luma = dot(healthyLand, vec3(0.299, 0.587, 0.114));
      healthyLand = mix(vec3(luma), healthyLand, 1.45);

      // Crystal clear ocean with vibrant royal blue and coastal cyan shelf
      vec3 healthyOcean = mix(
        vec3(0.015, 0.16, 0.58), // deep vibrant royal blue
        vec3(0.030, 0.45, 0.72), // tropical turquoise coastal shelf
        smoothstep(0.15, 0.65, dayTex.b - dayTex.r)
      );
      vec3 healthyColor = mix(healthyLand, healthyOcean, oceanMask);

      // ── 3. NOISE-DRIVEN HEALING WAVE CROSSFADE ──
      // Multi-scale 3D simplex noise creates organic expanding patches across the sphere
      float waveNoise = fbm(wn * 3.4 + vec3(1.2, 2.8, 4.4)) * 0.40 + snoise(wn * 7.5) * 0.15;
      float healThreshold = waveNoise + 0.5;

      // Smooth wave propagation as uHeal goes 0 -> 1
      float healFactor = smoothstep(healThreshold - 0.22, healThreshold + 0.22, uHeal * 1.44 - 0.22);
      healFactor = clamp(healFactor, 0.0, 1.0);

      // Strict boundaries
      if (uHeal <= 0.001) healFactor = 0.0;
      if (uHeal >= 0.999) healFactor = 1.0;

      // Glowing wave front edge where healing actively transforms the surface
      float frontDist = abs(healFactor - 0.5) * 2.0;
      float frontGlow = pow(max(1.0 - frontDist, 0.0), 3.2) * smoothstep(0.02, 0.98, uHeal);
      vec3 frontColor = vec3(0.26, 1.0, 0.60); // luminous emerald laser edge

      // Soft green sprouts on land as uHeal approaches 1
      float sprouts = smoothstep(0.72, 0.98, uHeal) * (1.0 - oceanMask) * smoothstep(0.25, 0.75, snoise(wn * 16.0));
      vec3 sproutColor = vec3(0.18, 0.88, 0.32);

      // Composite base surface color
      vec3 surfaceColor = mix(pollutedColor, healthyColor, healFactor);
      surfaceColor = mix(surfaceColor, sproutColor, sprouts * 0.35);

      // ── 4. LIGHTING & SPECULAR HIGHLIGHTS ──
      float NdotL = dot(normal, sunDir);
      float sunDiffuse = smoothstep(-0.06, 0.44, NdotL);

      // Ocean specular glint (sharp & vibrant in healed state)
      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfH), 0.0);
      float specPower = mix(24.0, 60.0, healFactor);
      float specIntensity = mix(1.6, 3.2, healFactor);
      float oceanSpec = pow(NdotH, specPower) * oceanMask * smoothstep(0.0, 0.28, NdotL) * specIntensity;

      // Final illuminated surface with front glow
      vec3 finalCol = surfaceColor * (uSunColor * sunDiffuse * ${SUN_LIGHT_BOOST.toFixed(2)} + uAmbientColor)
                    + vec3(oceanSpec) * uSunColor
                    + frontColor * frontGlow * 1.55 * sunDiffuse;

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `
};
