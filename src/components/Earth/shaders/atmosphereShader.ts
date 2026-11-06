import * as THREE from 'three';

/**
 * Atmosphere Rim Shader
 *
 * A back-face sphere scaled ~12 % larger than Earth.
 * Uses a Fresnel term so only the limb (edge) is visible from camera.
 * Colour transitions:
 *   uHeal=0  →  dim reddish-brown smog corona
 *   uHeal=1  →  bright cyan-green pristine ozone glow
 *
 * Ref: Fresnel rim atmosphere is a classic technique described in
 * "GPU Gems 2 – Accurate Atmospheric Scattering" (Sean O'Neil).
 * This is a simplified artistic version without full Rayleigh maths.
 */
export const AtmosphereShaderMaterial = {
  uniforms: {
    uHeal:       { value: 0.0 },
    uSunDir:     { value: new THREE.Vector3(-1.6, 1.2, 1.0).normalize() },
    uCameraPos:  { value: new THREE.Vector3(0, 0, 3) },
  },

  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;
    void main(){
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPos    = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform vec3  uSunDir;
    uniform vec3  uCameraPos;
    varying vec3  vWorldNormal;
    varying vec3  vWorldPos;

    void main(){
      vec3  wn      = normalize(vWorldNormal);
      vec3  viewDir = normalize(uCameraPos - vWorldPos);

      // Fresnel: power 4 gives a tight, bright limb ring
      float rim     = pow(1.0 - max(dot(wn, viewDir), 0.0), 4.0);

      // Sun contribution to atmosphere brightness
      float sunFace = smoothstep(-0.3, 0.8, dot(wn, normalize(uSunDir)));

      // Colour: smoggy amber → clean cyan-green
      vec3  polluted = vec3(0.55, 0.28, 0.10);
      vec3  healed   = vec3(0.10, 0.80, 0.70);
      vec3  col      = mix(polluted, healed, smoothstep(0.05, 0.95, uHeal));

      float intensity = mix(0.60, 1.10, uHeal);
      float alpha     = rim * intensity * (sunFace * 0.6 + 0.4);

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `,
};
