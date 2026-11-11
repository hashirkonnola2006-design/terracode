/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — PERSISTENT 3D GLOBE SCROLL KEYFRAMES CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Defines the camera / planet choreography across the new story flow:
 *  - Section 0: Hero (progress = 0.00) -> close-up damaged Earth with HEAL & orbiting debris
 *  - Section 1: The Damage (progress ~ 0.22) -> slides right, scale 0.76, scorched continents & cracks, heal 0.0
 *  - Section 2: Six Pillars (progress ~ 0.48) -> drifts left, scale 0.72, heals 0.0 to 0.60 as rows are read
 *  - Section 3: Your Impact (progress ~ 0.72) -> shifts right/bottom, scale 0.78, heal reflects user answers (~0.60-0.80)
 *  - Section 4: Play Games (progress ~ 0.88) -> rises to bottom-center horizon (scale 1.32), linked to game health
 *  - Section 5: Footer (progress = 1.00) -> settles small at bottom-right corner and dims slightly
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
    posX: 0.85,       // Pushed cleanly into the right negative space; left 60% is pure reading space
    posY: -0.05,      // Centered vertically in viewport
    scale: 0.70,      // Scaled down so Earth completely clears the text column
    rotX: 0.20,
    rotZ: -0.06,
    rotYOffset: 1.45, // Showcases cracked Mediterranean / Sahara continent
    dim: 0.95,
    healProgress: 0.0, // Earth remains damaged in The Damage section
    debrisOpacity: 0.0,
  },
  // 2. Six Pillars (Scroll ~0.48)
  {
    progress: 0.48,
    posX: -0.86,      // Placed in far left negative space, away from right-column stacked rows
    posY: -0.22,      // Lower horizon framing the sticky column
    scale: 0.68,
    rotX: 0.28,
    rotZ: -0.02,
    rotYOffset: 2.85, // Rotates toward Atlantic / American continents
    dim: 1.0,
    healProgress: 0.45, // Progressive healing while reading pillars
    debrisOpacity: 0.0,
  },
  // 3. Your Impact (Scroll ~0.72)
  {
    progress: 0.72,
    posX: 0.0,        // Lower horizon between columns, does not obstruct question options or card
    posY: -1.05,
    scale: 1.12,
    rotX: 0.24,
    rotZ: -0.05,
    rotYOffset: 4.10, // Pacific rim rotating into view
    dim: 0.90,
    healProgress: 0.65, // Base impact heal, blended with user's choices
    debrisOpacity: 0.0,
  },
  // 4. Play Games (Scroll ~0.88)
  {
    progress: 0.88,
    posX: 0.0,        // Bottom center horizon
    posY: -1.22,      // Planet horizon rising behind "Play to heal the planet"
    scale: 1.32,      // Scales up again as cinematic curved horizon
    rotX: 0.32,
    rotZ: AXIAL_TILT_Z,
    rotYOffset: 5.20, // Continues rotation
    dim: 1.0,
    healProgress: 0.65,
    debrisOpacity: 0.0,
  },
  // 5. Footer (Scroll 1.00)
  {
    progress: 1.0,
    posX: 0.54,       // Settles small at bottom/corner
    posY: -0.58,
    scale: 0.58,
    rotX: 0.20,
    rotZ: -0.08,
    rotYOffset: 5.80,
    dim: 0.65,        // Dims slightly
    healProgress: 0.65,
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
    posY: -0.35,
    scale: 0.60,
    rotX: 0.20,
    rotZ: -0.06,
    rotYOffset: 1.45,
    dim: 0.70,        // Extra dimmed on mobile so single-column text stays 100% legible
    healProgress: 0.0,
    debrisOpacity: 0.0,
  },
  // 2. Six Pillars (Scroll ~0.48)
  {
    progress: 0.48,
    posX: 0.0,
    posY: -0.30,
    scale: 0.56,
    rotX: 0.28,
    rotZ: -0.02,
    rotYOffset: 2.85,
    dim: 0.70,
    healProgress: 0.45,
    debrisOpacity: 0.0,
  },
  // 3. Your Impact (Scroll ~0.72)
  {
    progress: 0.72,
    posX: 0.0,
    posY: -0.32,
    scale: 0.58,
    rotX: 0.24,
    rotZ: -0.05,
    rotYOffset: 4.10,
    dim: 0.70,
    healProgress: 0.65,
    debrisOpacity: 0.0,
  },
  // 4. Play Games (Scroll ~0.88)
  {
    progress: 0.88,
    posX: 0.0,
    posY: -1.15,
    scale: 1.15,
    rotX: 0.32,
    rotZ: AXIAL_TILT_Z,
    rotYOffset: 5.20,
    dim: 0.90,
    healProgress: 0.65,
    debrisOpacity: 0.0,
  },
  // 5. Footer (Scroll 1.00)
  {
    progress: 1.0,
    posX: 0.0,
    posY: -0.62,
    scale: 0.50,
    rotX: 0.20,
    rotZ: -0.08,
    rotYOffset: 5.80,
    dim: 0.60,
    healProgress: 0.65,
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
