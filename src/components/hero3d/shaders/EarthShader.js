import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Earth PBR Shader)
// ═══════════════════════════════════════════════════════════════
export const HEAL_FRONT_WIDTH = 0.08;
export const HEAL_FRONT_COLOR = '#44ffaa';
export const NORMAL_INTENSITY = 0.35;

export const EarthShader = {
  uniforms: {
    uDayMap:      { value: null },
    uNormalMap:   { value: null },
    uSpecularMap: { value: null },
    uTime:        { value: 0.0 },
    uPollution:   { value: 1.0 }, // 1.0 = destroyed/polluted, 0.0 = clean/healthy
    uHeal:        { value: 0.0 }, // Fallback / legacy alias
    uDim:         { value: 1.0 },
    uHover:       { value: 0.0 },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 3.65) },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv          = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      vViewNormal  = normalize(normalMatrix * normal);
      vViewPos     = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D uDayMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uSpecularMap;
    uniform float     uTime;
    uniform float     uPollution;
    uniform float     uHeal;
    uniform float     uDim;
    uniform float     uHover;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      // Effective pollution value (1.0 = fully destroyed, 0.0 = healed/clean)
      float pollution = clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);

      // In view space, camera is looking along -Z from (0,0,0)
      vec3 V = normalize(-vViewPos);
      vec3 wn = normalize(vWorldNormal);

      // Analytical sphere tangent for robust normal perturbation (zero NaN risk)
      vec3 T_world = vec3(-wn.z, 0.0, wn.x);
      if (dot(T_world, T_world) < 0.0001) T_world = vec3(1.0, 0.0, 0.0);
      T_world = normalize(T_world);
      vec3 B_world = normalize(cross(wn, T_world));

      vec3 normMap = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
      vec3 perturbedWorld = normalize(wn + (T_world * normMap.x + B_world * normMap.y) * 0.30);
      vec3 N = normalize((viewMatrix * vec4(perturbedWorld, 0.0)).xyz);

      // Key light offset slightly up and left in view space for gentle form definition
      vec3 keyDir = normalize(vec3(-0.35, 0.42, 0.84));
      float NdotL = dot(N, keyDir);

      // Clean diffuse is fully lit; Polluted diffuse darkens the night side more
      float cleanDiffuse = 0.64 + 0.36 * clamp(NdotL, 0.0, 1.0);
      float pollutedDiffuse = clamp(NdotL * 0.84 + 0.16, 0.06, 1.0); // Night side darkens down to ~0.06
      float diffuse = mix(cleanDiffuse, pollutedDiffuse, pollution);

      // Soft limb darkening preserving 3D depth and spherical mass
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, 0.28);

      // NASA Blue Marble textures
      vec3 dayTex = texture2D(uDayMap, vUv).rgb;
      float oceanMask = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land

      // ── 1. CLEAN NATURAL STATE (pollution = 0.0) ──
      // Land: True natural NASA colors (Himalayas, Sahara tan/gold, lush green vegetation, polar ice)
      // Coastal turquoise shelves near shorelines + deep sapphire navy oceans
      float shallowShelf = smoothstep(0.06, 0.32, dayTex.b - dayTex.r);
      vec3 deepOcean = vec3(0.012, 0.080, 0.32);
      vec3 coastalTurquoise = vec3(0.02, 0.42, 0.62);
      vec3 cleanOcean = mix(deepOcean, coastalTurquoise, shallowShelf * 0.70);
      vec3 cleanColor = mix(dayTex, cleanOcean, oceanMask);

      // ── 2. POLLUTED DEGRADED STATE (pollution = 1.0) ──
      // Continents: Desaturated and darkened toward dead, dusty gray-brown
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 desatLand = mix(dayTex, vec3(landLuma), 0.82); // Heavy desaturation
      vec3 deadDustyBrown = vec3(0.24, 0.20, 0.16);      // Dark dusty gray-brown
      vec3 pollutedLand = mix(desatLand * 0.64, deadDustyBrown, 0.55);

      // Oceans: Murkier, darker, less saturated blue with greenish-gray undertone
      vec3 murkyOcean = vec3(0.016, 0.038, 0.032);
      vec3 murkyCoast = vec3(0.026, 0.046, 0.038);
      vec3 pollutedOcean = mix(murkyOcean, murkyCoast, shallowShelf * 0.40);

      vec3 pollutedColor = mix(pollutedLand, pollutedOcean, oceanMask);

      // Transition smoothly driven by pollution (1.0 = destroyed, 0.0 = clean)
      vec3 surfaceColor = mix(cleanColor, pollutedColor, pollution);

      // ── 3. SURFACE FIRES (Subtle, slowly pulsing red/orange glow spots on land) ──
      vec3 fireEmission = vec3(0.0);
      if (oceanMask < 0.25 && pollution > 0.02) {
        // Known wildfire hotspots in UV coordinates (Amazon, Central Africa, Australia, Siberia, W. US)
        vec2 f1 = vec2(0.28, 0.40);
        vec2 f2 = vec2(0.54, 0.46);
        vec2 f3 = vec2(0.83, 0.32);
        vec2 f4 = vec2(0.70, 0.64);
        vec2 f5 = vec2(0.23, 0.63);

        // Independent gentle pulsing rates
        float p1 = 0.68 + 0.32 * sin(uTime * 1.8 + 0.0);
        float p2 = 0.64 + 0.36 * sin(uTime * 2.2 + 1.6);
        float p3 = 0.70 + 0.30 * sin(uTime * 1.5 + 3.1);
        float p4 = 0.66 + 0.34 * sin(uTime * 2.4 + 4.5);
        float p5 = 0.72 + 0.28 * sin(uTime * 1.9 + 2.3);

        // Coordinate micro-flicker
        float flicker = 0.85 + 0.15 * sin(vUv.x * 280.0 + vUv.y * 280.0 + uTime * 4.0);

        float s1 = smoothstep(0.035, 0.005, length((vUv - f1) * vec2(2.0, 1.0))) * p1;
        float s2 = smoothstep(0.030, 0.004, length((vUv - f2) * vec2(2.0, 1.0))) * p2;
        float s3 = smoothstep(0.028, 0.004, length((vUv - f3) * vec2(2.0, 1.0))) * p3;
        float s4 = smoothstep(0.032, 0.005, length((vUv - f4) * vec2(2.0, 1.0))) * p4;
        float s5 = smoothstep(0.026, 0.004, length((vUv - f5) * vec2(2.0, 1.0))) * p5;

        float fireTotal = (s1 + s2 + s3 + s4 + s5) * flicker * pollution;
        vec3 fireColor = mix(vec3(1.0, 0.28, 0.03), vec3(1.0, 0.72, 0.12), 0.35);
        fireEmission = fireColor * fireTotal * 2.2;
      }

      // ── 4. OCEAN SHEEN (Subtle wide soft sheen, diminished in murky water) ──
      vec3 H = normalize(keyDir + V);
      float NdotH = max(dot(N, H), 0.0);
      float sheenIntensity = mix(0.18, 0.05, pollution);
      float oceanSheen = pow(NdotH, 7.0) * sheenIntensity * oceanMask;
      vec3 sheenColor = vec3(oceanSheen) * mix(vec3(0.45, 0.68, 0.95), vec3(0.24, 0.34, 0.30), pollution);

      // ── 5. FINAL COMPOSITION (with dimming and fire emission) ──
      vec3 litColor = (surfaceColor * diffuse * limb + sheenColor) * uDim + fireEmission;

      gl_FragColor = vec4(litColor, 1.0);
    }
  `
};
