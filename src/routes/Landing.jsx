import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { FloatingDebris } from '../components/hero3d/FloatingDebris';
import { Effects } from '../components/hero3d/Effects';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';

// Camera & Earth target values per discrete beat
const BEAT_CAMERA_TARGETS = [
  { camZ: 3.65, earthFactor: 1.0 },   // Beat 0: Hero (Earth on right x=1.35, camZ=3.65)
  { camZ: 3.25, earthFactor: 0.7 },   // Beat 1: Plastic Crisis (camZ=3.25, earth moves slightly inward)
  { camZ: 2.85, earthFactor: 0.35 },  // Beat 2: Forests & Air (camZ=2.85, earth moves more inward)
  { camZ: 2.45, earthFactor: 0.0 },   // Beat 3: Restoration Call (camZ=2.45, earth centered x=0)
];

// Discrete story beats configuration
const BEATS_DATA = [
  {
    id: 0,
    eyebrow: 'A CLEANER PLANET. A BRIGHTER TOMORROW.',
    eyebrowColor: 'text-white/70',
    headline: (
      <>
        Our <span className="text-[#4ade80]">Earth</span>
        <br />
        is Drowning
      </>
    ),
    body: "Plastic, pollution and human waste are choking our home. It's time to act.",
    button: {
      label: 'Start Cleaning',
      primary: true,
      large: false,
    },
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
    eyebrow: 'CALL TO RESTORATION',
    eyebrowColor: 'text-[#4ade80]',
    headline: 'The planet is asking for help.',
    body: 'Every piece of debris removed brings life back to our oceans and continents. You have the power to turn back the tide.',
    button: {
      label: 'Start Cleaning',
      primary: true,
      large: true,
      badge: 'Interactive Restoration Simulator',
    },
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

const LandingSceneController = ({ activeBeat, isTransitioning, mousePos }) => {
  const earthGroupRef = useRef(null);
  const currentCamZ = useRef(3.65);
  const currentEarthPos = useRef(new THREE.Vector3(1.35, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const { viewport, size } = useThree();
  const isPortrait = viewport.width < viewport.height;
  const isMobile = size.width < 768 || isPortrait;

  const baseEarthX = isMobile ? 0.0 : 1.35;
  const baseEarthY = isMobile ? -0.45 : 0.0;

  useFrame((state, delta) => {
    const targetConfig = BEAT_CAMERA_TARGETS[activeBeat] || BEAT_CAMERA_TARGETS[0];

    // Desired camera Z: either transitioning (1.45) or the active beat's target
    let targetZ = targetConfig.camZ;
    if (isTransitioning) {
      targetZ = 1.45;
    }

    // 600-800ms eased tween (exponential ease-out, independent of scroll speed)
    const easeFactor = Math.min(delta * 4.5, 1.0);
    currentCamZ.current = THREE.MathUtils.lerp(currentCamZ.current, targetZ, easeFactor);
    state.camera.position.z = currentCamZ.current;

    // Target Earth position for this beat
    const targetEarthX = baseEarthX * targetConfig.earthFactor;
    const targetEarthY = baseEarthY * targetConfig.earthFactor;

    currentEarthPos.current.x = THREE.MathUtils.lerp(currentEarthPos.current.x, targetEarthX, easeFactor);
    currentEarthPos.current.y = THREE.MathUtils.lerp(currentEarthPos.current.y, targetEarthY, easeFactor);

    if (earthGroupRef.current) {
      earthGroupRef.current.position.set(currentEarthPos.current.x, currentEarthPos.current.y, 0);
      earthGroupRef.current.rotation.y += delta * 0.015;
    }

    // Gentle camera look offset to balance Earth composition
    const targetLookX = currentEarthPos.current.x * 0.15;
    const targetLookY = currentEarthPos.current.y * 0.2;
    currentLookAt.current.x = THREE.MathUtils.lerp(currentLookAt.current.x, targetLookX, easeFactor);
    currentLookAt.current.y = THREE.MathUtils.lerp(currentLookAt.current.y, targetLookY, easeFactor);
    state.camera.lookAt(currentLookAt.current.x, currentLookAt.current.y, 0);
  });

  return (
    <>
      <SpaceBackground mousePos={mousePos} reducedMotion={false} />
      {/* Sun key lighting (healProgress = 0, camera following) */}
      <Sun healProgress={0} isLowEnd={false} />

      <group ref={earthGroupRef} scale={0.72}>
        <Earth healProgress={0} />
        <Clouds healProgress={0} />
        <Atmosphere healProgress={0} />
      </group>

      {/* Floating debris follows Earth center position */}
      <FloatingDebris
        center={[currentEarthPos.current.x, currentEarthPos.current.y, 0]}
        mousePos={mousePos}
        healProgress={0}
      />
    </>
  );
};

export const Landing = () => {
  const navigate = useNavigate();
  const [activeBeat, setActiveBeat] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

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

      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
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
    setIsTransitioning(true);
    setScreenFlash(true);

    // Camera zooms into Earth, brief flash, seamless navigate to /clean
    setTimeout(() => {
      navigate('/clean');
    }, 700);
  };

  const currentBeatData = BEATS_DATA[activeBeat] || BEATS_DATA[0];
  const VIGNETTE_DENSITY = [0.52, 0.58, 0.64, 0.72];
  const vignetteDarkness = VIGNETTE_DENSITY[activeBeat] || 0.52;

  return (
    <div className="relative bg-[#030712] text-white selection:bg-emerald-500 selection:text-black">
      
      {/* ── 4 Snap Sections (Total length = 4 x 100vh) ── */}
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />
      <section className="snap-beat-section pointer-events-none" />

      {/* ── Transparent Fixed Header (Hides on game transition) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-12 py-6 transition-all duration-300 pointer-events-auto"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-20px)' : 'translateY(0)',
        }}
      >
        {/* Left: Leaf Logo + EcoFuture */}
        <div
          onClick={() => goToBeat(0)}
          className="flex items-center gap-2.5 select-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Leaf className="w-4 h-4 text-[#4ade80]" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            EcoFuture
          </span>
        </div>

        {/* Right: Nav items (About, Impact, Solutions) + Take Action pill */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => goToBeat(1)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 1 ? 'text-[#4ade80]' : 'text-white/70 hover:text-[#4ade80]'
              }`}
            >
              About
            </button>
            <button
              onClick={() => goToBeat(2)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 2 ? 'text-[#4ade80]' : 'text-white/70 hover:text-[#4ade80]'
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => goToBeat(3)}
              className={`font-label uppercase text-[12px] tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                activeBeat === 3 ? 'text-[#4ade80]' : 'text-white/70 hover:text-[#4ade80]'
              }`}
            >
              Solutions
            </button>
          </nav>
          
          <button
            onClick={handleStartCleaning}
            className="btn-aerospace-secondary text-[12px] py-2 px-4"
          >
            <span>Take Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
              activeBeat={activeBeat}
              isTransitioning={isTransitioning}
              mousePos={mousePos}
            />
            <Effects isLowEnd={false} />
          </Suspense>
        </Canvas>

        {/* Left-to-Right Dark Gradient Scrim (Protects text contrast from Earth) */}
        <div
          className="absolute inset-y-0 left-0 w-full md:w-3/5 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(3, 7, 18, 0.94) 0%, rgba(3, 7, 18, 0.82) 45%, rgba(3, 7, 18, 0.25) 80%, transparent 100%)',
          }}
        />

        {/* Dynamic Pollution Vignette & Contrast Overlay (Smooth 600ms transition) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(3, 7, 18, ${vignetteDarkness}) 100%)`,
          }}
        />

        {/* Transition Flash Overlay */}
        {screenFlash && (
          <div className="absolute inset-0 z-50 bg-[#4ade80] animate-out fade-out duration-700 pointer-events-none" />
        )}
      </div>

      {/* ── Foreground Text & Action Layer (Fixed in Viewport) ── */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 sm:p-12 md:p-16">
        
        {/* Spacer for fixed header */}
        <div className="h-16" />

        {/* ── Left Column Stage: Stepped Beats (Only active beat rendered) ── */}
        <div className="relative w-full max-w-xl md:max-w-2xl my-auto text-left pointer-events-auto">
          <div key={activeBeat} className="beat-unit">
            
            {/* Eyebrow */}
            <p className={`font-label uppercase text-[12px] sm:text-[13px] tracking-[0.3em] ${currentBeatData.eyebrowColor} mb-4 block`}>
              {currentBeatData.eyebrow}
            </p>

            {/* Headline */}
            <h1 className="font-display font-extrabold text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.02em] text-white mb-6 drop-shadow-2xl">
              {currentBeatData.headline}
            </h1>

            {/* Body Text */}
            {currentBeatData.body && (
              <p className="font-body font-light text-[18px] sm:text-[20px] leading-[1.6] text-white/70 mb-8 max-w-[46ch]">
                {currentBeatData.body}
              </p>
            )}

            {/* Sourced Data Line */}
            {currentBeatData.source && (
              <p className="font-mono text-xs sm:text-sm text-white/50 tracking-wider mb-8">
                {currentBeatData.source}
              </p>
            )}

            {/* Action Button (Beat 0 and Beat 3) */}
            {currentBeatData.button && (
              <div>
                <button
                  onClick={handleStartCleaning}
                  disabled={isTransitioning}
                  className={`btn-aerospace-primary group ${
                    currentBeatData.button.large ? 'text-base sm:text-lg px-9 py-4 shadow-[0_0_50px_rgba(74,222,128,0.5)]' : ''
                  }`}
                >
                  {currentBeatData.button.large && (
                    <Sparkles className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform duration-200" />
                  )}
                  <span>{currentBeatData.button.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1.5 transition-transform duration-200" />
                </button>

                {currentBeatData.button.badge && (
                  <p className="mt-4 font-mono text-xs text-white/50 uppercase tracking-[0.25em]">
                    {currentBeatData.button.badge}
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom Bar: Beat Dots / Mouse Indicator (Center) & Skip Intro (Right) ── */}
        <div className="relative w-full flex items-center justify-between pointer-events-auto">
          
          {/* Bottom Left: Beat Pagination Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((b) => (
              <button
                key={b}
                onClick={() => goToBeat(b)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  b === activeBeat ? 'w-6 bg-[#4ade80]' : 'w-1.5 bg-white/20 hover:bg-white/50'
                }`}
                aria-label={`Jump to story beat ${b + 1}`}
              />
            ))}
            <span className="font-mono text-xs text-white/40 ml-1.5 tracking-wider">
              0{activeBeat + 1} / 04
            </span>
          </div>

          {/* Bottom Center: Minimal Mouse Scroll Indicator (visible on beats 0-2) */}
          <div
            onClick={() => goToBeat(Math.min(activeBeat + 1, 3))}
            className={`hidden sm:flex items-center justify-center gap-3 transition-opacity duration-300 cursor-pointer ${
              activeBeat < 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Scroll or click to advance"
          >
            <div className="w-12 h-px bg-white/15" />
            <div className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1.5">
              <div className="w-1 h-2 rounded-full bg-white/70 animate-bounce" />
            </div>
            <div className="w-12 h-px bg-white/15" />
          </div>

          {/* Bottom Right: Skip Intro Link */}
          <div className="w-24 text-right">
            <button
              onClick={() => navigate('/clean')}
              className="font-label uppercase text-[12px] tracking-[0.2em] text-white/50 hover:text-[#4ade80] transition-colors duration-200 p-2 cursor-pointer"
            >
              Skip intro &rarr;
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Landing;
