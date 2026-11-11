/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — PERSISTENT 3D GLOBE SCROLL KEYFRAMES CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Defines the camera / planet choreography across the story sections:
 *  - Section 0: Hero (progress = 0.00) -> close-up damaged Earth with HEAL & debris
 *  - Section 1: The Damage (progress ~ 0.22) -> slides right, scale 0.62, text on left
 *  - Section 2: Six Pillars (progress ~ 0.48) -> left negative space, scale 0.84, lava cracks clearly visible
 *  - Section 3: Your Impact (progress ~ 0.72) -> shifts right/bottom, scale 0.72, away from form
 *  - Section 4: Play Games (progress ~ 0.88) -> rises to bottom-center horizon, scale 1.25
 *  - Section 5: Footer (progress = 1.00) -> settles small at bottom-right corner, scale 0.44
 *
 * NOTE: The globe NEVER heals from scroll. Heal progress is strictly 0.0
 * unless the user earns it in the Cleanup Mission gameplay.
 */

import { AXIAL_TILT_X, AXIAL_TILT_Z } from '../components/hero3d/Earth';
import { HERO_CONFIG } from './heroSolutions';

export const DESKTOP_GLOBE_KEYFRAMES = [
  // 0. Hero (Scroll 0.00)
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
  // 1. The Damage (Scroll ~0.22)
  {
    progress: 0.22,
    posX: 0.62,       // Slides right, scale ~62%, text on left
    posY: -0.05,
    scale: 0.62,
    rotX: 0.18,
    rotZ: -0.06,
    rotYOffset: 1.55, // Mediterranean / African continent facing camera
    dim: 1.0,
    healProgress: 0.0, // Earth remains damaged
    debrisOpacity: 0.85,
  },
  // 2. Six Pillars (Scroll ~0.48)
  {
    progress: 0.48,
    posX: -0.62,      // Left negative space, curved edge & lava cracks clearly visible
    posY: -0.10,
    scale: 0.84,      // Large enough so planet is prominent
    rotX: 0.22,
    rotZ: -0.04,
    rotYOffset: 3.10,
    dim: 1.0,         // Same brightness as hero, no dark dimming
    healProgress: 0.0, // Strictly 0.0 — reading does not heal planet
    debrisOpacity: 0.0,
  },
  // 3. Your Impact (Scroll ~0.72)
  {
    progress: 0.72,
    posX: 0.60,        // Right and bottom, medium size, away from form
    posY: -0.38,
    scale: 0.72,
    rotX: 0.20,
    rotZ: -0.05,
    rotYOffset: 4.40,
    dim: 1.0,
    healProgress: 0.0, // Strictly 0.0
    debrisOpacity: 0.0,
  },
  // 4. Play Games (Scroll ~0.88)
  {
    progress: 0.88,
    posX: 0.0,        // Rises from bottom center like a horizon behind cards
    posY: -1.05,
    scale: 1.25,
    rotX: 0.30,
    rotZ: -0.06,
    rotYOffset: 5.40,
    dim: 1.0,
    healProgress: 0.0, // Real game progress in Cleanup Mission is handled separately
    debrisOpacity: 0.0,
  },
  // 5. Footer (Scroll 1.00)
  {
    progress: 1.0,
    posX: 0.68,       // Settles small in corner
    posY: -0.55,
    scale: 0.44,
    rotX: 0.20,
    rotZ: -0.06,
    rotYOffset: 6.00,
    dim: 0.85,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
];

export const MOBILE_GLOBE_KEYFRAMES = [
  // 0. Hero (Scroll 0.00)
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
  // 1. The Damage (Scroll ~0.22)
  {
    progress: 0.22,
    posX: 0.0,
    posY: -0.28,
    scale: 0.58,
    rotX: 0.18,
    rotZ: -0.06,
    rotYOffset: 1.55,
    dim: 0.75,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 2. Six Pillars (Scroll ~0.48)
  {
    progress: 0.48,
    posX: 0.0,
    posY: -0.25,
    scale: 0.60,
    rotX: 0.22,
    rotZ: -0.04,
    rotYOffset: 3.10,
    dim: 0.75,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 3. Your Impact (Scroll ~0.72)
  {
    progress: 0.72,
    posX: 0.0,
    posY: -0.30,
    scale: 0.58,
    rotX: 0.20,
    rotZ: -0.05,
    rotYOffset: 4.40,
    dim: 0.75,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 4. Play Games (Scroll ~0.88)
  {
    progress: 0.88,
    posX: 0.0,
    posY: -1.15,
    scale: 1.15,
    rotX: 0.30,
    rotZ: -0.06,
    rotYOffset: 5.40,
    dim: 1.0,
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 5. Footer (Scroll 1.00)
  {
    progress: 1.0,
    posX: 0.0,
    posY: -0.50,
    scale: 0.42,
    rotX: 0.20,
    rotZ: -0.06,
    rotYOffset: 6.00,
    dim: 0.70,
    healProgress: 0.0,
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
    healProgress: 0.0, // Strictly 0.0 across all keyframes
    debrisOpacity: Math.max(0, k1.debrisOpacity + (k2.debrisOpacity - k1.debrisOpacity) * t),
  };
}
