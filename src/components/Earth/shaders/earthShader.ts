import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════
 *  EARTH SHADER — "Green Tomorrow" (TerraCode Competition)
 * ═══════════════════════════════════════════════════════════
 *
 * TECHNIQUE REFERENCES (all code written from scratch):
 * - Phong diffuse + specular: standard GLSL lighting model.
 * - Specular ocean mask: technique from Three.js Earth example
 *   (Mr.doob / three.js contributors, MIT Licence).
 * - Simplex 3-D noise: Ashima Arts / Stefan Gustavson, MIT Licence.
 * - Cellular Voronoi cracks: custom implementation.
 * - Healing wave FBM: custom noise layering.
 * - Fresnel rim atmosphere: common GPU gem technique.
 *
 * KEY UNIFORMS
 *   uHeal         – 0 (polluted) → 1 (healed), driven by scroll
 *   uTime         – seconds elapsed, drives idle cloud drift
 *   uDayMap       – 2K Blue Marble albedo (Three.js / NASA)
 *   uSpecularMap  – 1=ocean, 0=land mask (Three.js)
 *   uNightMap     – city lights shown on the shadow side
 *   uCloudsMap    – cloud alpha map (Three.js)
 *   uSunDir       – world-space sun direction (upper-left)
 *   uCameraPos    – for correct Fresnel / specular in view-space
 */
export const EarthShaderMaterial = {
  uniforms: {
    uHeal:       { value: 0.0 },
    uTime:       { value: 0.0 },
    uDayMap:     { value: null as THREE.Texture | null },
    uSpecularMap:{ value: null as THREE.Texture | null },
    uNightMap:   { value: null as THREE.Texture | null },
    uCloudsMap:  { value: null as THREE.Texture | null },
    // Sun from upper-left so the lit crescent is on the right
    uSunDir:     { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos:  { value: new THREE.Vector3(0, 0, 3) },
  },

  // ── Vertex Shader ───────────────────────────────────────
  vertexShader: `
    varying vec2  vUv;
    varying vec3  vNormal;       // view-space normal
    varying vec3  vWorldNormal;  // world-space normal (for 3-D noise)
    varying vec3  vWorldPos;     // for Fresnel + specular

    void main() {
      vUv          = uv;
      // normalMatrix converts from object→view space
      vNormal      = normalize(normalMatrix * normal);
      // modelMatrix converts from object→world space
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // ── Fragment Shader ─────────────────────────────────────
  fragmentShader: `
    uniform float      uHeal;
    uniform float      uTime;
    uniform sampler2D  uDayMap;
    uniform sampler2D  uSpecularMap;
    uniform sampler2D  uNightMap;
    uniform sampler2D  uCloudsMap;
    uniform vec3       uSunDir;
    uniform vec3       uCameraPos;

    varying vec2  vUv;
    varying vec3  vNormal;
    varying vec3  vWorldNormal;
    varying vec3  vWorldPos;

    /* ── Simplex 3-D noise (Ashima Arts, MIT) ────────────── */
    vec4 _p(vec4 x){return mod(((x*34.)+1.)*x,289.);}
    float snoise(vec3 v){
      const vec2 C=vec2(1./6.,1./3.);
      vec3 i=floor(v+dot(v,C.yyy));
      vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);
      vec3 l=1.-g;
      vec3 i1=min(g,l.zxy),i2=max(g,l.zxy);
      vec3 x1=x0-i1+C.xxx,x2=x0-i2+2.*C.xxx,x3=x0-1.+3.*C.xxx;
      i=mod(i,289.);
      vec4 p=_p(_p(_p(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
      float n_=.142857;
      vec3 ns=n_*vec3(0,2,1)-vec3(1,0,2)*n_;
      vec4 j=p-49.*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z),y_=floor(j-7.*x_);
      vec4 xs=x_*ns.x+ns.yyyy,ys=y_*ns.x+ns.yyyy;
      vec4 h=1.-abs(xs)-abs(ys);
      vec4 b0=vec4(xs.xy,ys.xy),b1=vec4(xs.zw,ys.zw);
      vec4 s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.;
      vec4 sh=-step(h,vec4(0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),
           p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
      vec4 nrm=1.79284291-.85373472*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
      p0*=nrm.x;p1*=nrm.y;p2*=nrm.z;p3*=nrm.w;
      vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
      m=m*m;
      return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    /* ── FBM (fractal Brownian motion) layered noise ────── */
    float fbm(vec3 p){
      float v=0.,a=.5;
      for(int i=0;i<5;i++){v+=a*snoise(p);p*=2.03;a*=.5;}
      return v;
    }

    /* ── Voronoi-style 2-D cracks for parched soil ───────── */
    float cracks(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float d=1.;
      for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
        vec2 n=vec2(x,y);
        vec2 pt=vec2(fract(sin(dot(i+n,vec2(127.1,311.7)))*43758.5),
                     fract(sin(dot(i+n,vec2(269.5,183.3)))*43758.5));
        d=min(d,length(n+pt-f));
      }
      return d;
    }

    void main(){
      vec3 wn  = normalize(vWorldNormal); // world-space normal
      vec3 vn  = normalize(vNormal);      // view-space normal

      /* ── Sun lighting (world space) ─────────────────────── */
      vec3  sunDir  = normalize(uSunDir);
      float NdotL   = dot(wn, sunDir);
      // Soft terminator: dark side starts at NdotL < 0
      // smoothstep range: [-0.1 , 0.6] gives a wide gradual dusk band
      float diffuse = smoothstep(-0.10, 0.60, NdotL);

      /* ── Fresnel / view direction (world space) ─────────── */
      // IMPORTANT: viewDir must go FROM surface TO camera
      vec3  viewDir = normalize(uCameraPos - vWorldPos);
      // Fresnel exponent 4 gives a tight glowing limb
      float fresnel = pow(1.0 - max(dot(wn, viewDir), 0.0), 4.0);

      /* ── Texture samples ─────────────────────────────────── */
      vec3  dayTex   = texture2D(uDayMap,     vUv).rgb;
      float specMask = texture2D(uSpecularMap,vUv).r; // 1=ocean 0=land
      vec3  nightTex = texture2D(uNightMap,   vUv).rgb;
      // Clouds scroll slowly westward with time
      vec2  cUv      = vUv + vec2(uTime * 0.004, 0.0);
      float cloudAlpha = texture2D(uCloudsMap, cUv).r;

      /* ═══════════════════════════════════════════════════════
         1.  HEALED EARTH LOOK
         Vibrant, lush continents; sparkling blue ocean.
         ═══════════════════════════════════════════════════════ */
      // Land: boost green channel slightly for lush vibe
      vec3 landH = dayTex;
      landH.g = mix(landH.g, min(landH.g * 1.3, 1.0), 0.35 * (1.0 - specMask));
      // Ocean: shift from dull to deep sapphire + coastal cyan
      vec3 deepOcean  = vec3(0.02, 0.07, 0.22);
      vec3 shallowOcean = vec3(0.05, 0.38, 0.52);
      vec3 oceanH = mix(deepOcean, shallowOcean, clamp(dayTex.b * 1.4 - dayTex.r * 0.5, 0.0, 1.0));
      vec3 colorHealed = mix(landH, oceanH, specMask);
      // Add white clouds (healed = white wispy clouds)
      colorHealed = mix(colorHealed, vec3(0.98, 0.99, 1.0), cloudAlpha * 0.7 * uHeal);

      /* ═══════════════════════════════════════════════════════
         2.  POLLUTED EARTH LOOK
         Same continent shapes but desaturated & brown.
         ═══════════════════════════════════════════════════════ */
      // Luminance-only desaturation keeps continent outlines readable
      float luma   = dot(dayTex, vec3(0.299, 0.587, 0.114));
      // Tint toward gray-brown; darker overall
      vec3 parchedLand = vec3(luma * 0.60 + 0.08,
                              luma * 0.52 + 0.07,
                              luma * 0.38 + 0.04);
      // Cellular crack lines on land only
      float crk   = cracks(vUv * 60.0);
      float crLine = smoothstep(0.04, 0.16, crk);
      parchedLand *= mix(0.40, 1.0, crLine) * (1.0 - specMask)
                   + specMask; // oceans: no cracks
      // Speckle trash/debris
      float debris = step(0.91, snoise(wn * 50.0));
      parchedLand  = mix(parchedLand, vec3(0.65, 0.60, 0.46), debris * 0.4 * (1.0 - specMask));
      // Dark sludge ocean
      vec3 oilOcean = vec3(0.06, 0.07, 0.05);
      float oilRipple = snoise(wn * 9.0 + vec3(uTime * 0.012, 0.0, 0.0)) * 0.5 + 0.5;
      oilOcean += vec3(0.04, 0.03, 0.01) * oilRipple * specMask;
      vec3 colorPolluted = mix(parchedLand, oilOcean, specMask);
      // Dark smog cloud streaks (use same cloud map but brown)
      float smogAlpha = texture2D(uCloudsMap, vUv + vec2(uTime*0.002,0)).r;
      colorPolluted = mix(colorPolluted, vec3(0.22, 0.18, 0.13), smogAlpha * 0.55 * (1.0 - uHeal));

      /* ═══════════════════════════════════════════════════════
         3.  HEALING WAVE  (noise-driven organic front)
         uHeal 0→1 drives a noisy front across the whole sphere.
         A thin emerald (#4ADE80) glow marks the frontier.
         ═══════════════════════════════════════════════════════ */
      // waveNoise warps the front so it spreads in organic patches
      float waveNoise = fbm(wn * 2.6 + vec3(1.4, 2.7, 3.8)) * 0.30;
      // healFront > 0 means "healed here"; its signed distance drives blend
      float healFront  = (uHeal * 1.56) - (waveNoise + (1.0 - wn.y) * 0.15);
      float healFactor = smoothstep(0.0, 0.26, healFront);

      // Thin glowing edge right at healFront ≈ 0
      float edgeMask   = smoothstep(-0.02, 0.10, healFront)
                       * (1.0 - smoothstep(0.10, 0.26, healFront));
      vec3 edgeGlow    = vec3(0.29, 0.98, 0.55) * edgeMask * 2.5; // #4ADE80

      vec3 baseSurface = mix(colorPolluted, colorHealed, healFactor);
      if(uHeal > 0.005 && uHeal < 0.995) baseSurface += edgeGlow;

      /* ═══════════════════════════════════════════════════════
         4.  LIGHTING  (Phong diffuse + specular + night side)
         ═══════════════════════════════════════════════════════ */
      // Ambient: tiny so dark side isn't pure black
      vec3 ambient = vec3(0.03, 0.04, 0.06) * mix(0.6, 1.0, uHeal);

      // Specular highlight on oceans
      vec3  halfH    = normalize(sunDir + viewDir);
      float NdotH    = max(dot(wn, halfH), 0.0);
      float specPow  = mix(12.0, 80.0, uHeal);     // healed water is cleaner/glossier
      float spec     = pow(NdotH, specPow) * specMask * max(NdotL, 0.0) * 1.4;
      vec3  specCol  = mix(vec3(0.25,0.20,0.14), vec3(1.0,1.0,1.0), uHeal) * spec;

      // Night side: show city lights on the dark hemisphere
      float nightBlend = max(0.0, -NdotL);           // 1 on fully dark side
      nightBlend = smoothstep(0.0, 0.5, nightBlend);
      // Polluted world has brighter city lights (more industrial activity)
      vec3  nightGlow = nightTex * mix(1.0, 0.4, uHeal) * nightBlend;

      // Atmospheric Fresnel rim (back-facing limb glow)
      vec3 rimPolluted = vec3(0.5, 0.25, 0.10);
      vec3 rimHealed   = vec3(0.12, 0.85, 0.65);
      vec3 rimColor    = mix(rimPolluted, rimHealed, uHeal) * fresnel * 0.9;

      // Final composite
      vec3 finalColor = baseSurface * (diffuse * 1.1 + ambient)
                      + specCol
                      + nightGlow
                      + rimColor;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
