import React from 'react';
import { EffectComposer, Bloom, Vignette, DepthOfField, Noise } from '@react-three/postprocessing';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Post-Processing Effects)
// ═══════════════════════════════════════════════════════════════
export const BLOOM_INTENSITY = 1.10;          // Cinematic glow on sun core, flare & beacon stars
export const BLOOM_THRESHOLD = 0.90;          // Cutoff luminance for bloom trigger (only sun & beacon stars bloom)
export const BLOOM_SMOOTHING = 0.15;
export const VIGNETTE_DARKNESS = 0.65;        // Subtle perimeter vignette
export const VIGNETTE_OFFSET = 0.22;
export const DOF_BOKEH_SCALE = 1.60;          // Soft bokeh blur on foreground bottle
export const NOISE_OPACITY = 0.014;           // Micro film grain

export const Effects = ({ isLowEnd = false }) => {
  return (
    <EffectComposer multisampling={isLowEnd ? 0 : 4}>
      {/* 1. Cinematic Bloom for Sun, Flares, and Ozone Rim */}
      <Bloom
        intensity={isLowEnd ? BLOOM_INTENSITY * 0.5 : BLOOM_INTENSITY}
        luminanceThreshold={BLOOM_THRESHOLD}
        luminanceSmoothing={BLOOM_SMOOTHING}
        mipmapBlur
      />

      {/* 2. Depth of field (Earth at origin stays razor sharp, foreground objects blur) */}
      {!isLowEnd && (
        <DepthOfField
          target={[0, 0, 0]}
          focalLength={0.042}
          bokehScale={DOF_BOKEH_SCALE}
          height={480}
        />
      )}

      {/* 3. Outer Edge Vignette Falloff */}
      <Vignette
        eskil={false}
        offset={VIGNETTE_OFFSET}
        darkness={VIGNETTE_DARKNESS}
      />

      {/* 4. Cinematic film grain */}
      <Noise opacity={NOISE_OPACITY} />
    </EffectComposer>
  );
};
