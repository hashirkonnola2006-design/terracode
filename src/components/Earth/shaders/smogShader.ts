import * as THREE from 'three';

/**
 * Smog Cloud Layer Shader
 * 
 * Volumetric-looking rotating smog and toxic haze layer:
 * - When uHeal = 0: Dense industrial smog, soot trails, and brown haze circling the globe.
 * - As uHeal approaches 1.0: Smog dissipates and dissolves completely, clearing the sky.
 */

export const SmogShaderMaterial = {
  uniforms: {
    uHeal: { value: 0.0 },
    uTime: { value: 0.0 },
    uLightDirection: { value: new THREE.Vector3(1.5, 1.0, 1.2).normalize() },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform float uTime;
    uniform vec3 uLightDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
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
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float total = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for(int i = 0; i < 4; i++) {
        total += amp * snoise(p * freq);
        freq *= 2.1;
        amp *= 0.5;
      }
      return total;
    }

    void main() {
      // Swirling coordinate with gentle atmospheric drift
      vec3 coord = normalize(vPosition);
      vec3 drift = vec3(uTime * 0.03, uTime * 0.015, -uTime * 0.02);
      
      float smogDensity = fbm(coord * 2.8 + drift);
      float smogMask = smoothstep(0.05, 0.45, smogDensity);

      // Sun shading on smog
      float NdotL = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
      
      // Sooty, ash-gray and sulfurous smog color
      vec3 darkAsh = vec3(0.22, 0.18, 0.15);
      vec3 sulfurSmog = vec3(0.38, 0.32, 0.20);
      vec3 smogColor = mix(darkAsh, sulfurSmog, smogDensity) * (NdotL * 0.8 + 0.3);

      // Dissipation as uHeal rises:
      // When uHeal is 0, full smog opacity.
      // When uHeal > 0.8, smog has completely dissolved.
      float healFade = 1.0 - smoothstep(0.0, 0.85, uHeal);
      float alpha = smogMask * 0.65 * healFade;

      if (alpha < 0.01) discard;

      gl_FragColor = vec4(smogColor, alpha);
    }
  `
};

