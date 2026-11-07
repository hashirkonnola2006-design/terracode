import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * GARBAGE SURFACE SHADER (Layer 1 Procedural Overlay)
 * ═══════════════════════════════════════════════════════════════
 * Generates dense organic trash clusters, white plastic bag speckles,
 * blue tarp patches, oily sludge, and landfill mounds directly on
 * oceans and coastal shelves.
 */

export const GarbageSurfaceShader = {
  uniforms: {
    uSpecularMap: { value: null as THREE.Texture | null },
    uSunDir:      { value: new THREE.Vector3(-2.2, 1.6, 1.2).normalize() },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 3.2) },
    uIntensity:   { value: 1.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv          = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D uSpecularMap;
    uniform vec3      uSunDir;
    uniform vec3      uCameraPos;
    uniform float     uIntensity;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    // Fast 3D Simplex noise for procedural organic clutter
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

      // Specular mask: 1.0 for ocean, 0.0 for land
      float isOcean = texture2D(uSpecularMap, vUv).r;

      // Primary macro gyre noise
      float macroNoise = fbm(wn * 4.2 + vec3(1.2, 3.4, 5.6));
      // High-frequency trash clumps
      float microNoise = snoise(wn * 32.0);
      float speckleNoise = snoise(wn * 95.0);

      // Ocean gyres have dense accumulation; coastal shelves have heavy runoff
      float accumulation = macroNoise + isOcean * 0.35 + (1.0 - abs(wn.y)) * 0.15;
      float trashMask = smoothstep(0.12, 0.38, accumulation);

      if (trashMask < 0.02) discard;

      // Color palettes for waste components:
      vec3 sludgeCol   = vec3(0.26, 0.22, 0.16); // dark muddy brown
      vec3 siltCol     = vec3(0.38, 0.36, 0.32); // dirty grey
      vec3 whiteBagCol = vec3(0.92, 0.94, 0.97); // crumpled white plastic bags
      vec3 blueTarpCol = vec3(0.12, 0.44, 0.85); // vivid royal blue plastic
      vec3 blackRubber = vec3(0.12, 0.12, 0.14); // tire rubber black

      // Base sludge blend
      vec3 debrisCol = mix(sludgeCol, siltCol, smoothstep(-0.2, 0.3, microNoise));

      // White plastic bags speckles (clustered on peaks of noise)
      float whiteBags = smoothstep(0.40, 0.75, speckleNoise) * smoothstep(0.15, 0.50, accumulation);
      debrisCol = mix(debrisCol, whiteBagCol, whiteBags * 0.85);

      // Blue tarp / plastic wrapper patches
      float blueTarps = smoothstep(0.55, 0.85, snoise(wn * 22.0 + vec3(7.1, 2.3, 1.9)));
      debrisCol = mix(debrisCol, blueTarpCol, blueTarps * 0.70);

      // Black tire / rubber debris chunks
      float rubberChunks = smoothstep(0.62, 0.88, snoise(wn * 28.0 + vec3(4.5, 9.1, 3.3)));
      debrisCol = mix(debrisCol, blackRubber, rubberChunks * 0.75);

      // Lighting: Directional Sun from upper-left with terminator
      vec3 sunDir = normalize(uSunDir);
      // Surface bump normal from micro noise
      vec3 perturbedNormal = normalize(wn + vec3(microNoise * 0.15, speckleNoise * 0.15, 0.0));
      float NdotL = dot(perturbedNormal, sunDir);
      float diffuse = smoothstep(-0.15, 0.65, NdotL);

      // Specular highlight on plastic bags
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(perturbedNormal, halfH), 0.0);
      float plasticSpec = pow(NdotH, 32.0) * whiteBags * max(NdotL, 0.0) * 1.8;

      vec3 ambient = vec3(0.04, 0.04, 0.06);
      vec3 finalCol = debrisCol * (diffuse * 1.25 + ambient) + vec3(plasticSpec);

      float alpha = trashMask * 0.92 * uIntensity;
      gl_FragColor = vec4(finalCol, alpha);
    }
  `
};

