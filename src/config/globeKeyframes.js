/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — PERSISTENT 3D GLOBE SCROLL KEYFRAMES CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Defines the camera / planet choreography across page sections:
 *  - Section 0: Hero (progress = 0.0) -> current close-up damaged Earth with HEAL & debris
 *  - Section 1: Hero to Pillars (progress ~ 0.25) -> slides right, scales down ~40%, rotates to new continent
 *  - Section 2: Pillars Middle (progress ~ 0.50) -> drifts left, slightly smaller, tilts, cards legible
 *  - Section 3: Pillars to Games (progress ~ 0.76) -> moves to bottom-center, scales up as rising planet horizon
 *  - Section 4: Games to Footer (progress = 1.0) -> settles small at bottom-right corner and dims slightly
 */

import { AXIAL_TILT_X, AXIAL_TILT_Z } from '../components/hero3d/Earth';
import { HERO_CONFIG } from './heroSolutions';

export const DESKTOP_GLOBE_KEYFRAMES = [
  // 0. Hero (Scroll 0)
  {
    progress: 0.0,
    posX: HERO_CONFIG.planetXDesktop, // 0.16
    posY: HERO_CONFIG.planetYDesktop, // -1.44
    scale: HERO_CONFIG.planetScaleDesktop, // 1.30
    rotX: -0.38,
    rotZ: -0.06,
    rotYOffset: 0.0,
    dim: 1.0,
    healProgress: 0.0,
    debrisOpacity: 1.0,
  },
  // 1. Hero to Pillars (Scroll ~0.26)
  {
    progress: 0.26,
    posX: 0.72,       // Slides to the right so left/center 3x2 card grid stays clean
    posY: -0.06,      // Centered vertically in viewport
    scale: 0.78,      // ~40% smaller than 1.30 (1.30 * 0.6 = 0.78)
    rotX: 0.22,
    rotZ: -0.06,
    rotYOffset: 1.45, // Rotates to showcase Atlantic / European / African continent
    dim: 1.0,
    healProgress: 0.25,
    debrisOpacity: 0.0,
  },
  // 2. Pillars Middle (Scroll ~0.52)
  {
    progress: 0.52,
    posX: -0.66,      // Drifts to the left side, alternating sides
    posY: 0.06,       // Slightly higher
    scale: 0.70,      // Slightly smaller
    rotX: 0.28,
    rotZ: -0.02,
    rotYOffset: 2.85, // Rotates to American continent
    dim: 0.95,
    healProgress: 0.45,
    debrisOpacity: 0.0,
  },
  // 3. Pillars to Games (Scroll ~0.76)
  {
    progress: 0.76,
    posX: 0.0,        // Bottom center
    posY: -1.22,      // Planet horizon rising behind "Play to heal the planet"
    scale: 1.32,      // Scales up again
    rotX: 0.32,
    rotZ: AXIAL_TILT_Z,
    rotYOffset: 4.20, // Pacific / Asian continent
    dim: 1.0,
    healProgress: 0.72,
    debrisOpacity: 0.0,
  },
  // 4. Games to Footer (Scroll 1.0)
  {
    progress: 1.0,
    posX: 0.54,       // Settles small at bottom/corner
    posY: -0.58,
    scale: 0.58,
    rotX: 0.20,
    rotZ: -0.08,
    rotYOffset: 5.40,
    dim: 0.65,        // Dims slightly
    healProgress: 0.90,
    debrisOpacity: 0.0,
  },
];

export const MOBILE_GLOBE_KEYFRAMES = [
  // 0. Hero (Scroll 0)
  {
    progress: 0.0,
    posX: 0.0,
    posY: HERO_CONFIG.planetYMobile, // -1.28
    scale: HERO_CONFIG.planetScaleMobile, // 1.18
    rotX: -0.38,
    rotZ: -0.06,
    rotYOffset: 0.0,
    dim: 1.0,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 1. Hero to Pillars (Scroll ~0.26)
  {
    progress: 0.26,
    posX: 0.0,
    posY: -0.32,
    scale: 0.62,
    rotX: 0.22,
    rotZ: -0.06,
    rotYOffset: 1.45,
    dim: 0.85,
    healProgress: 0.25,
    debrisOpacity: 0.0,
  },
  // 2. Pillars Middle (Scroll ~0.52)
  {
    progress: 0.52,
    posX: 0.0,
    posY: 0.18,
    scale: 0.55,
    rotX: 0.28,
    rotZ: -0.02,
    rotYOffset: 2.85,
    dim: 0.80,
    healProgress: 0.45,
    debrisOpacity: 0.0,
  },
  // 3. Pillars to Games (Scroll ~0.76)
  {
    progress: 0.76,
    posX: 0.0,
    posY: -1.15,
    scale: 1.15,
    rotX: 0.32,
    rotZ: AXIAL_TILT_Z,
    rotYOffset: 4.20,
    dim: 0.95,
    healProgress: 0.72,
    debrisOpacity: 0.0,
  },
  // 4. Games to Footer (Scroll 1.0)
  {
    progress: 1.0,
    posX: 0.0,
    posY: -0.45,
    scale: 0.50,
    rotX: 0.20,
    rotZ: -0.08,
    rotYOffset: 5.40,
    dim: 0.50,
    healProgress: 0.90,
    debrisOpacity: 0.0,
  },
];

/**
 * Smooth quadratic easing (power2.inOut)
 */
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Interpolate state between keyframes based on normalized scroll progress (0..1)
 */
export function interpolateGlobeKeyframes(progress, isMobile = false) {
  const p = Math.min(Math.max(progress, 0.0), 1.0);
  const keyframes = isMobile ? MOBILE_GLOBE_KEYFRAMES : DESKTOP_GLOBE_KEYFRAMES;

  let k1 = keyframes[0];
  let k2 = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].progress && p <= keyframes[i + 1].progress) {
      k1 = keyframes[i];
      k2 = keyframes[i + 1];
      break;
    }
  }

  const range = k2.progress - k1.progress;
  const rawT = range > 0.0001 ? (p - k1.progress) / range : 0;
  const t = easeInOutQuad(Math.min(Math.max(rawT, 0.0), 1.0));

  return {
    posX: k1.posX + (k2.posX - k1.posX) * t,
    posY: k1.posY + (k2.posY - k1.posY) * t,
    scale: k1.scale + (k2.scale - k1.scale) * t,
    rotX: k1.rotX + (k2.rotX - k1.rotX) * t,
    rotZ: k1.rotZ + (k2.rotZ - k1.rotZ) * t,
    rotYOffset: k1.rotYOffset + (k2.rotYOffset - k1.rotYOffset) * t,
    dim: k1.dim + (k2.dim - k1.dim) * t,
    healProgress: k1.healProgress + (k2.healProgress - k1.healProgress) * t,
    debrisOpacity: Math.max(0, k1.debrisOpacity + (k2.debrisOpacity - k1.debrisOpacity) * t),
  };
}

