/**
 * ═══════════════════════════════════════════════════════════════
 * SOFT CIRCULAR GAUSSIAN STAR SHADER
 * ═══════════════════════════════════════════════════════════════
 * Renders 6,000+ stars as crisp, delicate celestial pinpricks
 * with soft Gaussian falloff, subtle twinkling, and zero blocky pixels.
 */

export const StarShaderMaterial = {
  uniforms: {
    uTime: { value: 0.0 },
  },

  vertexShader: `
    attribute float aSize;
    attribute vec3  aColor;
    attribute float aTwinkleOffset;

    uniform float uTime;

    varying vec3  vColor;
    varying float vTwinkle;

    void main() {
      vColor = aColor;
      // Gentle twinkle: subtle pulsation
      vTwinkle = 0.82 + 0.22 * sin(uTime * 1.5 + aTwinkleOffset);

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      // Delicate pinprick scale: 1.0 - 3.0 pixels
      gl_PointSize = clamp(aSize * (60.0 / -mvPosition.z), 1.0, 3.5);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `
    varying vec3  vColor;
    varying float vTwinkle;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord) * 2.0;
      if (dist > 1.0) discard;

      // Soft Gaussian circle falloff
      float alpha = exp(-dist * dist * 3.5);
      // Bright core pinprick
      float core = exp(-dist * dist * 16.0) * 0.6;

      gl_FragColor = vec4(vColor + vec3(core), alpha * vTwinkle);
    }
  `
};
