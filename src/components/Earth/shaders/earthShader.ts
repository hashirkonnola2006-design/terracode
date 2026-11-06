import * as THREE from 'three';

/**
 * Procedural + Textured Earth Shader for "Green Tomorrow"
 * 
 * Techniques & Reference Attribution:
 * - Planetary Day/Night & Specular reflection: Inspired by official Three.js Earth examples
 *   (Mr.doob / Three.js authors, MIT License).
 * - Cellular crack noise & FBM healing wave: Custom procedural GLSL.
 * - Dynamic texture blending: Samples 2K Blue Marble day, specular, and normal maps,
 *   procedurally degrading them into toxic wasteland when uHeal = 0.0 and revitalizing
 *   into a lush emerald-and-cyan biosphere when uHeal = 1.0.
 */

export const EarthShaderMaterial = {
  uniforms: {
    uHeal: { value: 0.0 },
    uTime: { value: 0.0 },
    uDayMap: { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uCloudsMap: { value: null as THREE.Texture | null },
    uLightDirection: { value: new THREE.Vector3(1.6, 0.8, 1.4).normalize() },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform float uTime;
    uniform sampler2D uDayMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uCloudsMap;
    uniform vec3 uLightDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    // --- Fast Simplex Noise for Organic Wave Propagation & Blight ---
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = a0.xyz;
      vec3 p1 = a0.gbw;
      vec3 p2 = a1.xyz;
      vec3 p3 = a1.gbw;
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float total = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 4; i++) {
        total += amp * snoise(p * freq);
        freq *= 2.05;
        amp *= 0.5;
      }
      return total;
    }

    // Cellular noise for parched cracked dry lakebeds / soil
    float cellularCracks(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = vec2(
            fract(sin(dot(i + neighbor, vec2(127.1, 311.7))) * 43758.5453),
            fract(sin(dot(i + neighbor, vec2(269.5, 183.3))) * 43758.5453)
          );
          float d = length(neighbor + point - f);
          minDist = min(minDist, d);
        }
      }
      return minDist;
    }

    void main() {
      // Unit spherical coordinates
      vec3 sphereNorm = normalize(vPosition);

      // Sample real Earth 2K Blue Marble textures
      vec3 dayTex = texture2D(uDayMap, vUv).rgb;
      float specMask = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land
      float isLand = 1.0 - specMask;

      // =========================================================================
      // 1. HEALED EARTH LOOK (Vibrant, Lush Continents & Sparkling Oceans)
      // =========================================================================
      // Boost emerald vegetation vibrance on land
      vec3 landHealed = dayTex;
      // Enhance green forest channels slightly for vivid "Green Tomorrow" theme
      landHealed.g = max(landHealed.g, landHealed.b * 1.15);
      landHealed = mix(landHealed, vec3(0.12, 0.55, 0.22), clamp(dayTex.g - dayTex.r, 0.0, 1.0) * 0.4);

      // Pristine deep ocean with cyan coastal shelves
      vec3 deepOcean = vec3(0.015, 0.08, 0.24);
      vec3 tropicalShallows = vec3(0.04, 0.42, 0.55);
      vec3 oceanHealed = mix(deepOcean, tropicalShallows, clamp(dayTex.b * 1.2 - dayTex.r, 0.0, 1.0) * 0.5);

      vec3 colorHealed = mix(landHealed, oceanHealed, specMask);

      // Dynamic surface cloud shimmer from cloud texture
      vec2 cloudUv = vUv + vec2(uTime * 0.003, 0.0);
      float cloudVal = texture2D(uCloudsMap, cloudUv).r;
      colorHealed = mix(colorHealed, vec3(1.0, 1.0, 1.0), cloudVal * 0.6);

      // =========================================================================
      // 2. POLLUTED EARTH LOOK (Desaturated Parched Ground, Sludge, Cracks)
      // =========================================================================
      // Desaturate and brown out the land (dust bowl, industrial ash)
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 parchedSoil = vec3(landLuma * 0.7 + 0.12, landLuma * 0.6 + 0.09, landLuma * 0.45 + 0.05);

      // Add cellular crack fissures on land
      float crackPattern = cellularCracks(vUv * 64.0);
      float crackLines = smoothstep(0.05, 0.14, crackPattern);
      parchedSoil *= mix(0.45, 1.0, crackLines);

      // Microplastic debris & toxic sulfur spots
      float trashSpots = step(0.92, snoise(sphereNorm * 48.0));
      parchedSoil = mix(parchedSoil, vec3(0.7, 0.65, 0.5), trashSpots * 0.4);

      // Polluted Ocean: stagnant, murky dark brown-gray oil slick with oily sheen
      vec3 oilSludge = vec3(0.08, 0.09, 0.07);
      float oilSlick = sin(snoise(sphereNorm * 10.0 + vec3(uTime * 0.015)) * 6.28);
      oilSludge += vec3(0.03, 0.025, 0.01) * oilSlick;

      vec3 colorPolluted = mix(parchedSoil, oilSludge, specMask);

      // Dirty smog stained cloud layer
      float smogVal = texture2D(uCloudsMap, vUv + vec2(uTime * 0.002, 0.0)).r;
      colorPolluted = mix(colorPolluted, vec3(0.28, 0.24, 0.18), smogVal * 0.5);

      // =========================================================================
      // 3. ORGANIC WAVE HEALING (Noise-driven Wave Front + Glowing Emerald Rim)
      // =========================================================================
      float waveNoise = fbm(sphereNorm * 2.8 + vec3(1.8, 2.5, 3.2)) * 0.28;
      // Front progresses across the entire sphere from uHeal = 0.0 to 1.0
      float healFront = (uHeal * 1.56) - (waveNoise + (1.0 - sphereNorm.y) * 0.18);
      float healFactor = smoothstep(0.0, 0.28, healFront);

      // Glowing bio-luminescent emerald green wave front (#4ADE80)
      float edgeIntensity = smoothstep(0.0, 0.12, healFront) * (1.0 - smoothstep(0.12, 0.28, healFront));
      vec3 bioGlowColor = vec3(0.29, 0.98, 0.55); // #4ade80
      vec3 healingWaveFront = bioGlowColor * edgeIntensity * 3.0;

      // Blend polluted with healed
      vec3 finalBase = mix(colorPolluted, colorHealed, healFactor);
      if (uHeal > 0.005 && uHeal < 0.995) {
        finalBase += healingWaveFront;
      }

      // =========================================================================
      // 4. REALISTIC SOLAR LIGHTING, SPECULAR WATER & ATMOSPHERIC FRESNEL
      // =========================================================================
      vec3 norm = normalize(vNormal);
      vec3 lightDir = normalize(uLightDirection);
      vec3 viewDir = normalize(-vWorldPosition);

      // Sun diffuse calculation with smooth terminator
      float NdotL = dot(norm, lightDir);
      float sunDiffuse = smoothstep(-0.25, 0.85, NdotL);

      // Gentle dark space ambient so dark side stays subtly visible
      vec3 ambient = mix(vec3(0.02, 0.02, 0.03), vec3(0.03, 0.05, 0.08), healFactor);

      // Specular sunlight on oceans
      vec3 halfVec = normalize(lightDir + viewDir);
      float NdotH = max(dot(norm, halfVec), 0.0);
      float specPower = mix(10.0, 60.0, healFactor);
      float specular = pow(NdotH, specPower) * specMask * max(NdotL, 0.0);
      vec3 specColor = mix(vec3(0.2, 0.18, 0.12), vec3(0.9, 0.95, 1.0), healFactor) * specular;

      // Subtle atmospheric rim Fresnel on the sphere edge
      float fresnel = pow(1.0 - max(dot(norm, viewDir), 0.0), 3.0);
      vec3 rimColor = mix(vec3(0.4, 0.22, 0.12) * 0.6, vec3(0.18, 0.85, 0.65) * 0.95, healFactor) * fresnel;

      vec3 finalColor = finalBase * (sunDiffuse * 1.15 + ambient) + specColor + rimColor;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
