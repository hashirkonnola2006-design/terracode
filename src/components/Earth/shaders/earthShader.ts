import * as THREE from 'three';

/**
 * Procedural Earth Shader for "Green Tomorrow"
 * 
 * Sustainability Architecture:
 * - 100% procedural GLSL code: ZERO multi-megabyte bitmap textures downloaded.
 * - Drastically cuts initial page payload (<100KB instead of 20MB-50MB standard Earth textures).
 * - Generates continents, oceans, terrain elevation, polar ice caps, and dynamic clouds mathematically.
 * 
 * Uniforms:
 * - uHeal: 0.0 (fully polluted, gray-brown cracked earth, toxic oceans, smog) 
 *          to 1.0 (lush green continents, pristine cyan-blue oceans, clean white clouds).
 * - uTime: drives ocean water shimmer and atmospheric cloud drift.
 * - uLightDirection: sun position for realistic directional day/night lighting.
 */

export const EarthShaderMaterial = {
  uniforms: {
    uHeal: { value: 0.0 },
    uTime: { value: 0.0 },
    uLightDirection: { value: new THREE.Vector3(1.5, 1.0, 1.2).normalize() },
    uNoiseScale: { value: 2.2 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      // Normal in world space for lighting
      vNormal = normalize(normalMatrix * normal);
      // Raw 3D sphere coordinate for seamless 3D procedural noise (no UV seam pinching!)
      vPosition = position;
      
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform float uTime;
    uniform vec3 uLightDirection;
    uniform float uNoiseScale;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;

    // --- Fast 3D Simplex/Perlin Noise Functions for Seamless Spherical Procedural Generation ---
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

      // Permutations
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      // Gradients
      float n_ = 0.142857142857; // 1.0/7.0
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

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix contributions
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // Fractal Brownian Motion for multi-octave realistic topography
    float fbm(vec3 p) {
      float total = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        total += amplitude * snoise(p * frequency);
        frequency *= 2.02;
        amplitude *= 0.5;
      }
      return total;
    }

    // Voronoi / cellular noise for trash particles & cracked parched soil
    float cellularNoise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      float minDist = 1.0;
      for (int z = -1; z <= 1; z++) {
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec3 neighbor = vec3(float(x), float(y), float(z));
            vec3 point = vec3(
              snoise(i + neighbor + vec3(1.2, 3.4, 5.6)),
              snoise(i + neighbor + vec3(7.8, 9.0, 1.2)),
              snoise(i + neighbor + vec3(4.3, 2.1, 8.7))
            ) * 0.5 + 0.5;
            vec3 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
          }
        }
      }
      return minDist;
    }

    void main() {
      // 3D position on unit sphere used as texture coordinate
      vec3 sphereCoord = normalize(vPosition);
      
      // Calculate continental landmass mask using FBM noise
      float continentBase = fbm(sphereCoord * uNoiseScale);
      float continentDetail = fbm(sphereCoord * (uNoiseScale * 2.8) + vec3(12.3, 4.5, 7.8)) * 0.35;
      float elevation = continentBase + continentDetail;
      
      // Land vs Ocean threshold with smooth coastline transition
      float isLand = smoothstep(-0.04, 0.06, elevation);

      // Polar ice caps based on latitude (Y coordinate)
      float latitude = abs(sphereCoord.y);
      float polarMask = smoothstep(0.72, 0.88, latitude + snoise(sphereCoord * 5.0) * 0.08);

      // =========================================================================
      // 1. HEALED PLANET PALETTE (Vibrant Blues, Emerald Greens, Crystal Waters)
      // =========================================================================
      // Healed Oceans: deep navy ocean transitioning to tropical cyan near coasts
      vec3 deepOceanHealed = vec3(0.015, 0.08, 0.22);
      vec3 shallowOceanHealed = vec3(0.04, 0.42, 0.52);
      float coastProximity = smoothstep(-0.15, 0.02, elevation);
      vec3 oceanHealed = mix(deepOceanHealed, shallowOceanHealed, coastProximity);

      // Healed Land: lush emerald lowlands, temperate green valleys, warm rocky mountains
      vec3 lowlandGreen = vec3(0.12, 0.58, 0.22); // vibrant fertile green
      vec3 highlandGreen = vec3(0.18, 0.45, 0.16); // deep forest green
      vec3 mountainHealed = vec3(0.48, 0.42, 0.28); // earthy highland
      
      float mountainMask = smoothstep(0.2, 0.45, elevation);
      vec3 landHealed = mix(lowlandGreen, highlandGreen, clamp(elevation * 2.0, 0.0, 1.0));
      landHealed = mix(landHealed, mountainHealed, mountainMask);

      // Healed surface: Land + Ocean + Pristine Polar Ice
      vec3 surfaceHealed = mix(oceanHealed, landHealed, isLand);
      vec3 pristineIce = vec3(0.92, 0.96, 1.0);
      surfaceHealed = mix(surfaceHealed, pristineIce, polarMask);

      // Dynamic Wispy White Clouds for Healed Earth
      vec3 cloudCoord = sphereCoord + vec3(uTime * 0.015, 0.0, uTime * 0.01);
      float cleanCloudNoise = fbm(cloudCoord * 3.5);
      float cleanClouds = smoothstep(0.15, 0.55, cleanCloudNoise);
      surfaceHealed = mix(surfaceHealed, vec3(0.98, 0.99, 1.0), cleanClouds * 0.55);

      // =========================================================================
      // 2. POLLUTED PLANET PALETTE (Murky Sludge, Gray-Brown Cracked Land, Trash)
      // =========================================================================
      // Polluted Ocean: dark stagnant oily slick, toxic sulfurous brown-gray sheen
      vec3 oilOcean = vec3(0.08, 0.09, 0.07);
      vec3 sludgeOcean = vec3(0.18, 0.16, 0.11);
      vec3 oceanPolluted = mix(oilOcean, sludgeOcean, coastProximity);

      // Add toxic oily rainbow sheen streaks across oceans
      float oilSlick = sin(snoise(sphereCoord * 12.0 + vec3(uTime * 0.02)) * 6.28);
      oceanPolluted += vec3(0.04, 0.03, 0.01) * oilSlick;

      // Polluted Land: parched cracked earth, deforested gray-brown dust bowl
      vec3 parchedEarth = vec3(0.26, 0.22, 0.18);
      vec3 industrialBlight = vec3(0.16, 0.15, 0.14);
      vec3 toxicSulfur = vec3(0.35, 0.30, 0.14); // dead vegetation / sulfur dust
      
      float desertMask = smoothstep(0.0, 0.4, elevation);
      vec3 landPolluted = mix(industrialBlight, parchedEarth, desertMask);
      landPolluted = mix(landPolluted, toxicSulfur, snoise(sphereCoord * 8.0) * 0.3 + 0.3);

      // Cracked soil procedural pattern using cellular noise
      float cracks = cellularNoise(sphereCoord * 32.0);
      float crackLines = smoothstep(0.05, 0.18, cracks);
      landPolluted *= mix(0.65, 1.0, crackLines);

      // Scattered trash & industrial debris speckles
      float trashSpeckles = step(0.88, snoise(sphereCoord * 55.0));
      vec3 trashColor = vec3(0.65, 0.58, 0.52); // microplastics, concrete fragments
      landPolluted = mix(landPolluted, trashColor, trashSpeckles * 0.45);

      // Smudged, soot-stained polluted poles (melting dirty gray-yellow ice)
      vec3 dirtyIce = vec3(0.42, 0.40, 0.36);
      vec3 surfacePolluted = mix(oceanPolluted, landPolluted, isLand);
      surfacePolluted = mix(surfacePolluted, dirtyIce, polarMask * 0.85);

      // Dark smog patches on polluted planet
      float smogPatch = smoothstep(0.05, 0.5, fbm(sphereCoord * 2.8 + vec3(uTime * 0.01)));
      surfacePolluted = mix(surfacePolluted, vec3(0.18, 0.16, 0.14), smogPatch * 0.4);

      // =========================================================================
      // 3. ORGANIC HEALING WAVE PROPAGATION (Noise-driven Wave Front)
      // =========================================================================
      // The wave spreads across the sphere like a living revitalizing ripple
      // rather than a linear or artificial fade.
      float waveNoise = fbm(sphereCoord * 2.5 + vec3(1.5, 2.8, 3.1)) * 0.28;
      
      // Calculate local healing threshold:
      // When uHeal is 0.0, localHeal is <= 0.0 across entire sphere.
      // When uHeal is 1.0, localHeal is >= 1.0 across entire sphere.
      float healFront = (uHeal * 1.56) - (waveNoise + (1.0 - sphereCoord.y) * 0.18);
      float healFactor = smoothstep(0.0, 0.28, healFront);

      // Glowing bio-luminescent emerald green frontier wave edge
      // Spikes right at the boundary where healFront is between 0.02 and 0.22
      float edgeIntensity = smoothstep(0.0, 0.12, healFront) * (1.0 - smoothstep(0.12, 0.28, healFront));
      vec3 bioGlowColor = vec3(0.29, 0.98, 0.55); // #4ade80 vibrant green
      vec3 healingWaveFront = bioGlowColor * edgeIntensity * 2.6;

      // Blend polluted and healed states
      vec3 finalColor = mix(surfacePolluted, surfaceHealed, healFactor);
      
      // Add the glowing wave edge only while healing is active (0.0 < uHeal < 1.0)
      if (uHeal > 0.001 && uHeal < 0.999) {
        finalColor += healingWaveFront;
      }

      // =========================================================================
      // 4. REALISTIC SOLAR LIGHTING & SPECULAR SHADING
      // =========================================================================
      vec3 lightDir = normalize(uLightDirection);
      vec3 norm = normalize(vNormal);

      // Diffuse sunlight calculation
      float NdotL = max(dot(norm, lightDir), 0.0);
      
      // Soft ambient light so dark side remains subtly visible in space
      // Polluted side has gloomy brown ambient, healed side has gentle indigo space ambient
      vec3 ambientPolluted = vec3(0.04, 0.035, 0.03);
      vec3 ambientHealed = vec3(0.03, 0.05, 0.10);
      vec3 ambient = mix(ambientPolluted, ambientHealed, healFactor);

      // Specular highlight on water
      vec3 viewDir = normalize(-vWorldPosition);
      vec3 halfVector = normalize(lightDir + viewDir);
      float NdotH = max(dot(norm, halfVector), 0.0);
      
      // Healed water is shiny & reflective, polluted water has dull oily sheen
      float specPower = mix(12.0, 64.0, healFactor);
      float specularIntensity = pow(NdotH, specPower) * (1.0 - isLand) * NdotL;
      vec3 specularColor = mix(vec3(0.2, 0.18, 0.12), vec3(0.9, 0.95, 1.0), healFactor) * specularIntensity;

      // Atmospheric rim/Fresnel glow on the edge of the planet
      float fresnel = pow(1.0 - max(dot(norm, viewDir), 0.0), 3.0);
      vec3 rimPolluted = vec3(0.4, 0.25, 0.15) * 0.6; // smoggy reddish-brown haze
      vec3 rimHealed = vec3(0.15, 0.85, 0.75) * 0.9;   // pristine cyan-emerald ozone
      vec3 rimColor = mix(rimPolluted, rimHealed, healFactor) * fresnel;

      // Combine direct diffuse, ambient, specular, and atmospheric rim
      vec3 litColor = finalColor * (NdotL * 1.1 + ambient) + specularColor + rimColor;

      gl_FragColor = vec4(litColor, 1.0);
    }
  `
};
