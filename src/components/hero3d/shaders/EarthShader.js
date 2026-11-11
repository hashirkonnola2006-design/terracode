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

      // Key light: in standard mode keyDir = normalize(vec3(-0.35, 0.42, 0.84))
      // In hero solutions mode: strong cold rim light from upper left with deep shadow on right
      vec3 standardKeyDir = normalize(vec3(-0.35, 0.42, 0.84));
      vec3 heroKeyDir     = normalize(vec3(-0.82, 0.45, 0.25));
      vec3 keyDir = normalize(mix(standardKeyDir, heroKeyDir, uHeroSolutions));
      float NdotL = dot(N, keyDir);

      // Eased diffuse curve:
      // Clean: fully lit hemisphere with gentle falloff (min 0.65)
      // Polluted: darker night side (down to 0.06 standard, down to 0.05 in hero mode)
      float cleanDiffuse = 0.65 + 0.35 * clamp(NdotL, 0.0, 1.0);
      float standardPollutedDiffuse = clamp(NdotL * 0.84 + 0.16, 0.06, 1.0);
      float heroPollutedDiffuse     = clamp(NdotL * 0.92 + 0.14, 0.05, 1.0);
      float pollutedDiffuse = mix(standardPollutedDiffuse, heroPollutedDiffuse, uHeroSolutions);
      float diffuse = mix(pollutedDiffuse, cleanDiffuse, effectiveClean);

      // Soft limb darkening preserving 3D depth and spherical mass
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float limb = pow(NdotV, mix(0.28, 0.34, uHeroSolutions));

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

      // ── 2. POLLUTED DEGRADED STATE (Devastated, Scorched & Trash-Choked) ──
      // Continents: heavily deforested, toxic arid brown, acidic desertification, industrial soot
      float landLuma = dot(dayTex, vec3(0.299, 0.587, 0.114));
      vec3 scorchedBasalt  = vec3(0.08, 0.07, 0.06); // Dark charred volcanic peat
      vec3 deadAridSoil    = vec3(0.18, 0.14, 0.10); // Dried, parched desert soil
      vec3 industrialDust  = vec3(0.16, 0.16, 0.17); // Acid smog & industrial grime
      vec3 toxicSulfurClay = vec3(0.24, 0.18, 0.07); // Degraded chemical soil

      // Multi-octave organic mottling for dead continental wasteland (NO repeating dots!)
      float grime1 = sin(vUv.x * 32.0 + sin(vUv.y * 24.0) * 2.0) * cos(vUv.y * 28.0 + cos(vUv.x * 20.0) * 2.0);
      float grime2 = sin(vUv.x * 85.0 - vUv.y * 65.0) * cos(vUv.x * 65.0 + vUv.y * 85.0);
      float organicGrime = clamp((grime1 * 0.65 + grime2 * 0.35) * 0.5 + 0.5, 0.0, 1.0);

      vec3 pollutedLandBase = mix(scorchedBasalt, deadAridSoil, clamp(landLuma * 1.6, 0.0, 1.0));
      pollutedLandBase = mix(pollutedLandBase, industrialDust, organicGrime * 0.45);
      pollutedLandBase = mix(pollutedLandBase, toxicSulfurClay, smoothstep(0.55, 0.85, organicGrime) * 0.35);

      // Deforestation: completely replace bright green with scorched/arid tones
      vec3 pollutedLand = mix(pollutedLandBase, vec3(landLuma * 0.22), 0.35);

      // Oceans: Murky, toxic, oily with floating plastic garbage gyres
      vec3 murkyDeep = vec3(0.018, 0.026, 0.022); // Sickly dark green-brown dead ocean
      vec3 murkyCoast = vec3(0.032, 0.040, 0.025); // Toxic algae & industrial runoff
      vec3 basePollutedOcean = mix(murkyDeep, murkyCoast, shallowShelf * 0.65);

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
      float atlNorthMask = smoothstep(0.19, 0.02, dAtlN);

      // 4. South Atlantic Ocean Gyre (lon ~ -15°, lat ~ -30°) -> u ~ 0.458, v ~ 0.333
      vec2 atlSouthPos = vec2(0.458, 0.333);
      float dAtlS = length((vUv - atlSouthPos) * vec2(1.3, 1.7));
      float atlSouthMask = smoothstep(0.17, 0.02, dAtlS);

      // 5. Indian Ocean Garbage Gyre (lon ~ 80°, lat ~ -15°) -> u ~ 0.722, v ~ 0.416
      vec2 indGyrePos = vec2(0.722, 0.416);
      float dInd = length((vUv - indGyrePos) * vec2(1.2, 1.6));
      float indMask = smoothstep(0.20, 0.02, dInd);

      // 6. East Asian / Philippine Sea plastic convergence (lon ~ 135°, lat ~ 22°) -> u ~ 0.875, v ~ 0.622
      vec2 asiaSeaPos = vec2(0.875, 0.622);
      float dAsia = length((vUv - asiaSeaPos) * vec2(1.3, 1.8));
      float asiaSeaMask = smoothstep(0.16, 0.02, dAsia);

      // High-density procedural fractal noise for floating plastic trash islands and slicks
      float trashFbm = fbm2D(vUv * vec2(90.0, 50.0));
      float trashTurb = fbm2D(vUv * vec2(220.0, 130.0) + vec2(trashFbm * 0.40));
      float trashDensity = smoothstep(0.35, 0.75, trashTurb);

      float allGyres = max(max(max(pacNorthMask, pacSouthMask), max(atlNorthMask, atlSouthMask)), max(indMask, asiaSeaMask));
      float totalTrashGyre = allGyres * trashDensity * oceanMask;

      vec3 plasticScumCol = vec3(0.58, 0.62, 0.60); // Bleached weathered microplastics, foam & debris
      vec3 oilySludgeCol  = vec3(0.14, 0.12, 0.08); // Dark petroleum film & chemical sludge
      vec3 gyreTrashCol   = mix(oilySludgeCol, plasticScumCol, smoothstep(0.40, 0.80, trashTurb));

      // Coastal industrial toxic runoff bleeding from river deltas
      float coastalPollution = smoothstep(0.04, 0.25, shallowShelf) * (1.0 - shallowShelf) * 0.65;
      vec3 toxicRunoff = vec3(0.08, 0.09, 0.05);

      vec3 pollutedOcean = mix(basePollutedOcean, toxicRunoff, coastalPollution);
      pollutedOcean = mix(pollutedOcean, gyreTrashCol, totalTrashGyre * 0.85);

      // Eased Sub-Values for Global & Local Milestones:
      float oceanClarity = smoothstep(0.05, 0.65, effectiveClean);
      vec3 currentOcean = mix(pollutedOcean, cleanOcean, oceanClarity);

      float landGreen = smoothstep(0.12, 0.80, effectiveClean);
      vec3 currentLand = mix(pollutedLand, cleanLand, landGreen);

      // ── PROCEDURAL WILDFIRES & BURN HOTSPOTS ON UNHEALED CONTINENTS ──
      // Active burning hotspots: West US, Amazon, Med, Central Africa, Australia, Siberia, SE Asia
      float fire1 = smoothstep(0.042, 0.006, length((vUv - vec2(0.165, 0.705)) * vec2(1.2, 1.4))); // California/West US
      float fire2 = smoothstep(0.048, 0.008, length((vUv - vec2(0.335, 0.450)) * vec2(1.1, 1.3))); // Amazon Rainforest
      float fire3 = smoothstep(0.035, 0.005, length((vUv - vec2(0.488, 0.710)) * vec2(1.3, 1.5))); // Mediterranean / Iberia
      float fire4 = smoothstep(0.045, 0.008, length((vUv - vec2(0.560, 0.485)) * vec2(1.2, 1.3))); // Central Africa
      float fire5 = smoothstep(0.040, 0.006, length((vUv - vec2(0.888, 0.345)) * vec2(1.2, 1.4))); // Australia
      float fire6 = smoothstep(0.038, 0.006, length((vUv - vec2(0.750, 0.780)) * vec2(1.2, 1.5))); // Siberian Boreal
      float fire7 = smoothstep(0.035, 0.005, length((vUv - vec2(0.816, 0.490)) * vec2(1.3, 1.5))); // SE Asia / Borneo

      float allWildfires = max(max(max(fire1, fire2), max(fire3, fire4)), max(max(fire5, fire6), fire7)) * (1.0 - oceanMask);

      // Fractal flame fronts and crackling ember veins (NO smooth yellow ellipses!)
      float fireFbm = fbm2D(vUv * 160.0 + vec2(uTime * 0.15, -uTime * 0.25));
      float emberVeins = smoothstep(0.38, 0.82, fireFbm);

      // Charcoal burn scars surrounding wildfires
      currentLand = mix(currentLand, vec3(0.02, 0.018, 0.015), allWildfires * (1.0 - effectiveClean) * 0.90);

      // Realistic flickering ember core and golden flame tips
      float fireFlicker = 0.85 + 0.15 * sin(uTime * 8.0 + vUv.x * 450.0 + vUv.y * 380.0);
      vec3 emberRed   = vec3(1.0, 0.25, 0.02);
      vec3 flameGold  = vec3(1.0, 0.85, 0.18);
      vec3 fireColor  = mix(emberRed, flameGold, emberVeins);
      vec3 wildfireColor = fireColor * 4.2 * allWildfires * emberVeins * fireFlicker * (1.0 - effectiveClean);

      // ── 2B. PROCEDURAL HIGH-DETAIL BRANCHING TECTONIC FAULT LINES & MAGMA FISSURES ──
      vec3 heroFissureEmission = vec3(0.0);
      if (uHeroSolutions > 0.01) {
        // High-frequency fractal jitter for razor-sharp cracked tectonic rock edges
        float fJitter = sin(vUv.y * 45.0) * 0.0035 + 
                        sin(vUv.y * 110.0 + vUv.x * 80.0) * 0.0018 + 
                        sin(vUv.y * 320.0 - vUv.x * 240.0) * 0.0008 +
                        cos(vUv.y * 640.0) * 0.0004;
        vec2 p = vUv + vec2(fJitter, fJitter * 0.35);

        // Main Tectonic Rift Spine (runs down center u ~ 0.655 from y=0.90 to y=0.32)
        float s0 = distToSegment(p, vec2(0.650, 0.90), vec2(0.652, 0.78));
        float s1 = distToSegment(p, vec2(0.652, 0.78), vec2(0.655, 0.66));
        float s2 = distToSegment(p, vec2(0.655, 0.66), vec2(0.658, 0.54));
        float s3 = distToSegment(p, vec2(0.658, 0.54), vec2(0.662, 0.42));
        float s4 = distToSegment(p, vec2(0.662, 0.42), vec2(0.665, 0.32));
        float dSpine = min(min(min(s0, s1), min(s2, s3)), s4);

        // Branching Tributaries (Tectonic fracture forks)
        float b1 = distToSegment(p, vec2(0.652, 0.78), vec2(0.630, 0.72));
        float b2 = distToSegment(p, vec2(0.630, 0.72), vec2(0.612, 0.64));
        float b3 = distToSegment(p, vec2(0.655, 0.66), vec2(0.680, 0.60));
        float b4 = distToSegment(p, vec2(0.680, 0.60), vec2(0.702, 0.52));
        float b5 = distToSegment(p, vec2(0.658, 0.54), vec2(0.638, 0.47));
        float b6 = distToSegment(p, vec2(0.638, 0.47), vec2(0.620, 0.40));
        float b7 = distToSegment(p, vec2(0.654, 0.71), vec2(0.675, 0.74));
        float b8 = distToSegment(p, vec2(0.660, 0.48), vec2(0.682, 0.44));
        float dBranch = min(min(min(min(b1, b2), min(b3, b4)), min(b5, b6)), min(b7, b8));

        // Micro-Fractures (Capillary magma cracks)
        float m1 = distToSegment(p, vec2(0.630, 0.72), vec2(0.638, 0.67));
        float m2 = distToSegment(p, vec2(0.680, 0.60), vec2(0.672, 0.55));
        float m3 = distToSegment(p, vec2(0.656, 0.62), vec2(0.642, 0.58));
        float dMicro = min(min(m1, m2), m3);

        // Incandescent Core & Magma Heat
        float hotCoreSpine   = (1.0 - smoothstep(0.00010, 0.00055, dSpine));
        float plasmaSpine    = (1.0 - smoothstep(0.00030, 0.00120, dSpine));
        float magmaSpine     = (1.0 - smoothstep(0.00070, 0.00280, dSpine));
        float outerSpine     = (1.0 - smoothstep(0.00160, 0.00580, dSpine));

        float hotCoreBranch  = (1.0 - smoothstep(0.00008, 0.00045, dBranch)) * 0.85;
        float plasmaBranch   = (1.0 - smoothstep(0.00025, 0.00100, dBranch)) * 0.80;
        float magmaBranch    = (1.0 - smoothstep(0.00060, 0.00240, dBranch)) * 0.70;
        float outerBranch    = (1.0 - smoothstep(0.00140, 0.00480, dBranch)) * 0.60;

        float hotCoreMicro   = (1.0 - smoothstep(0.00006, 0.00030, dMicro)) * 0.70;
        float magmaMicro     = (1.0 - smoothstep(0.00045, 0.00180, dMicro)) * 0.60;

        float hotCore    = max(max(hotCoreSpine, hotCoreBranch), hotCoreMicro);
        float plasmaGlow = max(plasmaSpine, plasmaBranch);
        float innerGlow  = max(max(magmaSpine, magmaBranch), magmaMicro);
        float outerGlow  = max(outerSpine, outerBranch);

        // Charred basalt rock borders flanking the fault line (Rich contrast)
        float scorch = (1.0 - smoothstep(0.0025, 0.0120, min(dSpine, dBranch)));
        currentLand = mix(currentLand, vec3(0.008, 0.007, 0.006), scorch * 0.95);

        // Convective pulse & ember glow
        float magmaPulse = 0.92 + 0.08 * sin(uTime * 3.5 + vUv.y * 40.0 - vUv.x * 24.0);
        float emberFlicker = 0.94 + 0.06 * sin(vUv.x * 320.0 + vUv.y * 280.0 + uTime * 6.0);

        vec3 coreCol   = vec3(1.00, 0.99, 0.96); // Blinding white-hot core
        vec3 plasmaCol = vec3(1.00, 0.86, 0.22); // Hot electric gold
        vec3 orangeCol = vec3(1.00, 0.42, 0.04); // Vibrant fiery orange
        vec3 redCol    = vec3(0.85, 0.12, 0.02); // Deep crustal crimson

        float lavaCooling = smoothstep(0.65, 0.05, effectiveClean);
        heroFissureEmission = (coreCol * hotCore * 8.5 + plasmaCol * plasmaGlow * 5.0 + orangeCol * innerGlow * 3.2 + redCol * outerGlow * 1.5) * magmaPulse * emberFlicker * lavaCooling * uHeroSolutions;
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

      // ── 6B. BRIGHT ELECTRIC CYAN ATMOSPHERIC RIM GLOW (Hero Mode Reference Match) ──
      float rimDot = 1.0 - clamp(dot(N, V), 0.0, 1.0);
      float rimPower = pow(rimDot, 6.0);
      float rimTopFacing = smoothstep(0.12, 0.75, N.y); // Crisp on upper horizon arc
      vec3 electricCyanRim = vec3(0.04, 0.90, 1.0) * rimPower * rimTopFacing * 2.8 * uHeroSolutions;

      // ── 7. FINAL COMPOSITION ──
      vec3 litColor = (surfaceColor * diffuse * limb + sheenColor) * uDim + fireEmission + cityLightsEmission + pulseGlow + electricCyanRim;

      gl_FragColor = vec4(litColor, 1.0);
    }
  `
};

export default EarthShader;
