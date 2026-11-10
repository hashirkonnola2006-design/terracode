/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — SOLUTIONS HERO TUNING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Tunable parameters for Earth horizon height, letter visibility,
 * camera framing, and headline positioning.
 */

export const HERO_CONFIG = {
  // Target position of Earth's horizon peak at horizontal center
  // as a fraction of hero viewport height from top (0.42 = 42% from top)
  planetTopEdgePercent: 0.42,
  planetTopEdgePercentMobile: 0.43,

  // Target visible share of H, E, A, L letters (upper 55% - 65% visible)
  visibleShareLetters: 0.60,

  // 3D Planet Group Vertical Position
  // -0.96 places the horizon peak at ~42% of hero height, cutting across lower 35-45% of letters
  planetYDesktop: -0.96,
  planetYMobile: -0.92,

  // Planet Scale & Camera Z (preserving close-up cropped feel)
  planetScaleDesktop: 1.22,
  planetScaleMobile: 1.18,
  cameraZDesktop: 2.18,
  cameraZMobile: 2.22,
  cameraFov: 40,
  rotationSpeed: 0.0055,

  // HEAL Typography Fine Positioning
  healTopOffsetDesktop: 'pt-8 sm:pt-10 md:pt-6',
  healTopOffsetMobile: 'pt-8',
  healFontSize: 'text-[34vw] sm:text-[32vw] md:text-[28vw]',

  // Headline ("Broken planet. Your move.") and Caption Positioning
  headlineBottomDesktop: 'bottom-7 sm:bottom-10 md:bottom-12',
  headlineLeftDesktop: 'left-6 sm:left-10 md:left-14 lg:left-16',
};

export default HERO_CONFIG;
