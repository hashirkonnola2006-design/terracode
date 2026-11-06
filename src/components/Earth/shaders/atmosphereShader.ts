import * as THREE from 'three';

/**
 * Atmosphere Glow Shader
 * 
 * Creates a glowing planetary halo / corona that reacts dynamically to planetary health:
 * - When uHeal = 0.0: Murky, dim reddish-brown/gray smog aura (toxic greenhouse atmosphere).
 * - When uHeal = 1.0: Brilliant, vibrant cyan-green ozone shield (pristine restored atmosphere).
 */

export const AtmosphereShaderMaterial = {
  uniforms: {
    uHeal: { value: 0.0 },
    uLightDirection: { value: new THREE.Vector3(1.5, 1.0, 1.2).normalize() },
    uAtmospherePower: { value: 3.2 },
    uAtmosphereIntensity: { value: 1.1 },
  },

  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float uHeal;
    uniform vec3 uLightDirection;
    uniform float uAtmospherePower;
    uniform float uAtmosphereIntensity;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 norm = normalize(vNormal);
      vec3 viewDir = normalize(-vWorldPosition);
      vec3 lightDir = normalize(uLightDirection);

      // Atmospheric rim limb glow via Fresnel effect
      float rim = 1.0 - max(dot(norm, viewDir), 0.0);
      rim = pow(rim, uAtmospherePower);

      // Sun lighting contribution to atmosphere (brighter on sunlit crescent)
      float sunDot = dot(norm, lightDir);
      float sunFacing = smoothstep(-0.3, 0.8, sunDot);

      // Colors for atmosphere transition:
      // Polluted: choked reddish-gray smog haze
      vec3 colorPolluted = vec3(0.48, 0.28, 0.16);
      
      // Healed: radiant cyan-emerald ozone layer
      vec3 colorHealed = vec3(0.12, 0.88, 0.72);

      // Soft transition between toxic smog aura and pristine ozone
      vec3 atmosphereColor = mix(colorPolluted, colorHealed, smoothstep(0.1, 0.9, uHeal));
      
      // Healed atmosphere is more radiant and luminous
      float intensity = mix(0.7, uAtmosphereIntensity, uHeal);
      float alpha = rim * intensity * (sunFacing * 0.7 + 0.3);

      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `
};

