import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * SURFACE CLUTTER INSTANCED PBR SHADER
 * ═══════════════════════════════════════════════════════════════
 * Fully-lit PBR surface clutter matching Earth's illumination:
 * - Camera-relative key light with wrap diffuse (no dark shadow terminator)
 * - Per-instance aThreshold driving 3-stage scroll healing:
 *   Stage A: Oxidation & Rust (0.0 -> 0.5)
 *   Stage B: Noise Dissolve with Ember Burn Edges (0.5 -> 0.85)
 *   Stage C: Vanish to Zero Scale (0.85 -> 1.0)
 */

export const ClutterShaderMaterial = {
  uniforms: {
    uHeal:      { value: 0.0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 3.65) },
    uTime:      { value: 0.0 },
  },

  vertexShader: `
    attribute float aThreshold;
    attribute float aClutterType;
    attribute vec3  aBaseColor;

    uniform float uHeal;
    uniform vec3  uCameraPos;
    uniform float uTime;

    varying vec3  vWorldNormal;
    varying vec3  vWorldPos;
    varying vec3  vBaseColor;
    varying float vType;
    varying float vLocalP;
    varying vec3  vObjectPos;

    void main() {
      vBaseColor = aBaseColor;
      vType = aClutterType;
      vObjectPos = position;

      // Local progress: staggered by per-instance threshold
      float p = smoothstep(aThreshold * 0.6, aThreshold * 0.6 + 0.4, uHeal);
      vLocalP = p;

      // Stage B & C: Shrink and sink into the surface
      float shrink = 1.0;
      vec3 sinkOffset = vec3(0.0);
      if (p > 0.5) {
        float decayPhase = clamp((p - 0.5) / 0.35, 0.0, 1.0);
        shrink = max(0.0, 1.0 - decayPhase);
        sinkOffset = normal * (-decayPhase * 0.02);
      }
      if (p >= 0.85) {
        shrink = 0.0;
      }

      vec4 localPos = vec4(position * shrink + sinkOffset, 1.0);
      mat4 instModel = modelMatrix * instanceMatrix;

      vWorldNormal = normalize((instModel * vec4(normal, 0.0)).xyz);
      vWorldPos    = (instModel * localPos).xyz;

      gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform vec3  uCameraPos;
    uniform float uTime;

    varying vec3  vWorldNormal;
    varying vec3  vWorldPos;
    varying vec3  vBaseColor;
    varying float vType;
    varying float vLocalP;
    varying vec3  vObjectPos;

    // Fast 3D Simplex noise for organic rust & dissolve
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

    void main() {
      float p = vLocalP;

      // Stage C: GONE (p >= 0.85)
      if (p >= 0.85) discard;

      // Stage B: NOISE DISSOLVE WITH GLOWING EMBER EDGES (p: 0.5 to 0.85)
      float emberGlow = 0.0;
      if (p > 0.5) {
        float decayT = (p - 0.5) / 0.35;
        float dNoise = snoise(vWorldPos * 38.0 + vec3(1.2, 3.4, 5.6)) * 0.5 + 0.5;
        if (dNoise < decayT * 1.08) discard;

        float edgeDist = dNoise - decayT * 1.08;
        if (edgeDist < 0.12) {
          emberGlow = (1.0 - edgeDist / 0.12) * 1.8;
        }
      }

      // ── Stage A: OXIDATION & RUSTING (p: 0.0 to 0.5) ──
      float oxT = clamp(p / 0.5, 0.0, 1.0);

      vec3 col = vBaseColor;
      float roughness = 0.35;
      float metalness = 0.0;
      float rustPulse = 0.0;

      // Type 0: Plastic (bags, sheets, bottles)
      if (vType < 0.5) {
        vec3 brittlePlastic = mix(vec3(0.82, 0.76, 0.52), vec3(0.35, 0.30, 0.24), oxT * 0.8);
        col = mix(vBaseColor, brittlePlastic, oxT * 0.85);
        roughness = mix(0.25, 0.90, oxT);
      }
      // Type 1: Metal (cans, oil barrels, rusty sheets)
      else if (vType < 1.5) {
        float rustNoise = snoise(vObjectPos * 8.0) * 0.5 + 0.5;
        float rustSpread = smoothstep(0.1, 0.8, oxT * 1.3 - (1.0 - rustNoise) * 0.4);
        vec3 rustCol = vec3(0.72, 0.28, 0.08);
        col = mix(vBaseColor, rustCol, rustSpread);
        roughness = mix(0.18, 0.95, rustSpread);
        metalness = mix(0.92, 0.08, rustSpread);
        rustPulse = rustSpread * (sin(uTime * 2.8 + vObjectPos.x * 6.0) * 0.5 + 0.5) * (1.0 - oxT * 0.45);
      }
      // Type 2: Rubber (tires)
      else if (vType < 2.5) {
        vec3 crackedGrey = vec3(0.35, 0.35, 0.38);
        col = mix(vBaseColor, crackedGrey, oxT * 0.85);
        roughness = mix(0.75, 0.98, oxT);
      }
      // Type 3: Wood & Cardboard (crates, pallets, cartons)
      else if (vType < 3.5) {
        vec3 soggyWood = vec3(0.16, 0.12, 0.09);
        col = mix(vBaseColor, soggyWood, oxT * 0.85);
        roughness = mix(0.70, 0.96, oxT);
      }
      // Type 4: Green Fishing Nets
      else if (vType < 4.5) {
        vec3 decayedNet = vec3(0.20, 0.26, 0.16);
        col = mix(vBaseColor, decayedNet, oxT * 0.80);
        roughness = 0.85;
      }
      // Type 5: Micro-speckles
      else {
        col = mix(vBaseColor, vec3(0.28, 0.24, 0.18), oxT * 0.80);
        roughness = 0.85;
      }

      // ── FULLY-LIT DIFFUSE LIGHTING (No black underside) ──
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 keyDir = normalize(viewDir + vec3(-0.30, 0.40, 0.35));

      float NdotL = dot(normal, keyDir);
      float diffuse = 0.62 + 0.38 * clamp(NdotL, 0.0, 1.0);

      vec3 halfH = normalize(keyDir + viewDir);
      float NdotH = max(dot(normal, halfH), 0.0);
      float spec = pow(NdotH, mix(32.0, 4.0, roughness)) * (1.0 - roughness * 0.8) * max(NdotL, 0.0);

      vec3 lightCol = vec3(1.0, 0.98, 0.94) * (diffuse * 1.45 + spec * (0.35 + metalness * 1.2));
      vec3 ambientCol = vec3(0.10, 0.12, 0.18);

      vec3 emberCol = vec3(1.0, 0.45, 0.05);
      vec3 finalCol = col * (lightCol + ambientCol) + emberCol * (rustPulse * 0.65 + emberGlow * 1.4);

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `
};
