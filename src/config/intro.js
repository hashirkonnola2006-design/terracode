/**
 * TerraHeal — Pixel-Style Loading Screen Configuration
 *
 * All tunable parameters for the intro sequence:
 * - Timings (phase durations in milliseconds)
 * - Grid densities across desktop and mobile
 * - Logo scaling and aspect ratios
 * - Design tokens & brand colors
 * - Session storage and dev override flags
 */

export const INTRO_CONFIG = {
  // Master switch to enable or disable intro completely
  enabled: true,

  // Session storage behavior
  storage: {
    key: 'terraheal_intro_played',
    sessionOnly: true, // true: plays once per session; false: plays every reload
    urlOverrideParam: 'intro', // ?intro=1 forces intro to replay
  },

  // Sequence timings (in milliseconds from performance.now())
  timing: {
    totalDuration: 1950, // Normal completion at 1.95s (Hard cap 2300ms)
    phase1_blackHold: 150, // 0.00s - 0.15s: Solid black (#050505)
    phase2_pixelFillStart: 150, // 0.15s: Start randomized teal pixel fill
    phase2_pixelFillEnd: 800, // 0.80s: Entire screen filled with solid teal
    phase3_logoSharpenStart: 600, // 0.60s: Logo appears blocky & begins sharpening
    phase3_logoSharpenEnd: 1300, // 1.30s: Logo reaches full crisp resolution
    phase4_logoHoldEnd: 1450, // 1.30s - 1.45s: Brief hold with sharp logo
    phase5_pixelExitStart: 1450, // 1.45s: Reverse pixel dissolve begins, revealing site
    phase5_pixelExitEnd: 1950, // 1.95s: Overlay completely removed from DOM
    maxWaitExtra: 300, // Up to +300ms extra hold if assets/app still loading (hard cap 2250-2300ms)
    reducedMotionDuration: 400, // Accessibility: simple 0.4s fade out
  },

  // Number of sharpening steps between 600ms and 1300ms (~140ms per step)
  logoSteps: [
    { width: 16, endTime: 740 },
    { width: 32, endTime: 880 },
    { width: 64, endTime: 1020 },
    { width: 128, endTime: 1160 },
    { width: 'full', endTime: 1300 },
  ],

  // Block grid density (divisions across the shorter screen dimension)
  grid: {
    desktopShortSideDivisions: 32, // ~32 blocks on 900px height -> 28px/block (~32x56 blocks)
    mobileShortSideDivisions: 24, // ~24 blocks on 390px width -> 16px/block for fast mobile fill
    minBlockSize: 8,
    maxBlockSize: 48,
  },

  // Logo sizing relative to viewport width
  logo: {
    desktopWidthRatio: 0.40, // 40% of viewport width on desktop
    mobileWidthRatio: 0.70, // 70% of viewport width on mobile
    aspectRatio: 17 / 68, // Height to width ratio (17 rows by 68 cols)
    svgPath: '/terraheal-logo-intro.svg',
  },

  // Brand Color Palette (matching design tokens)
  colors: {
    bgDark: '#050505',
    brand: '#0becc2',
    brandDarker: '#0ad0ab', // 12-15% darker teal
    brandLighter: '#5df7d9', // 15% lighter teal
    white: '#ffffff',
  },

  // Device pixel ratio cap for 2D canvas performance
  maxDpr: 2,
};

export default INTRO_CONFIG;
