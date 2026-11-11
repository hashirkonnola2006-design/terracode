/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — SOLUTIONS HERO TUNING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Tunable parameters for Earth horizon height, letter visibility,
 * camera framing, floating debris, and headline positioning.
 */

export const HERO_CONFIG = {
  // Target position of Earth's horizon peak at horizontal center
  // 0.56 places the horizon peak ~56% from top, leaving upper 60-65% of HEAL clearly visible
  planetTopEdgePercent: 0.56,
  planetTopEdgePercentMobile: 0.58,

  // 3D Planet Group Positioning
  // Shifted slightly right (X = 0.16) and down (Y = -1.44) so left text area stays clean
  planetYDesktop: -1.44,
  planetXDesktop: 0.16,
  planetYMobile: -1.28,
  planetXMobile: 0.0,

  // Planet Scale & Camera Z (preserving close-up cinematic feel)
  planetScaleDesktop: 1.30,
  planetScaleMobile: 1.18,
  cameraZDesktop: 2.18,
  cameraZMobile: 2.25,
  cameraFov: 40,
  rotationSpeed: 0.0030, // Slow majestic auto-rotation

  // HEAL Typography Positioning
  healTopOffsetDesktop: 'pt-16 sm:pt-20 md:pt-22',
  healTopOffsetMobile: 'pt-16',
  healFontSize: 'text-[clamp(90px,23.5vw,350px)]',

  // Headline ("Broken planet. Your move.") and Action Buttons Positioning
  headlineBottomDesktop: 'bottom-10 sm:bottom-12 md:bottom-16',
  headlineLeftDesktop: 'left-6 sm:left-12 md:left-16 lg:left-20',
};

export default HERO_CONFIG;
