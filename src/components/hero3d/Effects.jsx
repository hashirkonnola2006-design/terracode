import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (Post-Processing Effects)
// ═══════════════════════════════════════════════════════════════
export const BLOOM_INTENSITY = 0.22;          // Gentle bloom on atmosphere rim & bright stars only
export const BLOOM_THRESHOLD = 0.92;          // High cutoff so Earth terrain stays razor sharp
export const BLOOM_SMOOTHING = 0.10;
export const VIGNETTE_DARKNESS = 0.58;        // Soft edge vignette
export const VIGNETTE_OFFSET = 0.25;
export const NOISE_OPACITY = 0.012;           // Subtle film grain

export const Effects = ({ isLowEnd = false }) => {
  if (isLowEnd) return null;

  return (
    <EffectComposer multisampling={4}>
      {/* 1. Gentle Bloom: atmosphere rim and bright star beacons only */}
      <Bloom
        intensity={BLOOM_INTENSITY}
        luminanceThreshold={BLOOM_THRESHOLD}
        luminanceSmoothing={BLOOM_SMOOTHING}
        mipmapBlur
      />

      {/* 2. Outer Edge Vignette */}
      <Vignette
        eskil={false}
        offset={VIGNETTE_OFFSET}
        darkness={VIGNETTE_DARKNESS}
      />

      {/* 3. Subtle Film Grain */}
      <Noise opacity={NOISE_OPACITY} />
    </EffectComposer>
  );
};

export default Effects;
