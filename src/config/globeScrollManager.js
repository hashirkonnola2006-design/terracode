/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — SECTION-DRIVEN GLOBE SCROLL & MOTION CONTROLLER
 * ═══════════════════════════════════════════════════════════════
 *
 * Drives the continuous 3D globe movement across the story sections using
 * GSAP ScrollTrigger with scrub and smooth interpolation.
 *
 * Story Sections:
 *   1. Hero (#hero)       -> Planet close-up with HEAL letters & debris
 *   2. The Damage (#damage) -> Slides right, scale ~62%, text on left, debris visible
 *   3. Six Pillars (#solutions) -> Left negative space, scale ~84%, text on right
 *   4. Your Impact (#impact)   -> Right and bottom, scale ~72%, away from form
 *   5. Play Games (#play)      -> Rises bottom-center like horizon, scale ~125%
 *   6. Footer (#footer)        -> Settles small in corner, scale ~44%
 *
 * NOTE: The globe NEVER heals from scrolling. Healing is strictly 0.0 unless
 * earned via real gameplay in the Cleanup Mission.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HERO_CONFIG } from './heroSolutions';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── 1. SECTION KEYFRAME CONFIGURATION (Desktop & Mobile) ──
export const GLOBE_SECTION_CONFIG = {
  hero: {
    desktop: {
      posX: HERO_CONFIG.planetXDesktop, // 0.16
      posY: HERO_CONFIG.planetYDesktop, // -1.44
      scale: HERO_CONFIG.planetScaleDesktop, // 1.30
      rotX: -0.38,
      rotZ: -0.06,
      rotYOffset: 0.0,
      dim: 1.0,
      debrisOpacity: 1.0,
    },
    mobile: {
      posX: 0.0,
      posY: HERO_CONFIG.planetYMobile, // -1.28
      scale: HERO_CONFIG.planetScaleMobile, // 1.18
      rotX: -0.38,
      rotZ: -0.06,
      rotYOffset: 0.0,
      dim: 1.0,
      debrisOpacity: 0.0,
    },
  },
  damage: {
    desktop: {
      posX: 0.62,
      posY: -0.05,
      scale: 0.62, // Scaled to ~60%
      rotX: 0.18,
      rotZ: -0.06,
      rotYOffset: 1.55, // African / Mediterranean continent facing camera
      dim: 1.0,
      debrisOpacity: 0.85, // Debris visible in damage, fades before pillars
    },
    mobile: {
      posX: 0.0,
      posY: -0.28,
      scale: 0.58,
      rotX: 0.18,
      rotZ: -0.06,
      rotYOffset: 1.55,
      dim: 0.75,
      debrisOpacity: 0.0,
    },
  },
  pillars: {
    desktop: {
      posX: -0.62, // Left negative space, curved edge & lava cracks clearly visible
      posY: -0.10,
      scale: 0.84,
      rotX: 0.22,
      rotZ: -0.04,
      rotYOffset: 3.10, // Rotates toward Atlantic / American continents
      dim: 1.0, // Same brightness as hero, no dark dimming
      debrisOpacity: 0.0,
    },
    mobile: {
      posX: 0.0,
      posY: -0.25,
      scale: 0.60,
      rotX: 0.22,
      rotZ: -0.04,
      rotYOffset: 3.10,
      dim: 0.75,
      debrisOpacity: 0.0,
    },
  },
  impact: {
    desktop: {
      posX: 0.60, // Right and bottom, medium size, away from form
      posY: -0.38,
      scale: 0.72,
      rotX: 0.20,
      rotZ: -0.05,
      rotYOffset: 4.40,
      dim: 1.0,
      debrisOpacity: 0.0,
    },
    mobile: {
      posX: 0.0,
      posY: -0.30,
      scale: 0.58,
      rotX: 0.20,
      rotZ: -0.05,
      rotYOffset: 4.40,
      dim: 0.75,
      debrisOpacity: 0.0,
    },
  },
  play: {
    desktop: {
      posX: 0.00, // Rises from bottom center like a horizon behind cards
      posY: -1.05,
      scale: 1.25,
      rotX: 0.30,
      rotZ: -0.06,
      rotYOffset: 5.40,
      dim: 1.0,
      debrisOpacity: 0.0,
    },
    mobile: {
      posX: 0.0,
      posY: -1.15,
      scale: 1.15,
      rotX: 0.30,
      rotZ: -0.06,
      rotYOffset: 5.40,
      dim: 1.0,
      debrisOpacity: 0.0,
    },
  },
  footer: {
    desktop: {
      posX: 0.68, // Settles small in corner
      posY: -0.55,
      scale: 0.44,
      rotX: 0.20,
      rotZ: -0.06,
      rotYOffset: 6.00,
      dim: 0.85,
      debrisOpacity: 0.0,
    },
    mobile: {
      posX: 0.0,
      posY: -0.50,
      scale: 0.42,
      rotX: 0.20,
      rotZ: -0.06,
      rotYOffset: 6.00,
      dim: 0.70,
      debrisOpacity: 0.0,
    },
  },
};

// ── 2. REACTIVE TARGET STATE (Read by Three.js useFrame) ──
export const globeTargetState = {
  posX: HERO_CONFIG.planetXDesktop,
  posY: HERO_CONFIG.planetYDesktop,
  scale: HERO_CONFIG.planetScaleDesktop,
  rotX: -0.38,
  rotZ: -0.06,
  rotYOffset: 0.0,
  dim: 1.0,
  debrisOpacity: 1.0,
};

// Smooth power2.inOut ease curve
function power2InOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function interpolateKeys(out, a, b, rawT) {
  const t = power2InOut(Math.min(Math.max(rawT, 0), 1));
  out.posX = a.posX + (b.posX - a.posX) * t;
  out.posY = a.posY + (b.posY - a.posY) * t;
  out.scale = a.scale + (b.scale - a.scale) * t;
  out.rotX = a.rotX + (b.rotX - a.rotX) * t;
  out.rotZ = a.rotZ + (b.rotZ - a.rotZ) * t;
  out.rotYOffset = a.rotYOffset + (b.rotYOffset - a.rotYOffset) * t;
  out.dim = a.dim + (b.dim - a.dim) * t;
  out.debrisOpacity = Math.max(0, a.debrisOpacity + (b.debrisOpacity - a.debrisOpacity) * t);
}

let activeTriggers = [];

/**
 * Initialize GSAP ScrollTriggers connecting each adjacent section pair
 */
export function initGlobeScrollTriggers(isMobile = false) {
  if (typeof window === 'undefined') return () => {};

  // Clean up any existing triggers
  activeTriggers.forEach((st) => st.kill());
  activeTriggers = [];

  const initialKey = isMobile ? 'mobile' : 'desktop';
  Object.assign(globeTargetState, GLOBE_SECTION_CONFIG.hero[initialKey]);

  const transitions = [
    { fromKey: 'hero', toKey: 'damage', fromId: 'hero', toId: 'damage' },
    { fromKey: 'damage', toKey: 'pillars', fromId: 'damage', toId: 'solutions' },
    { fromKey: 'pillars', toKey: 'impact', fromId: 'solutions', toId: 'impact' },
    { fromKey: 'impact', toKey: 'play', fromId: 'impact', toId: 'play' },
    { fromKey: 'play', toKey: 'footer', fromId: 'play', toId: 'footer' },
  ];

  transitions.forEach(({ fromKey, toKey, fromId, toId }) => {
    const fromEl = document.getElementById(fromId) || (fromId === 'hero' ? document.body : null);
    const toEl = document.getElementById(toId) || (toId === 'footer' ? document.querySelector('footer') : null);

    if (!toEl) return;

    const fromConf = GLOBE_SECTION_CONFIG[fromKey][initialKey];
    const toConf = GLOBE_SECTION_CONFIG[toKey][initialKey];

    const trigger = ScrollTrigger.create({
      trigger: fromEl,
      start: fromId === 'hero' ? 'top top' : 'top top',
      endTrigger: toEl,
      end: 'top top',
      scrub: 0.5,
      onUpdate: (self) => {
        interpolateKeys(globeTargetState, fromConf, toConf, self.progress);
      },
    });

    activeTriggers.push(trigger);
  });

  // Return teardown function
  return () => {
    activeTriggers.forEach((st) => st.kill());
    activeTriggers = [];
  };
}

/**
 * Explicit refresh trigger for when fonts, images, or accordions change height
 */
export function refreshGlobeScrollTriggers() {
  if (typeof window !== 'undefined' && ScrollTrigger) {
    ScrollTrigger.refresh();
  }
}
