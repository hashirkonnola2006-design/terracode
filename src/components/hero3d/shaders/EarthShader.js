import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Earth PBR Shader with Local Heal Mask & City Lights)
// ═══════════════════════════════════════════════════════════════
export const HEAL_FRONT_WIDTH = 0.08;
export const HEAL_FRONT_COLOR = '#44ffaa';
export const NORMAL_INTENSITY = 0.35;

export const EarthShader = {
  uniforms: {
    uDayMap:      { value: null },
    uNormalMap:   { value: null },
    uSpecularMap: { value: null },
    uLightsMap:   { value: null },
    uHealMask:    { value: null },
    uTime:        { value: 0.0 },
    uPollution:   { value: 1.0 }, // 1.0 = destroyed/polluted, 0.0 = clean/healthy
    uHeal:        { value: 0.0 }, // Fallback / legacy alias
    uPulse:       { value: 0.0 }, // Light pulse on milestone reached
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
    uniform sampler2D uLightsMap;
    uniform sampler2D uHealMask;
    uniform float     uTime;
    uniform float     uPollution;
    uniform float     uHeal;
    uniform float     uPulse;
    uniform float     uDim;
    uniform float     uHover;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      // ── LOCAL HEAL MASK & GLOBAL STAGING ──
      float maskVal = 0.0;
      // Guard texture2D check with texture lookup
      maskVal = texture2D(uHealMask, vUv).r;

      float globalClean = 1.0 - clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);
      float effectiveClean = clamp(max(globalClean, maskVal), 0.0, 1.0);
      float effectivePollution = 1.0 - effectiveClean;

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

      // Eased diffuse curve:
      // Clean: fully lit hemisphere with gentle falloff (min 0.65)
      // Polluted: darker night side (down to 0.06)
      float cleanDiffuse = 0.65 + 0.35 * clamp(NdotL, 0.0, 1.0);
      float pollutedDiffuse = clamp(NdotL * 0.84 + 0.16, 0.06, 1.0);
      float diffuse = mix(pollutedDiffuse, cleanDiffuse, effectiveClean);

      // Soft limb darkening preserving 3D depth and spherical mass
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, 0.28);

      // NASA Blue Marble textures
      vec3 dayTex = texture2D(uDayMap, vUv).rgb;
      float oceanMask = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land

      // ── 1. CLEAN NATURAL STATE ──
      float shallowShelf = smoothstep(0.06, 0.32, dayTex.b - dayTex.r);
      vec3 deepOcean = vec3(0.012, 0.080, 0.32);
      vec3 coastalTurquoise = vec3(0.02, 0.42, 0.62);
      vec3 cleanOcean = mix(deepOcean, coastalTurquoise, shallowShelf * 0.70);
      vec3 cleanLand = dayTex;
      vec3 cleanColor = mix(cleanLand, cleanOcean, oceanMask);

      // ── 2. POLLUTED DEGRADED STATE ──
      // Continents: Desaturated and darkened toward dead, dusty gray-brown
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 desatLand = mix(dayTex, vec3(landLuma), 0.82);
      vec3 deadDustyBrown = vec3(0.24, 0.20, 0.16);
      vec3 pollutedLand = mix(desatLand * 0.64, deadDustyBrown, 0.55);

      // Oceans: Murkier, darker, greenish-gray
      vec3 murkyOcean = vec3(0.016, 0.038, 0.032);
      vec3 murkyCoast = vec3(0.026, 0.046, 0.038);
      vec3 pollutedOcean = mix(murkyOcean, murkyCoast, shallowShelf * 0.40);

      // Eased Sub-Values for Global & Local Milestones:
      // oceanClarity curve (0% -> murky, 25% -> clearing, 50%+ -> rich blue)
      float oceanClarity = smoothstep(0.05, 0.65, effectiveClean);
      vec3 currentOcean = mix(pollutedOcean, cleanOcean, oceanClarity);

      // landGreen curve (0% -> dusty brown, 50% -> green patches, 75%+ -> rich foliage)
      float landGreen = smoothstep(0.12, 0.80, effectiveClean);
      vec3 currentLand = mix(pollutedLand, cleanLand, landGreen);

      vec3 surfaceColor = mix(currentLand, currentOcean, oceanMask);

      // ── 3. SURFACE FIRES (Active at 0-25%, extinguishes by 50-60%) ──
      vec3 fireEmission = vec3(0.0);
      float fireFactor = smoothstep(0.55, 0.02, effectiveClean);
      if (oceanMask < 0.25 && fireFactor > 0.01) {
        vec2 f1 = vec2(0.819, 0.694); // East Asia
        vec2 f2 = vec2(0.727, 0.636); // South Asia / India
        vec2 f3 = vec2(0.526, 0.780); // Europe
        vec2 f4 = vec2(0.276, 0.728); // Eastern US
        vec2 f5 = vec2(0.638, 0.650); // Middle East

        float p1 = 0.75 + 0.25 * sin(uTime * 1.4 + 0.0);
        float p2 = 0.70 + 0.30 * sin(uTime * 1.8 + 1.6);
        float p3 = 0.72 + 0.28 * sin(uTime * 1.2 + 3.1);
        float p4 = 0.70 + 0.30 * sin(uTime * 1.6 + 4.5);
        float p5 = 0.75 + 0.25 * sin(uTime * 1.5 + 2.3);

        float flicker = 0.88 + 0.12 * sin(vUv.x * 280.0 + vUv.y * 280.0 + uTime * 3.5);

        float s1 = smoothstep(0.022, 0.003, length((vUv - f1) * vec2(2.0, 1.0))) * p1;
        float s2 = smoothstep(0.020, 0.003, length((vUv - f2) * vec2(2.0, 1.0))) * p2;
        float s3 = smoothstep(0.018, 0.003, length((vUv - f3) * vec2(2.0, 1.0))) * p3;
        float s4 = smoothstep(0.020, 0.003, length((vUv - f4) * vec2(2.0, 1.0))) * p4;
        float s5 = smoothstep(0.016, 0.003, length((vUv - f5) * vec2(2.0, 1.0))) * p5;

        float fireTotal = (s1 + s2 + s3 + s4 + s5) * flicker * fireFactor;
        vec3 fireColor = mix(vec3(0.95, 0.24, 0.02), vec3(0.95, 0.60, 0.10), 0.30);
        fireEmission = fireColor * fireTotal * 1.25;
      }

      // ── 4. NIGHT SIDE CITY LIGHTS (Fades in at 50%+, bright at 75-100%) ──
      vec3 cityLightsEmission = vec3(0.0);
      float nightDarkness = clamp(-NdotL * 1.2, 0.0, 1.0);
      float cityPower = smoothstep(0.48, 0.95, effectiveClean);
      if (cityPower > 0.01 && oceanMask < 0.25) {
        vec3 lightsTex = texture2D(uLightsMap, vUv).rgb;
        vec3 warmCityColor = vec3(1.0, 0.85, 0.55);
        cityLightsEmission = lightsTex * warmCityColor * cityPower * nightDarkness * 2.2;
      }

      // ── 5. OCEAN SHEEN ──
      vec3 H = normalize(keyDir + V);
      float NdotH = max(dot(N, H), 0.0);
      float sheenIntensity = mix(0.05, 0.22, oceanClarity);
      float oceanSheen = pow(NdotH, 8.0) * sheenIntensity * oceanMask;
      vec3 sheenColor = vec3(oceanSheen) * mix(vec3(0.24, 0.34, 0.30), vec3(0.45, 0.68, 0.95), oceanClarity);

      // ── 6. MILESTONE RADIANT PULSE ──
      vec3 pulseGlow = vec3(0.20, 0.85, 0.45) * uPulse * 0.40;

      // ── 7. FINAL COMPOSITION ──
      vec3 litColor = (surfaceColor * diffuse * limb + sheenColor) * uDim + fireEmission + cityLightsEmission + pulseGlow;

      gl_FragColor = vec4(litColor, 1.0);
    }
  `
};

export default EarthShader;
