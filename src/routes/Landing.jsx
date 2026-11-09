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
import { SurfaceClutter } from '../components/hero3d/SurfaceClutter';
import { Effects } from '../components/hero3d/Effects';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';

const LandingSceneController = ({ scrollProgress, isTransitioning, mousePos }) => {
  const earthGroupRef = useRef(null);
  const targetCamZ = useRef(3.65);
  const { viewport, size } = useThree();
  const isPortrait = viewport.width < viewport.height;
  const isMobile = size.width < 768 || isPortrait;

  // Responsive Earth starting position (on the right ~55-60% width on desktop, centered on mobile)
  const baseEarthX = isMobile ? 0.0 : 1.35;
  const currentEarthX = THREE.MathUtils.lerp(baseEarthX, 0.0, scrollProgress);
  const currentEarthY = isMobile ? THREE.MathUtils.lerp(-0.45, 0.0, scrollProgress) : 0.0;

  useFrame((state, delta) => {
    // Scroll drives slow camera push-in toward polluted Earth (from 3.65 down to 2.45)
    let desiredZ = THREE.MathUtils.lerp(3.65, 2.45, scrollProgress);

    // Zoom into Earth on button click transition
    if (isTransitioning) {
      desiredZ = 1.45;
    }

    targetCamZ.current = THREE.MathUtils.lerp(targetCamZ.current, desiredZ, delta * 3.5);
    state.camera.position.z = targetCamZ.current;

    // Slight camera look offset to balance Earth composition on the right
    const lookTargetX = THREE.MathUtils.lerp(currentEarthX * 0.15, 0.0, scrollProgress);
    state.camera.lookAt(lookTargetX, currentEarthY * 0.2, 0);

    // Earth slow spin (polluted state, never heals on landing page)
    if (earthGroupRef.current) {
      earthGroupRef.current.position.set(currentEarthX, currentEarthY, 0);
      earthGroupRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <>
      <SpaceBackground mousePos={mousePos} reducedMotion={false} />
      {/* Sun stays in polluted mood (healProgress = 0) with rays and flare */}
      <Sun healProgress={0} isLowEnd={false} />

      <group ref={earthGroupRef} scale={0.72}>
        {/* Earth stays 100% polluted (healProgress = 0) */}
        <Earth healProgress={0} />
        <SurfaceClutter healProgress={0} isLowEnd={false} />
        <Clouds healProgress={0} />
        <Atmosphere healProgress={0} />
      </group>

      {/* Floating trash: medium orbital pieces centered on Earth + large hero pieces in foreground */}
      <FloatingDebris
        center={[currentEarthX, currentEarthY, 0]}
        mousePos={mousePos}
        healProgress={0}
      />
    </>
  );
};

export const Landing = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

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

  // Scroll listener tracking 0.0 to 1.0 progress across ~250vh
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartCleaning = () => {
    setIsTransitioning(true);
    setScreenFlash(true);

    // Camera zooms into Earth, quick flash, seamless navigate to /clean
    setTimeout(() => {
      navigate('/clean');
    }, 700);
  };

  // Hero text opacity (initial screen: visible 0.0 -> 0.22, fades out completely by 0.28)
  const heroOpacity = Math.max(0, Math.min(1, (0.24 - scrollProgress) / 0.12));

  // Beat 1: "Millions of tonnes of plastic reach our oceans every year." (0.28 to 0.58)
  const beat1Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.26) / 0.10)) *
                       Math.max(0, Math.min(1, (0.58 - scrollProgress) / 0.10));

  // Beat 2: "The planet is asking for help." (0.60 to 0.86)
  const beat2Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.60) / 0.10)) *
                       Math.max(0, Math.min(1, (0.86 - scrollProgress) / 0.08));

  // Final Centered Action Button: 0.86 to 1.00
  const finalButtonOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.86) / 0.08));

  // Subtle vignette that intensifies gently as camera gets closer to debris
  const vignetteDarkness = 0.52 + scrollProgress * 0.25;

  return (
    <div className="relative min-h-[250vh] bg-[#030712] text-white selection:bg-emerald-500 selection:text-black">
      
      {/* ── Transparent Header (Hides once game phase starts) ── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-12 py-6 transition-all duration-500 pointer-events-auto"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-20px)' : 'translateY(0)',
        }}
      >
        {/* Left: Leaf Logo + EcoFuture */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
            <Leaf className="w-5 h-5 text-[#4ade80]" />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            EcoFuture
          </span>
        </div>

        {/* Right: Nav items (About, Impact, Solutions) + Take Action pill */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
              className="hover:text-[#4ade80] transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 1.3, behavior: 'smooth' })}
              className="hover:text-[#4ade80] transition-colors cursor-pointer"
            >
              Impact
            </button>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight * 2.0, behavior: 'smooth' })}
              className="hover:text-[#4ade80] transition-colors cursor-pointer"
            >
              Solutions
            </button>
          </nav>
          
          <button
            onClick={handleStartCleaning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4ade80] hover:bg-[#3ecb74] text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(74,222,128,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
              scrollProgress={scrollProgress}
              isTransitioning={isTransitioning}
              mousePos={mousePos}
            />
            <Effects isLowEnd={false} />
          </Suspense>
        </Canvas>

        {/* Left-to-Right Dark Gradient Scrim (Protects text contrast from Earth / bright space) */}
        <div
          className="absolute inset-y-0 left-0 w-full md:w-3/5 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, rgba(3, 7, 18, 0.94) 0%, rgba(3, 7, 18, 0.82) 45%, rgba(3, 7, 18, 0.25) 80%, transparent 100%)',
          }}
        />

        {/* Dynamic Pollution Vignette & Contrast Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
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

        {/* ── Left Column Stage: Hero Screen & Scroll Beats ── */}
        <div className="relative w-full max-w-xl md:max-w-2xl my-auto text-left">
          
          {/* 1. Hero First Screen (Visible at top) */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: heroOpacity,
              pointerEvents: heroOpacity > 0.1 ? 'auto' : 'none',
              transform: `translateY(${(1 - heroOpacity) * -20}px)`,
              display: heroOpacity <= 0 ? 'none' : 'block',
            }}
          >
            {/* Small letter-spaced eyebrow */}
            <p className="text-xs uppercase tracking-[0.22em] text-[#4ade80] font-mono font-bold mb-4">
              A CLEANER PLANET. A BRIGHTER TOMORROW.
            </p>

            {/* Huge headline with Earth in green accent */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.06] mb-6 drop-shadow-2xl font-sans">
              Our <span className="text-[#4ade80]">Earth</span>
              <br />
              is Drowning
            </h1>

            {/* Muted paragraph */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-md">
              Plastic, pollution and human waste are choking our home. It's time to act.
            </p>

            {/* Green pill button */}
            <button
              onClick={handleStartCleaning}
              disabled={isTransitioning}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#4ade80] hover:bg-[#3ecb74] text-slate-950 font-extrabold text-base tracking-wide shadow-[0_0_35px_rgba(74,222,128,0.5)] hover:shadow-[0_0_50px_rgba(74,222,128,0.8)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Start Cleaning</span>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* 2. Scroll Beat 1 (Left aligned in same spot) */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: beat1Opacity,
              transform: `translateY(${(1 - beat1Opacity) * 20}px)`,
              display: beat1Opacity <= 0 ? 'none' : 'block',
            }}
          >
            <p className="text-xs uppercase tracking-[0.20em] text-red-400 font-mono font-semibold mb-3">
              GLOBAL CRISIS REPORT
            </p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight drop-shadow-2xl">
              Millions of tonnes of plastic reach our oceans every year.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide">
              Over 14 million tonnes per year — IUCN 2024
            </p>
          </div>

          {/* 3. Scroll Beat 2 (Left aligned in same spot) */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: beat2Opacity,
              transform: `translateY(${(1 - beat2Opacity) * 20}px)`,
              display: beat2Opacity <= 0 ? 'none' : 'block',
            }}
          >
            <p className="text-xs uppercase tracking-[0.20em] text-[#4ade80] font-mono font-semibold mb-3">
              CALL TO RESTORATION
            </p>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-4 leading-tight drop-shadow-2xl">
              The planet is asking for help.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-lg">
              Forests shrink, carbon suffocates the atmosphere, and ecosystems teeter on the brink. You have the power to turn back the tide.
            </p>
          </div>

        </div>

        {/* ── Centered Action Button at Scroll End ── */}
        {finalButtonOpacity > 0.05 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500"
            style={{
              opacity: finalButtonOpacity,
              transform: `scale(${0.92 + finalButtonOpacity * 0.08})`,
            }}
          >
            <div className="pointer-events-auto text-center">
              <button
                onClick={handleStartCleaning}
                disabled={isTransitioning}
                className="group relative inline-flex items-center gap-3.5 px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500 to-[#4ade80] hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-lg sm:text-xl tracking-wider uppercase shadow-[0_0_50px_rgba(74,222,128,0.7)] hover:shadow-[0_0_75px_rgba(74,222,128,0.95)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>Start Cleaning</span>
                <ArrowRight className="w-6 h-6 text-slate-950 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <p className="mt-3 text-xs font-mono text-slate-400 uppercase tracking-widest">
                Interactive Restoration Simulator
              </p>
            </div>
          </div>
        )}

        {/* ── Bottom Bar: Mouse Scroll Indicator (Center) & Skip Intro (Right) ── */}
        <div className="relative w-full flex items-center justify-between pointer-events-auto">
          
          {/* Empty left placeholder to balance layout */}
          <div className="w-24 hidden sm:block" />

          {/* Bottom Center: Minimal Mouse Scroll Indicator with thin flanking lines */}
          <div
            className="flex items-center justify-center gap-3 sm:gap-4 transition-opacity duration-500 mx-auto"
            style={{ opacity: Math.max(0, 1 - scrollProgress * 6) }}
          >
            <div className="w-12 sm:w-24 h-px bg-gradient-to-r from-transparent to-slate-500/40" />
            <div className="w-5 h-8 rounded-full border border-slate-500/50 flex items-start justify-center p-1.5 shadow-[0_0_12px_rgba(255,255,255,0.06)]">
              <div className="w-1 h-2 rounded-full bg-slate-300 animate-bounce" />
            </div>
            <div className="w-12 sm:w-24 h-px bg-gradient-to-l from-transparent to-slate-500/40" />
          </div>

          {/* Bottom Right: Skip Intro Link */}
          <div className="w-24 text-right">
            <button
              onClick={() => navigate('/clean')}
              className="text-xs font-mono text-slate-400 hover:text-[#4ade80] transition-colors p-2 cursor-pointer uppercase tracking-wider"
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
