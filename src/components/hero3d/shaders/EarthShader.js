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
    uHeroSolutions: { value: 0.0 }, // 1.0 = specialized /solutions hero mode (cracked, fires, ice cap, cyclone)
    uFireFlicker: { value: 1.0 },
    uUseLocalMask: { value: 0.0 }, // 1.0 = strictly follow local heal mask (for Quiz & Cleanup games)
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    float distToSegment(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise2D(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm2D(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      v += a * noise2D(p); p *= 2.02; a *= 0.5;
      v += a * noise2D(p); p *= 2.03; a *= 0.5;
      v += a * noise2D(p); p *= 2.01; a *= 0.5;
      v += a * noise2D(p);
      return v;
    }

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
    uniform float     uHeroSolutions;
    uniform float     uFireFlicker;
    uniform float     uUseLocalMask;

    varying vec2 vUv;
    varying vec3 vViewNormal;
    varying vec3 vViewPos;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    float distToSegment(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    float noise2D(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm2D(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      v += a * noise2D(p); p *= 2.02; a *= 0.5;
      v += a * noise2D(p); p *= 2.03; a *= 0.5;
      v += a * noise2D(p); p *= 2.01; a *= 0.5;
      v += a * noise2D(p);
      return v;
    }

    void main() {
      // ── LOCAL HEAL MASK & GLOBAL STAGING ──
      float maskVal = 0.0;
      maskVal = texture2D(uHealMask, vUv).r;

      float globalClean = 1.0 - clamp(max(uPollution, 1.0 - uHeal), 0.0, 1.0);
      
      // When uUseLocalMask > 0.5 (Quiz & Cleanup games):
      // The mask texture defines EXACTLY which parts are clean vs dirty.
      // If global clean is 1.0 (100% full victory), the entire planet is clean.
      // Otherwise, ONLY regions painted in maskVal are clean; unhealed regions remain genuinely dirty (0.0)!
      float effectiveClean;
      if (uUseLocalMask > 0.5) {
        if (globalClean >= 0.999) {
          effectiveClean = 1.0;
        } else {
          effectiveClean = maskVal;
        }
      } else {
        effectiveClean = clamp(max(globalClean, maskVal), 0.0, 1.0);
      }
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
      // Boost normal roughness in hero mode for cracked terrain
      float normStrength = mix(0.30, 0.58, uHeroSolutions);
      // Smoothly taper normal perturbation to zero near poles to eliminate UV singularity / swirl pinch
      float poleDamp = smoothstep(0.96, 0.82, abs(wn.y));
      normStrength *= poleDamp;

      vec3 perturbedWorld = normalize(wn + (T_world * normMap.x + B_world * normMap.y) * normStrength);
      vec3 N = normalize((viewMatrix * vec4(perturbedWorld, 0.0)).xyz);

      // Key light: illuminates the visible hemisphere directly (matches Landing Page Rig)
      vec3 keyDir = normalize(vec3(-0.35, 0.42, 0.84));
      float NdotL = dot(N, keyDir);

      // Eased diffuse curve:
      // Clean: fully lit hemisphere with gentle falloff (min 0.65)
      // Polluted: authentic weathered lighting floor (min 0.22, matches Landing Page)
      float cleanDiffuse = 0.65 + 0.35 * clamp(NdotL, 0.0, 1.0);
      float pollutedDiffuse = clamp(NdotL * 0.75 + 0.25, 0.22, 1.0);
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

      // ── 2. POLLUTED DEGRADED STATE (Devastated, Scorched & Trash-Choked, Matches Landing Page) ──
      // Continents: heavily deforested, toxic arid brown, acidic desertification, industrial soot
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 scorchedBasalt  = vec3(0.22, 0.18, 0.15); // Dark peat / weathered volcanic soil
      vec3 deadAridSoil    = vec3(0.34, 0.28, 0.21); // Parched, eroded desert wasteland soil
      vec3 industrialDust  = vec3(0.27, 0.26, 0.25); // Acid smog & industrial grime
      vec3 toxicSulfurClay = vec3(0.36, 0.29, 0.13); // Degraded chemical sulfur soil

      // Multi-octave organic mottling for dead continental wasteland
      float grime1 = sin(vUv.x * 32.0 + sin(vUv.y * 24.0) * 2.0) * cos(vUv.y * 28.0 + cos(vUv.x * 20.0) * 2.0);
      float grime2 = sin(vUv.x * 85.0 - vUv.y * 65.0) * cos(vUv.x * 65.0 + vUv.y * 85.0);
      float organicGrime = clamp((grime1 * 0.65 + grime2 * 0.35) * 0.5 + 0.5, 0.0, 1.0);

      vec3 pollutedLandBase = mix(scorchedBasalt, deadAridSoil, clamp(landLuma * 1.5, 0.0, 1.0));
      pollutedLandBase = mix(pollutedLandBase, industrialDust, organicGrime * 0.40);
      pollutedLandBase = mix(pollutedLandBase, toxicSulfurClay, smoothstep(0.55, 0.85, organicGrime) * 0.30);

      // High-frequency soot & industrial chemical grime FBM
      float sootNoise = fbm2D(vUv * vec2(140.0, 95.0));
      float acidSmog = fbm2D(vUv * vec2(60.0, 45.0) + vec2(1.2, 3.4));
      float sulfurPatch = smoothstep(0.48, 0.82, acidSmog);
      vec3 causticSulfur = vec3(0.32, 0.26, 0.08); // Toxic yellow-green sulfur deposits
      vec3 deepSootChar  = vec3(0.12, 0.11, 0.10); // Heavy industrial soot fallout
      
      vec3 pollutedLand = mix(pollutedLandBase, deepSootChar, smoothstep(0.38, 0.75, sootNoise) * 0.55);
      pollutedLand = mix(pollutedLand, causticSulfur, sulfurPatch * 0.40);

      // Oceans: Murky, toxic, oily with floating plastic garbage gyres (Matches Landing Page)
      vec3 murkyDeep = vec3(0.14, 0.17, 0.16); // Sickly murky slate-gray / olive-brown dead ocean
      vec3 murkyCoast = vec3(0.18, 0.21, 0.18); // Toxic algae & industrial runoff
      vec3 basePollutedOcean = mix(murkyDeep, murkyCoast, shallowShelf * 0.65);

      // Global Petroleum Oil Slick & Chemical Sheen covering unhealed ocean waters
      float oilNoise1 = fbm2D(vUv * vec2(38.0, 22.0) + vec2(uTime * 0.010, uTime * 0.006));
      float oilNoise2 = fbm2D(vUv * vec2(80.0, 46.0) - vec2(oilNoise1 * 0.65, uTime * 0.012));
      float oilSlickDensity = smoothstep(0.32, 0.75, oilNoise1 * 0.60 + oilNoise2 * 0.40);
      vec3 petroleumSludge = vec3(0.11, 0.09, 0.06);
      vec3 iridescentSheen = vec3(0.08, 0.18, 0.16);
      vec3 toxicSulfurRun  = vec3(0.18, 0.16, 0.06);
      vec3 oilyFilmCol = mix(petroleumSludge, iridescentSheen, smoothstep(0.40, 0.70, oilNoise2));
      oilyFilmCol = mix(oilyFilmCol, toxicSulfurRun, smoothstep(0.55, 0.85, oilNoise1));
      basePollutedOcean = mix(basePollutedOcean, oilyFilmCol, oilSlickDensity * 0.75 * oceanMask);

      // ── PROCEDURAL OCEAN PLASTIC GYRES & FLOATING TRASH ISLANDS ACROSS ALL BASINS ──
      // 1. Great North Pacific Garbage Patch (lon ~ -145°, lat ~ 32°) -> u ~ 0.097, v ~ 0.678
      vec2 pacNorthPos = vec2(0.097, 0.678);
      float dPacN = length((vUv - pacNorthPos) * vec2(1.2, 1.6));
      float pacNorthMask = smoothstep(0.22, 0.02, dPacN);

      // 2. South Pacific Ocean Gyre (lon ~ -110°, lat ~ -25°) -> u ~ 0.194, v ~ 0.361
      vec2 pacSouthPos = vec2(0.194, 0.361);
      float dPacS = length((vUv - pacSouthPos) * vec2(1.1, 1.5));
      float pacSouthMask = smoothstep(0.20, 0.02, dPacS);

      // 3. North Atlantic Ocean Gyre (lon ~ -42°, lat ~ 28°) -> u ~ 0.383, v ~ 0.655
      vec2 atlNorthPos = vec2(0.383, 0.655);
      float dAtlN = length((vUv - atlNorthPos) * vec2(1.2, 1.6));
      float atlNorthMask = smoothstep(0.22, 0.02, dAtlN);

      // 4. South Atlantic Ocean Gyre (lon ~ -15°, lat ~ -30°) -> u ~ 0.458, v ~ 0.333
      vec2 atlSouthPos = vec2(0.458, 0.333);
      float dAtlS = length((vUv - atlSouthPos) * vec2(1.3, 1.7));
      float atlSouthMask = smoothstep(0.19, 0.02, dAtlS);

      // 5. Indian Ocean Garbage Gyre (lon ~ 80°, lat ~ -15°) -> u ~ 0.722, v ~ 0.416
      vec2 indGyrePos = vec2(0.722, 0.416);
      float dInd = length((vUv - indGyrePos) * vec2(1.2, 1.6));
      float indMask = smoothstep(0.20, 0.02, dInd);

      // 6. East Asian / Philippine Sea plastic convergence (lon ~ 135°, lat ~ 22°) -> u ~ 0.875, v ~ 0.622
      vec2 asiaSeaPos = vec2(0.875, 0.622);
      float dAsia = length((vUv - asiaSeaPos) * vec2(1.3, 1.8));
      float asiaSeaMask = smoothstep(0.18, 0.02, dAsia);

      // 7. North Atlantic / European shipping lane plastic slick (lon ~ -25°, lat ~ 42°) -> u ~ 0.430, v ~ 0.733
      vec2 atlEuroPos = vec2(0.430, 0.733);
      float dAtlEuro = length((vUv - atlEuroPos) * vec2(1.2, 1.5));
      float atlEuroMask = smoothstep(0.24, 0.02, dAtlEuro);

      // 8. Mediterranean Sea trash & industrial oil basin (lon ~ 18°, lat ~ 35°) -> u ~ 0.550, v ~ 0.694
      vec2 medPos = vec2(0.550, 0.694);
      float dMed = length((vUv - medPos) * vec2(1.5, 1.8));
      float medMask = smoothstep(0.14, 0.01, dMed);

      // High-density procedural fractal noise for floating plastic trash islands and slicks
      float trashFbm = fbm2D(vUv * vec2(90.0, 50.0));
      float trashTurb = fbm2D(vUv * vec2(220.0, 130.0) + vec2(trashFbm * 0.40));
      float trashDensity = smoothstep(0.35, 0.75, trashTurb);

      float allGyres = max(max(max(pacNorthMask, pacSouthMask), max(atlNorthMask, atlSouthMask)), max(max(indMask, asiaSeaMask), max(atlEuroMask, medMask)));
      float totalTrashGyre = allGyres * trashDensity * oceanMask;

      vec3 plasticScumCol = vec3(0.62, 0.65, 0.62); // Bleached weathered microplastics, foam & debris
      vec3 oilySludgeCol  = vec3(0.15, 0.12, 0.08); // Dark petroleum film & chemical sludge
      vec3 gyreTrashCol   = mix(oilySludgeCol, plasticScumCol, smoothstep(0.40, 0.80, trashTurb));

      // Coastal industrial toxic runoff bleeding from river deltas
      float coastalPollution = smoothstep(0.02, 0.30, shallowShelf);
      float runoffTurb = fbm2D(vUv * vec2(110.0, 70.0));
      vec3 toxicRunoff = mix(vec3(0.08, 0.09, 0.04), vec3(0.13, 0.11, 0.06), runoffTurb);

      vec3 pollutedOcean = mix(basePollutedOcean, toxicRunoff, coastalPollution * 0.85);
      pollutedOcean = mix(pollutedOcean, gyreTrashCol, totalTrashGyre * 0.85);

      // Eased Sub-Values for Global & Local Milestones:
      float oceanClarity = smoothstep(0.05, 0.65, effectiveClean);
      vec3 currentOcean = mix(pollutedOcean, cleanOcean, oceanClarity);

      float landGreen = smoothstep(0.12, 0.80, effectiveClean);
      vec3 currentLand = mix(pollutedLand, cleanLand, landGreen);

      // ── PROCEDURAL WILDFIRES & BURN HOTSPOTS ON UNHEALED CONTINENTS ──
      // Active burning hotspots across Europe, Africa, Americas, Asia, Australia
      float fire1 = smoothstep(0.042, 0.006, length((vUv - vec2(0.165, 0.705)) * vec2(1.2, 1.4))); // California/West US
      float fire2 = smoothstep(0.048, 0.008, length((vUv - vec2(0.335, 0.450)) * vec2(1.1, 1.3))); // Amazon Rainforest
      float fire3 = smoothstep(0.038, 0.005, length((vUv - vec2(0.490, 0.710)) * vec2(1.3, 1.5))); // Mediterranean / Iberia & Southern Europe
      float fire4 = smoothstep(0.045, 0.008, length((vUv - vec2(0.560, 0.485)) * vec2(1.2, 1.3))); // Central Africa
      float fire5 = smoothstep(0.040, 0.006, length((vUv - vec2(0.888, 0.345)) * vec2(1.2, 1.4))); // Australia
      float fire6 = smoothstep(0.038, 0.006, length((vUv - vec2(0.750, 0.780)) * vec2(1.2, 1.5))); // Siberian Boreal
      float fire7 = smoothstep(0.035, 0.005, length((vUv - vec2(0.816, 0.490)) * vec2(1.3, 1.5))); // SE Asia / Borneo
      float fire8 = smoothstep(0.036, 0.006, length((vUv - vec2(0.525, 0.585)) * vec2(1.2, 1.4))); // North Africa / Sahel
      float fire9 = smoothstep(0.032, 0.005, length((vUv - vec2(0.530, 0.785)) * vec2(1.3, 1.5))); // Eastern Europe / Industrial

      float allWildfires = max(max(max(max(fire1, fire2), max(fire3, fire4)), max(max(fire5, fire6), max(fire7, fire8))), fire9) * (1.0 - oceanMask);

      // Fractal flame fronts and crackling ember veins (NO smooth yellow ellipses!)
      float fireFbm = fbm2D(vUv * 160.0 + vec2(uTime * 0.15, -uTime * 0.25));
      float emberVeins = smoothstep(0.38, 0.82, fireFbm);

      // Charcoal burn scars surrounding wildfires
      currentLand = mix(currentLand, vec3(0.015, 0.012, 0.010), allWildfires * (1.0 - effectiveClean) * 0.92);

      // Realistic flickering ember core and golden flame tips
      float fireFlicker = 0.85 + 0.15 * sin(uTime * 8.0 + vUv.x * 450.0 + vUv.y * 380.0);
      vec3 emberRed   = vec3(1.0, 0.22, 0.02);
      vec3 flameGold  = vec3(1.0, 0.85, 0.16);
      vec3 fireColor  = mix(emberRed, flameGold, emberVeins);
      vec3 wildfireColor = fireColor * 4.4 * allWildfires * emberVeins * fireFlicker * (1.0 - effectiveClean);

      // ── 2B. PROCEDURAL HIGH-DETAIL BRANCHING TECTONIC FAULT LINES & MAGMA FISSURES ──
      vec3 heroFissureEmission = vec3(0.0);
      if (uHeroSolutions > 0.01) {
        // Multi-octave FBM domain warping for brutal, jagged tectonic shear
        vec2 warp1 = vec2(
          fbm2D(vUv * vec2(58.0, 68.0)),
          fbm2D(vUv * vec2(58.0, 68.0) + vec2(4.3, 1.7))
        );
        vec2 warp2 = vec2(
          fbm2D(vUv * vec2(145.0, 165.0) + warp1 * 2.2),
          fbm2D(vUv * vec2(145.0, 165.0) + warp1 * 2.2 + vec2(2.8, 6.1))
        );
        // Angular rock shear & plate displacement: high frequency jitter breaks lines into jagged rock teeth
        float rockTeeth = (noise2D(vUv * 420.0) - 0.5) * 0.0035;
        vec2 p = vUv + (warp1 - 0.5) * 0.0068 + (warp2 - 0.5) * 0.0034 + vec2(rockTeeth, rockTeeth * 0.55);

        // ── PRIMARY GREAT RIFT SPINE (North to South continental rupture) ──
        float s0 = distToSegment(p, vec2(0.648, 0.910), vec2(0.651, 0.835));
        float s1 = distToSegment(p, vec2(0.651, 0.835), vec2(0.647, 0.770));
        float s2 = distToSegment(p, vec2(0.647, 0.770), vec2(0.654, 0.695));
        float s3 = distToSegment(p, vec2(0.654, 0.695), vec2(0.652, 0.615));
        float s4 = distToSegment(p, vec2(0.652, 0.615), vec2(0.659, 0.535));
        float s5 = distToSegment(p, vec2(0.659, 0.535), vec2(0.656, 0.455));
        float s6 = distToSegment(p, vec2(0.656, 0.455), vec2(0.663, 0.380));
        float s7 = distToSegment(p, vec2(0.663, 0.380), vec2(0.666, 0.300));
        float dSpine = min(min(min(min(s0, s1), min(s2, s3)), min(s4, s5)), min(s6, s7));

        // ── MAJOR TECTONIC SHEAR BRANCHES ──
        // Branch A: Red Sea & Arabian Extensional Fault
        float bA1 = distToSegment(p, vec2(0.654, 0.695), vec2(0.678, 0.730));
        float bA2 = distToSegment(p, vec2(0.678, 0.730), vec2(0.705, 0.785));
        // Branch B: Zagros / Persian Shear Fault
        float bB1 = distToSegment(p, vec2(0.678, 0.730), vec2(0.702, 0.690));
        float bB2 = distToSegment(p, vec2(0.702, 0.690), vec2(0.730, 0.660));
        // Branch C: Western African Graben
        float bC1 = distToSegment(p, vec2(0.647, 0.770), vec2(0.625, 0.745));
        float bC2 = distToSegment(p, vec2(0.625, 0.745), vec2(0.608, 0.680));
        // Branch D: Central African Rift
        float bD1 = distToSegment(p, vec2(0.652, 0.615), vec2(0.630, 0.565));
        float bD2 = distToSegment(p, vec2(0.630, 0.565), vec2(0.615, 0.490));
        // Branch E: Horn of Africa / Somali micro-plate tear
        float bE1 = distToSegment(p, vec2(0.659, 0.535), vec2(0.685, 0.510));
        float bE2 = distToSegment(p, vec2(0.685, 0.510), vec2(0.715, 0.465));
        // Branch F: Southern Ocean Spreading Ridge
        float bF1 = distToSegment(p, vec2(0.663, 0.380), vec2(0.682, 0.335));
        float bF2 = distToSegment(p, vec2(0.682, 0.335), vec2(0.705, 0.280));
        float dBranch = min(min(min(min(bA1, bA2), min(bB1, bB2)), min(min(bC1, bC2), min(bD1, bD2))), min(min(bE1, bE2), min(bF1, bF2)));

        // ── SPIDERWEB CAPILLARY MICRO-FISSURES ──
        float m1  = distToSegment(p, vec2(0.651, 0.835), vec2(0.665, 0.850));
        float m2  = distToSegment(p, vec2(0.647, 0.770), vec2(0.658, 0.790));
        float m3  = distToSegment(p, vec2(0.625, 0.745), vec2(0.632, 0.710));
        float m4  = distToSegment(p, vec2(0.678, 0.730), vec2(0.668, 0.710));
        float m5  = distToSegment(p, vec2(0.654, 0.695), vec2(0.642, 0.670));
        float m6  = distToSegment(p, vec2(0.670, 0.650), vec2(0.685, 0.635));
        float m7  = distToSegment(p, vec2(0.652, 0.615), vec2(0.665, 0.590));
        float m8  = distToSegment(p, vec2(0.630, 0.565), vec2(0.622, 0.540));
        float m9  = distToSegment(p, vec2(0.642, 0.575), vec2(0.648, 0.550));
        float m10 = distToSegment(p, vec2(0.659, 0.535), vec2(0.672, 0.550));
        float m11 = distToSegment(p, vec2(0.685, 0.510), vec2(0.692, 0.485));
        float m12 = distToSegment(p, vec2(0.656, 0.455), vec2(0.642, 0.430));
        float m13 = distToSegment(p, vec2(0.615, 0.490), vec2(0.605, 0.460));
        float m14 = distToSegment(p, vec2(0.663, 0.380), vec2(0.648, 0.360));
        float m15 = distToSegment(p, vec2(0.682, 0.335), vec2(0.675, 0.310));
        float m16 = distToSegment(p, vec2(0.666, 0.300), vec2(0.655, 0.270));
        float dMicro = min(min(min(min(m1, m2), min(m3, m4)), min(min(m5, m6), min(m7, m8))),
                           min(min(min(m9, m10), min(m11, m12)), min(min(m13, m14), min(m15, m16))));

        // Convective basalt crust plates forming and fracturing across the lava
        float crustTurb = fbm2D(p * vec2(280.0, 310.0) + vec2(uTime * 0.05, -uTime * 0.03));
        float crustFlakes = smoothstep(0.38, 0.72, crustTurb);

        // Subterranean graben trench depth: dark canyon shadow flanking the rift
        float chasmTrench = (1.0 - smoothstep(0.0018, 0.0085, min(dSpine, dBranch)));
        currentLand = mix(currentLand, vec3(0.006, 0.005, 0.004), chasmTrench * 0.96);

        // Razor-sharp incandescent core emission profiles (NOT blurry neon tubes)
        float hotCoreSpine = (1.0 - smoothstep(0.00004, 0.00030, dSpine));
        float plasmaSpine  = (1.0 - smoothstep(0.00015, 0.00075, dSpine));
        float magmaSpine   = (1.0 - smoothstep(0.00040, 0.00160, dSpine));
        float outerSpine   = (1.0 - smoothstep(0.00090, 0.00320, dSpine));

        float hotCoreBranch = (1.0 - smoothstep(0.00003, 0.00025, dBranch)) * 0.85;
        float plasmaBranch  = (1.0 - smoothstep(0.00012, 0.00060, dBranch)) * 0.80;
        float magmaBranch   = (1.0 - smoothstep(0.00035, 0.00130, dBranch)) * 0.70;
        float outerBranch   = (1.0 - smoothstep(0.00080, 0.00260, dBranch)) * 0.60;

        float hotCoreMicro = (1.0 - smoothstep(0.00002, 0.00018, dMicro)) * 0.75;
        float magmaMicro   = (1.0 - smoothstep(0.00018, 0.00075, dMicro)) * 0.60;

        float hotCore    = max(max(hotCoreSpine, hotCoreBranch), hotCoreMicro);
        float plasmaGlow = max(plasmaSpine, plasmaBranch);
        float innerGlow  = max(max(magmaSpine, magmaBranch), magmaMicro);
        float outerGlow  = max(outerSpine, outerBranch);

        // Magma colors
        vec3 coreCol   = vec3(1.00, 0.99, 0.94); // Blinding white-hot core
        vec3 plasmaCol = vec3(1.00, 0.84, 0.16); // Incandescent electric gold
        vec3 orangeCol = vec3(1.00, 0.36, 0.03); // Volcanic fiery orange
        vec3 redCol    = vec3(0.85, 0.10, 0.01); // Crustal crimson rock glow

        // Magma pulse and ember shimmer
        float magmaPulse = 0.93 + 0.07 * sin(uTime * 3.5 + vUv.y * 50.0 - vUv.x * 35.0);
        float emberFlicker = 0.94 + 0.06 * sin(vUv.x * 380.0 + vUv.y * 320.0 + uTime * 6.5);

        // Subsurface lava cooling & crust flake occlusion
        float moltenIntensity = (1.0 - crustFlakes * 0.80);
        vec3 activeMagma = (coreCol * hotCore * 12.0 + 
                            plasmaCol * plasmaGlow * 6.5 + 
                            orangeCol * innerGlow * 3.6 + 
                            redCol * outerGlow * 1.8) * moltenIntensity;

        // Dark basalt crust with glowing red cracks
        vec3 basaltCrust = vec3(0.03, 0.02, 0.02) + redCol * innerGlow * 0.85;
        vec3 fissureLava = mix(basaltCrust, activeMagma, moltenIntensity);

        float lavaCooling = smoothstep(0.70, 0.05, effectiveClean);
        heroFissureEmission = fissureLava * magmaPulse * emberFlicker * lavaCooling * uHeroSolutions;
      }

      vec3 surfaceColor = mix(currentLand, currentOcean, oceanMask);
      vec3 fireEmission = heroFissureEmission + wildfireColor;

      // ── 4. NIGHT SIDE CITY LIGHTS (Dense sparkling golden grids on dark hemisphere) ──
      vec3 cityLightsEmission = vec3(0.0);
      float nightDarkness = smoothstep(0.08, -0.24, NdotL);
      float landFactor = 1.0 - smoothstep(0.05, 0.38, oceanMask);
      if (nightDarkness > 0.01 && landFactor > 0.01) {
        vec3 lightsTex = texture2D(uLightsMap, vUv).rgb;
        float sparkle = 0.88 + 0.12 * sin(vUv.x * 620.0 + vUv.y * 580.0 + uTime * 3.5);
        vec3 warmCityColor = vec3(1.0, 0.86, 0.44); // Brilliant golden amber
        cityLightsEmission = lightsTex * warmCityColor * nightDarkness * landFactor * sparkle * 18.0;
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
