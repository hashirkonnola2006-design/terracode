import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════
 *  EARTH SHADER — "Green Tomorrow" (TerraCode Competition)
 * ═══════════════════════════════════════════════════════════
 *
 * Highly calibrated procedural + texture planetary shader:
 * - Samples 2K cloudless Blue Marble day map (uDayMap).
 * - Samples 2K ocean specular mask (uSpecularMap).
 * - Samples 2K normal/bump map (uNormalMap) with gentle perturbation.
 * - Directional sun from upper-left with soft terminator line.
 *
 * 1. POLLUTED STATE (uHeal = 0.0):
 *    - Barren, scorched, dusty gray-brown continents (luma ~0.35, low saturation ~0.08).
 *    - Dead, stagnant toxic murky olive-gray oceans (zero blue, zero cyan).
 *    - Dull oily specular sheen.
 *    - Strictly no blocky/hexagonal noise artifacts: uses smooth continuous simplex FBM.
 *
 * 2. HEALED STATE (uHeal = 1.0):
 *    - Intensely vibrant, lush emerald continents (saturation ~0.55, rich vegetation).
 *    - Deep sapphire & tropical turquoise/cyan oceans (high saturation).
 *    - Sparkling ocean specular reflections.
 *
 * 3. HEALING FRONTIER:
 *    - Organic FBM noise wave that sweeps across the sphere driven by uHeal.
 *    - Bright bio-luminescent emerald laser front (#4ADE80).
 */
export const EarthShaderMaterial = {
  uniforms: {
    uHeal:        { value: 0.0 },
    uTime:        { value: 0.0 },
    uBrightness:  { value: 1.0 },
    uModeDay:     { value: 0.0 },
    uDayMap:      { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uNormalMap:   { value: null as THREE.Texture | null },
    uSunDir:      { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 2.85) },
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
    uniform float     uBrightness;
    uniform float     uModeDay;
    uniform sampler2D uDayMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uNormalMap;
    uniform vec3      uSunDir;
    uniform vec3      uCameraPos;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    // Fast 3D Simplex noise for smooth, continuous organic patterns (NO hexagonal cells!)
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

    void main() {
      vec3 wn = normalize(vWorldNormal);

      // Normal map sample
      vec3 normalSample = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      vec3 perturbedNormal = normalize(wn + vec3(normalSample.xy * 0.06, 0.0));

      // Directional Sun lighting with smooth terminator
      vec3 sunDir = normalize(uSunDir);
      float NdotL = dot(perturbedNormal, sunDir);
      float diffuse = smoothstep(-0.15, 0.55, NdotL);

      // Texture samples: cloudless day map and ocean specular mask
      vec3 dayCol = texture2D(uDayMap, vUv).rgb;
      float isOcean = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land

      // Lighting variables
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(perturbedNormal, halfH), 0.0);

      // ── TEST MODE: ?mode=day ──
      if (uModeDay > 0.5) {
        float spec = pow(NdotH, 32.0) * isOcean * max(NdotL, 0.0);
        vec3 lit = dayCol * (diffuse * 1.15 + 0.05) + vec3(0.9, 0.95, 1.0) * spec;
        gl_FragColor = vec4(lit * uBrightness, 1.0);
        return;
      }

      // ══════════════════════════════════════════════════════════════
      // 1. HEALED EARTH (Vivid emerald continents & crystal blue oceans)
      // ══════════════════════════════════════════════════════════════
      // Boost verdant emerald greens on land
      vec3 landHealed = dayCol;
      float greenBoost = clamp(dayCol.g * 1.6 - (dayCol.r + dayCol.b) * 0.4, 0.0, 1.0);
      vec3 lushGreen = vec3(0.04, 0.78, 0.20);
      landHealed = mix(landHealed, lushGreen, greenBoost * 0.75);
      // Boost land saturation
      float landLuma = dot(landHealed, vec3(0.299, 0.587, 0.114));
      landHealed = mix(vec3(landLuma), landHealed, 1.55);

      // Crystal clear ocean: deep sapphire to turquoise coast
      vec3 deepOceanHealed   = vec3(0.01, 0.18, 0.65);
      vec3 coastalCyanHealed = vec3(0.04, 0.60, 0.80);
      float coastMask = clamp(dayCol.b * 1.5 - dayCol.r * 0.6, 0.0, 1.0);
      vec3 oceanHealed = mix(deepOceanHealed, coastalCyanHealed, coastMask * 0.70);

      vec3 colHealed = mix(landHealed, oceanHealed, isOcean);

      // ══════════════════════════════════════════════════════════════
      // 2. POLLUTED EARTH (Barren scorched land & dead toxic sludge)
      // ══════════════════════════════════════════════════════════════
      // Land: parched, arid, desaturated scorched earth (luma-based, warm grayish-brown)
      float rawLuma = dot(dayCol, vec3(0.299, 0.587, 0.114));
      vec3 aridSoil = vec3(rawLuma * 0.55 + 0.10, rawLuma * 0.46 + 0.08, rawLuma * 0.35 + 0.06);

      // Smooth organic terrain variations via 3D simplex noise (NO Voronoi cells!)
      float terrainVar = snoise(wn * 14.0) * 0.04;
      aridSoil += vec3(terrainVar, terrainVar * 0.8, terrainVar * 0.5);

      // Desaturate severely (dead planet has almost no saturation: ~0.06)
      float soilLuma = dot(aridSoil, vec3(0.299, 0.587, 0.114));
      vec3 parchedLand = mix(vec3(soilLuma), aridSoil, 0.15);

      // Ocean: toxic, murky olive-gray sludge (zero blue, zero cyan!)
      vec3 oilOcean = vec3(0.14, 0.15, 0.12);
      float oilSheen = sin(snoise(wn * 10.0 + vec3(uTime * 0.02, 0.0, 0.0)) * 6.28) * 0.5 + 0.5;
      oilOcean += vec3(0.02, 0.02, 0.01) * oilSheen;

      vec3 colPolluted = mix(parchedLand, oilOcean, isOcean);

      // Luminance floor to prevent black holes (nothing darker than ~22% brightness)
      colPolluted = max(colPolluted, vec3(0.22));

      // ══════════════════════════════════════════════════════════════
      // 3. ORGANIC WAVE HEALING TRANSITION (Driven by uHeal 0 to 1)
      // ══════════════════════════════════════════════════════════════
      float wave = fbm(wn * 3.0 + vec3(1.2, 2.3, 3.4)) * 0.18;
      float coord = (wn.y * 0.5 + wn.x * 0.25) + wave;
      float healSweep = (uHeal * 1.8) - 0.9;
      float frontDist = healSweep - coord;
      float healFactor = smoothstep(-0.15, 0.15, frontDist);

      // Force strict bounds at the extremes (Bug 1 fix: guarantees 100% polluted at uHeal=0, 100% healed at uHeal=1)
      if (uHeal <= 0.001) healFactor = 0.0;
      if (uHeal >= 0.999) healFactor = 1.0;

      // Thin bio-luminescent emerald laser edge right at the wavefront (#4ADE80)
      float edgeMask = smoothstep(-0.10, 0.0, frontDist) * (1.0 - smoothstep(0.0, 0.15, frontDist));
      vec3 edgeGlow = vec3(0.29, 0.98, 0.55) * edgeMask * 2.2;
      if (uHeal <= 0.01 || uHeal >= 0.99) {
        edgeGlow = vec3(0.0);
      }

      vec3 surfaceCol = mix(colPolluted, colHealed, healFactor) + edgeGlow;

      // ══════════════════════════════════════════════════════════════
      // 4. LIGHTING & SPECULAR SHADING
      // ══════════════════════════════════════════════════════════════
      // Specular shine strictly on oceans
      float specPower = mix(12.0, 64.0, healFactor);
      float spec = pow(NdotH, specPower) * isOcean * max(NdotL, 0.0);
      vec3 specCol = mix(vec3(0.08, 0.08, 0.06), vec3(0.95, 0.98, 1.0), healFactor) * spec * 1.3;

      // Ambient space illumination
      vec3 ambient = mix(vec3(0.035, 0.035, 0.04), vec3(0.045, 0.065, 0.095), healFactor);

      vec3 finalColor = surfaceCol * (diffuse * 1.15 + ambient) + specCol;

      // Apply section brightness uniform
      gl_FragColor = vec4(finalColor * uBrightness, 1.0);
    }
  `
};
