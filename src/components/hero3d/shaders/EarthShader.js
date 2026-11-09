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
    uHeal:        { value: 0.0 },
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
    uniform float     uHeal;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
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

      // Wrap diffuse: guarantees visible hemisphere is fully lit with subtle curvature
      float NdotL = dot(N, keyDir);
      float diffuse = 0.64 + 0.36 * clamp(NdotL, 0.0, 1.0);

      // Soft limb darkening preserving 3D depth and spherical mass
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, 0.28);

      // NASA Blue Marble textures
      vec3 dayTex = texture2D(uDayMap, vUv).rgb;
      float oceanMask = texture2D(uSpecularMap, vUv).r; // 1.0 for ocean, 0.0 for land

      // ── 1. CLEAN NATURAL STATE (uHeal = 1) ──
      // Land: True natural NASA colors (Himalayas, Sahara tan/gold, lush green vegetation, polar ice)
      // Coastal turquoise shelves near shorelines + deep sapphire navy oceans
      float shallowShelf = smoothstep(0.06, 0.32, dayTex.b - dayTex.r);
      vec3 deepOcean = vec3(0.012, 0.080, 0.32);
      vec3 coastalTurquoise = vec3(0.02, 0.42, 0.62);
      vec3 cleanOcean = mix(deepOcean, coastalTurquoise, shallowShelf * 0.70);
      vec3 cleanColor = mix(dayTex, cleanOcean, oceanMask);

      // ── 2. POLLUTED DEGRADED STATE (uHeal = 0) ──
      // Graded from same NASA map: desaturate land, push toward dusty brown-gray, murky navy ocean
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 desatLand = mix(dayTex, vec3(landLuma), 0.35);
      vec3 dustySmog = vec3(0.48, 0.42, 0.34);
      vec3 pollutedLand = mix(desatLand, dustySmog, 0.18);

      // Murky ocean
      vec3 pollutedOcean = mix(
        dayTex * vec3(0.65, 0.75, 0.95),
        vec3(0.015, 0.035, 0.09),
        0.65
      );
      vec3 pollutedColor = mix(pollutedLand, pollutedOcean, oceanMask);

      // Smooth color transition driven by uHeal
      vec3 surfaceColor = mix(pollutedColor, cleanColor, uHeal);

      // ── 3. OCEAN SPECULAR GLOSS (Controlled highlight, no bloom blowout) ──
      vec3 H = normalize(keyDir + V);
      float NdotH = max(dot(N, H), 0.0);
      float specPower = mix(36.0, 72.0, uHeal);
      float specIntensity = mix(0.45, 0.85, uHeal);
      float oceanSpec = pow(NdotH, specPower) * oceanMask * specIntensity;

      // ── 4. FINAL COMPOSITION ──
      vec3 litColor = surfaceColor * diffuse * limb
                    + vec3(oceanSpec) * vec3(0.95, 0.98, 1.0);

      gl_FragColor = vec4(litColor, 1.0);
    }
  `
};
