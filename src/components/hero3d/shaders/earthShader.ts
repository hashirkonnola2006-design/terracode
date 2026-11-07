import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════
 * PHOTOREALISTIC POLLUTED EARTH SHADER
 * ═══════════════════════════════════════════════════════════════
 * Blends 2K Blue Marble daytime photography, normal relief mapping,
 * ocean specular masking, and cinematic procedural pollution:
 * - Lush green continents, golden deserts, and deep sapphire oceans
 * - Realistic landfill clusters, white plastic bag speckles, blue tarps
 * - Dramatic directional sun from upper-left with deep night-side shadow
 */

export const PollutedEarthShader = {
  uniforms: {
    uDayMap:      { value: null as THREE.Texture | null },
    uNormalMap:   { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uSunDir:      { value: new THREE.Vector3(-1.95, 1.10, 0.55).normalize() },
    uCameraPos:   { value: new THREE.Vector3(0, 0, 3.2) },
    uSunColor:    { value: new THREE.Color('#fffaf0') },
    uAmbientColor:{ value: new THREE.Color('#010308') },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D uDayMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uSpecularMap;
    uniform vec3      uSunDir;
    uniform vec3      uCameraPos;
    uniform vec3      uSunColor;
    uniform vec3      uAmbientColor;

    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    // Fast 3D Simplex noise
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
      vec3 sunDir = normalize(uSunDir);
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Base 2K Blue Marble textures
      vec3 dayCol = texture2D(uDayMap, vUv).rgb;
      vec3 normMap = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
      float oceanMask = texture2D(uSpecularMap, vUv).r;

      // Realistic terrain normal relief
      vec3 normal = normalize(wn + normMap * 0.32);

      // Vibrant continent and ocean colors matching Blue Marble
      vec3 landCol = mix(dayCol, dayCol * vec3(1.18, 1.28, 1.10) + vec3(0.02, 0.04, 0.01), 0.75);
      vec3 oceanCol = mix(dayCol, vec3(0.02, 0.16, 0.40), 0.35);
      vec3 planetBase = mix(landCol, oceanCol, oceanMask);

      // Procedural surface garbage & pollution
      float macroGyre = fbm(wn * 3.8 + vec3(2.1, 4.3, 1.7));
      float microTrash = snoise(wn * 28.0);
      float speckleBags = snoise(wn * 85.0);

      // Plastic garbage patches along gyres & coastal shelves
      float trashCluster = smoothstep(0.24, 0.58, macroGyre + microTrash * 0.30);
      float whiteBags = smoothstep(0.48, 0.85, speckleBags) * trashCluster;
      float blueTarps = smoothstep(0.62, 0.90, snoise(wn * 20.0 + vec3(5.2, 1.8, 3.4))) * trashCluster;
      float brownMounds = smoothstep(0.40, 0.80, microTrash) * trashCluster;

      vec3 surfaceCol = mix(planetBase, vec3(0.28, 0.22, 0.16), brownMounds * 0.50);
      surfaceCol = mix(surfaceCol, vec3(0.10, 0.45, 0.92), blueTarps * 0.55);
      surfaceCol = mix(surfaceCol, vec3(0.96, 0.98, 1.0), whiteBags * 0.85);

      // Directional Sunlight with soft realistic terminator
      float NdotL = dot(normal, sunDir);
      float sunDiffuse = smoothstep(-0.05, 0.38, NdotL);

      // Specular ocean sun glint
      vec3 halfH = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfH), 0.0);
      float oceanSpec = pow(NdotH, 38.0) * oceanMask * smoothstep(0.0, 0.25, NdotL) * 2.8;
      float plasticSpec = pow(NdotH, 20.0) * whiteBags * smoothstep(0.0, 0.25, NdotL) * 1.8;

      vec3 finalColor = surfaceCol * (uSunColor * sunDiffuse * 1.55 + uAmbientColor)
                      + vec3(oceanSpec) * uSunColor
                      + vec3(plasticSpec) * vec3(1.0, 0.98, 0.95);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
