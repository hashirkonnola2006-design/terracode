import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { Smog } from '../components/hero3d/Smog';
import { FloatingDebris, ForegroundDebris } from '../components/hero3d/FloatingDebris';
import { Effects } from '../components/hero3d/Effects';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { useIntroStatus } from '../components/intro/useIntroStatus';
import { navigateWithTransition } from '../utils/navigation';

// Camera & Earth target values per discrete beat
const BEAT_CAMERA_TARGETS = [
  { camZ: 3.65, earthFactor: 1.0, earthY: 0.0 },    // Beat 0: Hero (Earth on right x=1.35, camZ=3.65)
  { camZ: 3.25, earthFactor: 0.7, earthY: 0.0 },    // Beat 1: Plastic Crisis (earth moves inward)
  { camZ: 2.85, earthFactor: 0.35, earthY: 0.0 },   // Beat 2: Forests & Air (earth moves inward)
  { camZ: 2.85, earthFactor: 0.0, earthY: -0.24 },  // Beat 3: Centered, 22% smaller Earth, centered lower so heading is clear!
];

// Discrete story beats configuration
const BEATS_DATA = [
  {
    id: 0,
    eyebrow: 'A CLEANER PLANET. A BRIGHTER TOMORROW.',
    eyebrowColor: 'text-white/70',
    headline: (
      <>
        Our <span className="text-[#0becc2]">Earth</span>
        <br />
        is Drowning
      </>
    ),
    body: "Plastic, pollution and human waste are choking our home. It's time to act.",
  },
  {
    id: 1,
    eyebrow: 'GLOBAL CRISIS REPORT',
    eyebrowColor: 'text-red-400',
    headline: 'Millions of tonnes of plastic reach our oceans every year.',
    source: 'Over 14 million tonnes per year — IUCN 2024',
  },
  {
    id: 2,
    eyebrow: 'ATMOSPHERE & FORESTS',
    eyebrowColor: 'text-amber-400',
    headline: 'Forests shrink. The air gets heavier.',
    body: 'Over 10 million hectares of forest are destroyed every year. Carbon suffocates our atmosphere and natural ecosystems teeter on the brink.',
    source: 'Global Forest Resources Assessment — FAO 2024',
  },
  {
    id: 3,
    eyebrow: "THE PLANET CAN'T WAIT",
    eyebrowColor: 'text-white/70',
    headline: (
      <>
        Heal it with<br />your own hands.
      </>
    ),
  },
];

// Compute activeBeat with 2% hysteresis to eliminate edge flicker
const computeActiveBeat = (progress, prevBeat) => {
  const H = 0.02; // 2% hysteresis

  // Direct jumps if more than 1 beat away
  if (progress >= 0.80 + H) return 3;
  if (progress < 0.25 - H) return 0;

  // Single step transitions with hysteresis
  if (prevBeat === 0) {
    return progress >= 0.25 + H ? 1 : 0;
  }
  if (prevBeat === 1) {
    if (progress < 0.25 - H) return 0;
    if (progress >= 0.55 + H) return 2;
    return 1;
  }
  if (prevBeat === 2) {
    if (progress < 0.55 - H) return 1;
    if (progress >= 0.80 + H) return 3;
    return 2;
  }
  if (prevBeat === 3) {
    return progress < 0.80 - H ? 2 : 3;
  }
  return 0;
};

const LandingSceneController = ({
  scrollProgressRef,
  activeBeat,
  isTransitioning,
  mousePos,
  isBtnHovered,
}) => {
  const earthGroupRef = useRef(null);
  const smoothScrollRef = useRef(0);
  const currentCamZ = useRef(3.65);
  const currentEarthPos = useRef(new THREE.Vector3(1.35, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const { viewport, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const isPortrait = aspect < 1.05;
  const isMobile = size.width < 768 || isPortrait;

  // Responsive Earth scale: desktop remains 0.72; mobile/portrait scales proportionally to fit viewport width
  const responsiveEarthScale = isMobile
    ? Math.min(0.72, 0.72 * Math.max(0.55, aspect / 0.85))
    : 0.72;

  useFrame((state, delta) => {
    const rawProgress = scrollProgressRef ? scrollProgressRef.current : 0;
    // Single smoothed scroll progress (smoothed once for all scene objects)
    smoothScrollRef.current = THREE.MathUtils.lerp(
      smoothScrollRef.current,
      rawProgress,
      Math.min(delta * 7.5, 1.0)
    );
    const sp = smoothScrollRef.current;

    // Continuous keyframed interpolation from single smoothed progress
    let targetZ, targetEarthX, targetEarthY, escalation;

    if (sp <= 0.33) {
      const u = sp / 0.33;
      targetZ = THREE.MathUtils.lerp(3.65, 3.25, u);
      targetEarthX = isMobile ? 0.0 : THREE.MathUtils.lerp(1.35, 0.95, u);
      targetEarthY = isMobile ? THREE.MathUtils.lerp(-0.45, -0.35, u) : 0.0;
      escalation = THREE.MathUtils.lerp(0.35, 0.60, u);
    } else if (sp <= 0.66) {
      const u = (sp - 0.33) / 0.33;
      targetZ = THREE.MathUtils.lerp(3.25, 2.85, u);
      targetEarthX = isMobile ? 0.0 : THREE.MathUtils.lerp(0.95, 0.47, u);
      targetEarthY = isMobile ? THREE.MathUtils.lerp(-0.35, -0.25, u) : 0.0;
      escalation = THREE.MathUtils.lerp(0.60, 0.85, u);
    } else {
      const u = (sp - 0.66) / 0.34;
      targetZ = 2.85;
      targetEarthX = isMobile ? 0.0 : THREE.MathUtils.lerp(0.47, 0.0, u);
      targetEarthY = isMobile ? THREE.MathUtils.lerp(-0.25, -0.16, u) : THREE.MathUtils.lerp(0.0, -0.24, u);
      escalation = THREE.MathUtils.lerp(0.85, 1.0, u);
    }

    if (isTransitioning) {
      targetZ = 1.45;
    }

    state.camera.position.z = targetZ;
    currentEarthPos.current.set(targetEarthX, targetEarthY, 0);

    if (earthGroupRef.current) {
      earthGroupRef.current.position.set(targetEarthX, targetEarthY, 0);
      earthGroupRef.current.scale.set(responsiveEarthScale, responsiveEarthScale, responsiveEarthScale);
      earthGroupRef.current.rotation.y += delta * 0.015;
    }

    // Gentle camera look offset to balance Earth composition
    const targetLookX = targetEarthX * 0.15;
    const targetLookY = targetEarthY * 0.2;
    currentLookAt.current.set(targetLookX, targetLookY, 0);
    state.camera.lookAt(targetLookX, targetLookY, 0);
  });

  return (
    <>
      <SpaceBackground
        mousePos={mousePos}
        reducedMotion={false}
        isFinalBeat={activeBeat === 3}
        hover={0.0}
      />

      {/* Sun key lighting (healProgress = 0, camera following) */}
      <Sun healProgress={0} isLowEnd={false} />

      {/* Synchronous World Transform Group (Earth + Clouds + Atmosphere + Smog + Trash all in same group) */}
      <group ref={earthGroupRef} scale={responsiveEarthScale}>
        <Earth
          pollution={1.0}
          healProgress={0}
          dim={activeBeat === 3 ? 0.88 : 1.0}
          hover={0.0}
        />
        <Clouds pollution={1.0} healProgress={0} />
        <Atmosphere pollution={1.0} healProgress={0} />
        <Smog
          pollution={1.0}
          escalation={activeBeat >= 3 ? 1.0 : activeBeat >= 2 ? 0.85 : activeBeat >= 1 ? 0.65 : 0.40}
        />
        <FloatingDebris
          pollution={1.0}
          healProgress={0}
        />
      </group>

      {/* Cinematic Foreground Debris framing the camera viewport (matches reference mockup) */}
      <ForegroundDebris
        pollution={1.0}
        healProgress={0}
        isFinalBeat={activeBeat === 3}
      />
    </>
  );
};

export const Landing = () => {
  const navigate = useNavigate();
  const [activeBeat, setActiveBeat] = useState(0);
  const scrollProgressRef = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  // Sync hero entrance with PixelIntroLoader exit (~1.45s)
  const { isIntroActive, isIntroExiting } = useIntroStatus();
  const heroEntered = !isIntroActive || isIntroExiting;

  // Enable snap scrolling on html / body while on the Landing intro
  useEffect(() => {
    document.documentElement.classList.add('intro-snap');
    document.body.classList.add('intro-snap');
    return () => {
      document.documentElement.classList.remove('intro-snap');
      document.body.classList.remove('intro-snap');
    };
  }, []);

  // Mouse parallax listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll listener computing discrete activeBeat with hysteresis
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      scrollProgressRef.current = progress;
      setActiveBeat((prevBeat) => computeActiveBeat(progress, prevBeat));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth jump to any discrete beat
  const goToBeat = (beatIndex) => {
    const index = Math.max(0, Math.min(3, beatIndex));
    const targetY = index * window.innerHeight;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation: ArrowDown / PageDown / Space (next beat), ArrowUp / PageUp (prev beat)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        setActiveBeat((curr) => {
          const next = Math.min(curr + 1, 3);
          goToBeat(next);
          return curr;
        });
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        setActiveBeat((curr) => {
          const prev = Math.max(curr - 1, 0);
          goToBeat(prev);
          return curr;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartCleaning = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setScreenFlash(true);
    navigateWithTransition('/solutions', navigate);
    setTimeout(() => {
      setIsTransitioning(false);
      setScreenFlash(false);
    }, 2000);
  };

  useEffect(() => {
    document.title = 'TerraHeal | Heal the Planet by Playing';
  }, []);

  const currentBeatData = BEATS_DATA[activeBeat] || BEATS_DATA[0];
  const VIGNETTE_DENSITY = [0.52, 0.58, 0.64, 0.72];
  const vignetteDarkness = VIGNETTE_DENSITY[activeBeat] || 0.52;

  return (
    <div className="relative bg-[#050505] text-white selection:bg-[#0becc2] selection:text-black">
      
      {/* ── 4 Snap Sections (Total length = 4 x 100vh) ── */}
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />

      {/* ── Transparent Fixed Header ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 md:px-12 py-3.5 sm:py-6 transition-all duration-500 pointer-events-auto ${
          heroEntered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
        style={{
          opacity: isTransitioning ? 0 : heroEntered ? 1 : 0,
          transform: isTransitioning
            ? 'translateY(-20px)'
            : heroEntered
            ? 'translateY(0)'
            : 'translateY(-12px)',
        }}
      >
        {/* Left: TerraHeal Brand Logo (70% opacity on Beat 3) */}
        <div
          className={`select-none transition-opacity duration-150 ${
            activeBeat === 3 ? 'opacity-70' : 'opacity-100'
          }`}
        >
          <TerraHealLogo markSize={28} textClass="text-lg sm:text-xl font-bold" onClick={() => goToBeat(0)} />
        </div>

        {/* Right: Nav items + Take Action pill (Fades out completely in 150ms on Beat 3) */}
        <div
          className="flex items-center gap-4 sm:gap-6 md:gap-8 transition-opacity duration-150"
          style={{
            opacity: activeBeat === 3 ? 0 : 1,
            pointerEvents: activeBeat === 3 ? 'none' : 'auto',
          }}
        >
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => goToBeat(1)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 1 ? 'text-[#0becc2]' : 'text-white/70 hover:text-[#0becc2]'
              }`}
            >
              About
            </button>
            <button
              onClick={() => goToBeat(2)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 2 ? 'text-[#0becc2]' : 'text-white/70 hover:text-[#0becc2]'
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => goToBeat(3)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 3 ? 'text-[#0becc2]' : 'text-white/70 hover:text-[#0becc2]'
              }`}
            >
              Solutions
            </button>
          </nav>
          
          <button
            onClick={handleStartCleaning}
            className="btn-aerospace-secondary text-[11px] sm:text-[12px] py-1.5 px-3 sm:py-2 sm:px-4"
          >
            <span>Take Action</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Fixed Fullscreen 3D Canvas Layer ── */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <Canvas
          camera={{ position: [0, 0, 3.65], fov: 40 }}
          dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
          shadows
        >
          <Suspense fallback={null}>
            <LandingSceneController
              scrollProgressRef={scrollProgressRef}
              activeBeat={activeBeat}
              isTransitioning={isTransitioning}
              mousePos={mousePos}
              isBtnHovered={isBtnHovered}
            />
            <Effects isLowEnd={false} />
          </Suspense>
        </Canvas>

        {/* 1. Soft Dark Gradient behind Left Text Block (Slides 1-3, Beats 0-2) */}
        <div
          className="absolute inset-y-0 left-0 w-full md:w-3/5 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: activeBeat < 3 ? 1 : 0,
            background: 'linear-gradient(to right, rgba(0, 0, 0, 0.70) 0%, rgba(0, 0, 0, 0.50) 30%, rgba(0, 0, 0, 0.20) 60%, transparent 80%)',
          }}
        />

        {/* 1b. Mobile Top Contrast Scrim for Text Readability on Beats 0-2 */}
        <div
          className="absolute inset-x-0 top-0 h-3/5 pointer-events-none sm:hidden transition-opacity duration-300"
          style={{
            opacity: activeBeat < 3 ? 1 : 0,
            background: 'linear-gradient(to bottom, rgba(3, 7, 18, 0.75) 0%, rgba(3, 7, 18, 0.45) 55%, transparent 100%)',
          }}
        />

        {/* 2. Soft Dark Radial Scrim for Final Beat 3 (Centered over Earth, transparent by ~45% viewport width) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: activeBeat === 3 ? 1 : 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.28) 30%, transparent 55%)',
          }}
        />

        {/* Dynamic Pollution Vignette & Contrast Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(3, 7, 18, ${vignetteDarkness}) 100%)`,
          }}
        />

        {/* Click Transition Radial Green Flash */}
        {screenFlash && (
          <div className="absolute inset-0 z-50 bg-gradient-radial from-[#0becc2] to-[#0ad0ab] animate-out fade-out duration-700 pointer-events-none" />
        )}
      </div>

      {/* ── Foreground Text & Action Layer (Fixed in Viewport) ── */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-8 md:p-12 lg:p-16">
        
        {/* Spacer for fixed header */}
        <div className="h-12 sm:h-16" />

        {/* ── Content Stage ── */}
        {activeBeat === 3 ? (
          /* ── FINAL BEAT 3: Centered Cinematic Composition ── */
          <div
            key="beat-3"
            className="final-beat-unit w-full max-w-3xl mx-auto my-auto text-center flex flex-col items-center justify-center pointer-events-auto px-4"
          >
            {/* a) Eyebrow: 14px, uppercase, letter-spacing 0.3em, white at 70% opacity */}
            <p className="font-label uppercase text-[12px] sm:text-[14px] tracking-[0.22em] sm:tracking-[0.3em] text-white/70 mb-3 sm:mb-5 block text-center">
              THE PLANET CAN'T WAIT
            </p>

            {/* b) Headline: two lines max, centered, heavy geometric sans (display font, weight 800), white, clamp(2.5rem, 6vw, 5.5rem), line-height 1.0 */}
            <h1 className="font-display font-extrabold text-[clamp(1.85rem,5.5vw,4.5rem)] sm:text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] sm:leading-[1.0] text-white text-center drop-shadow-2xl mb-6 sm:mb-10 max-w-2xl mx-auto tracking-[-0.02em]">
              Heal it with<br />your own hands.
            </h1>

            {/* c) The Button: bright green, tight glow around button only (no spill over Earth) */}
            <div className="relative flex items-center justify-center my-2 w-full max-w-xs sm:max-w-none">
              {/* Main Glowing Brand Pill Button */}
              <button
                onClick={handleStartCleaning}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                disabled={isTransitioning}
                className="relative group overflow-hidden flex items-center justify-center gap-3 sm:gap-4 min-h-[58px] sm:min-h-[72px] w-full sm:w-auto sm:min-w-[340px] px-6 sm:px-10 py-3.5 sm:py-5 rounded-full bg-gradient-to-r from-[#0becc2] to-[#0ad0ab] text-[#050505] font-bold text-base sm:text-lg tracking-[0.06em] uppercase hover:scale-[1.04] active:scale-[0.97] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-white select-none z-10"
                style={{
                  boxShadow: isBtnHovered
                    ? 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.90), 0 0 24px rgba(11, 236, 194, 0.65), 0 4px 14px rgba(0, 0, 0, 0.4)'
                    : 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.75), 0 0 16px rgba(11, 236, 194, 0.45), 0 4px 10px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Light shine sweep across button every 4s */}
                <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent btn-shine pointer-events-none" />

                {/* Sparkle Icon */}
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#050505] shrink-0" />

                {/* Label */}
                <span className="font-extrabold text-[14px] sm:text-base tracking-[0.06em]">
                  START CLEANING
                </span>

                {/* Arrow Icon */}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#050505] shrink-0 arrow-nudge group-hover:translate-x-2 transition-transform duration-200" />
              </button>
            </div>

            {/* d) Micro-copy: 15px, white at 80% opacity */}
            <p className="mt-3.5 sm:mt-5 text-[13px] sm:text-[15px] font-body font-light text-white/80 tracking-wide text-center">
              4 missions. About 3 minutes. No sign-up.
            </p>

          </div>
        ) : (
          /* ── BEATS 0, 1, 2: Left Column Stage ── */
          <div
            className={`relative w-full max-w-xl md:max-w-2xl my-auto text-left pointer-events-auto transition-all duration-500 ${
              heroEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <div key={activeBeat} className="beat-unit">
              
              {/* Eyebrow */}
              <p className={`font-label uppercase text-[11px] sm:text-[12px] sm:text-[13px] tracking-[0.25em] sm:tracking-[0.3em] ${currentBeatData.eyebrowColor} mb-2.5 sm:mb-4 block`}>
                {currentBeatData.eyebrow}
              </p>

              {/* Headline */}
              <h1 className="font-display font-extrabold text-[clamp(1.75rem,5.5vw,4.5rem)] sm:text-[clamp(2.5rem,7vw,6.5rem)] leading-[1.02] sm:leading-[0.95] tracking-[-0.02em] text-white mb-4 sm:mb-6 drop-shadow-2xl">
                {currentBeatData.headline}
              </h1>

              {/* Body Text */}
              {currentBeatData.body && (
                <p
                  className="font-body font-normal text-[15px] sm:text-[18px] md:text-[20px] leading-[1.5] sm:leading-[1.6] text-gray-200 mb-5 sm:mb-8 max-w-[46ch]"
                  style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.90), 0 2px 10px rgba(0, 0, 0, 0.65)' }}
                >
                  {currentBeatData.body}
                </p>
              )}

              {/* Sourced Data Line */}
              {currentBeatData.source && (
                <p
                  className="font-mono text-[11px] sm:text-xs md:text-sm text-gray-300 tracking-wider mb-4 sm:mb-8"
                  style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.85)' }}
                >
                  {currentBeatData.source}
                </p>
              )}

            </div>
          </div>
        )}

        {/* ── Bottom Bar: Hidden completely on Beat 3; Visible on Beats 0-2 ── */}
        <div
          className={`relative w-full flex items-center justify-between pointer-events-auto transition-all duration-500 ${
            heroEntered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            opacity: activeBeat === 3 ? 0 : heroEntered ? 1 : 0,
            pointerEvents: activeBeat === 3 ? 'none' : 'auto',
          }}
        >
          {/* Bottom Left: Beat Pagination Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((b) => (
              <button
                key={b}
                onClick={() => goToBeat(b)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  b === activeBeat ? 'w-6 bg-[#0becc2]' : 'w-1.5 bg-white/20 hover:bg-white/50'
                }`}
                aria-label={`Jump to story beat ${b + 1}`}
              />
            ))}
            <span className="font-mono text-xs text-white/40 ml-1.5 tracking-wider">
              0{activeBeat + 1} / 03
            </span>
          </div>

          {/* Bottom Center: Minimal Mouse Scroll Indicator */}
          <div
            onClick={() => goToBeat(Math.min(activeBeat + 1, 3))}
            className="hidden sm:flex items-center justify-center gap-3 transition-opacity duration-300 cursor-pointer"
            title="Scroll or click to advance"
          >
            <div className="w-12 h-px bg-white/15" />
            <div className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1.5">
              <div className="w-1 h-2 rounded-full bg-white/70 animate-bounce" />
            </div>
            <div className="w-12 h-px bg-white/15" />
          </div>

          {/* Bottom Right Spacer (balances pagination dots so scroll indicator remains centered) */}
          <div className="w-24" />

        </div>

      </div>

    </div>
  );
};

export default Landing;
