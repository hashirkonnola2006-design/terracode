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

  // Sequence timings (in milliseconds of virtual animation time)
  timing: {
    // Initial entry sequence (when opening site for first time)
    initial: {
      blackHold: 80,
      fillStart: 80,
      fillEnd: 600,
      sharpenStart: 460,
      sharpenEnd: 980,
      holdEnd: 1150,
      exitDuration: 450,
      maxWaitExtra: 1000,
    },
    // Page transition sequence (between routes: e.g. /solutions to /clean)
    transition: {
      blackHold: 0, // Zero black frame: dissolves directly over current page!
      fillStart: 0,
      fillEnd: 480, // Solid teal screen in ~480ms
      sharpenStart: 320,
      sharpenEnd: 760,
      holdEnd: 920,
      exitDuration: 420,
      maxWaitExtra: 1200,
    },
    reducedMotionDuration: 350, // Accessibility: simple 0.35s fade out
  },

  // Number of sharpening steps between sharpenStart and sharpenEnd
  logoSteps: [
    { width: 16, progress: 0.20 },
    { width: 32, progress: 0.40 },
    { width: 64, progress: 0.65 },
    { width: 128, progress: 0.85 },
    { width: 580, progress: 1.00 },
  ],

  // Block grid density (divisions across the shorter screen dimension)
  grid: {
    desktopShortSideDivisions: 36, // ~36 blocks on 900px height -> 25px/block
    mobileShortSideDivisions: 24, // ~24 blocks on 390px width -> 16px/block
    minBlockSize: 10,
    maxBlockSize: 40,
  },

  // Logo sizing relative to viewport width
  logo: {
    desktopWidthRatio: 0.40, // 40% of viewport width on desktop
    mobileWidthRatio: 0.72, // 72% of viewport width on mobile
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

  // Device pixel ratio cap for 2D canvas performance (1.0 = razor-sharp pixel blocks, 4x fill-rate speed)
  maxDpr: 1.0,
};

export default INTRO_CONFIG;
