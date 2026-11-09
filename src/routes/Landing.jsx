import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceBackground } from '../components/hero3d/SpaceBackground';
import { Sun } from '../components/hero3d/Sun';
import { Earth } from '../components/hero3d/Earth';
import { Clouds } from '../components/hero3d/Clouds';
import { Atmosphere } from '../components/hero3d/Atmosphere';
import { FloatingDebris } from '../components/hero3d/FloatingDebris';
import { SurfaceClutter } from '../components/hero3d/SurfaceClutter';
import { Effects } from '../components/hero3d/Effects';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';

const LandingSceneController = ({ scrollProgress, isTransitioning }) => {
  const earthGroupRef = useRef(null);
  const targetCamZ = useRef(3.65);

  useFrame((state, delta) => {
    // Scroll drives slow camera push-in toward polluted Earth (from 3.65 down to 2.45)
    let desiredZ = THREE.MathUtils.lerp(3.65, 2.45, scrollProgress);

    // Zoom into Earth on button click transition
    if (isTransitioning) {
      desiredZ = 1.45;
    }

    targetCamZ.current = THREE.MathUtils.lerp(targetCamZ.current, desiredZ, delta * 3.5);
    state.camera.position.z = targetCamZ.current;
    state.camera.lookAt(0, 0, 0);

    // Earth slow spin (polluted state, never heals)
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <>
      <SpaceBackground reducedMotion={false} />
      {/* Sun stays in polluted mood (healProgress = 0) */}
      <Sun healProgress={0} isLowEnd={false} />

      <group ref={earthGroupRef} scale={0.72}>
        {/* Earth stays 100% polluted (healProgress = 0) with active fire and smoke */}
        <Earth healProgress={0} />
        <SurfaceClutter healProgress={0} isLowEnd={false} />
        <Clouds healProgress={0} />
        <Atmosphere healProgress={0} />
      </group>

      {/* Heavy floating trash cloud drifting past the camera */}
      <FloatingDebris healProgress={0} />
    </>
  );
};

export const Landing = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  // Scroll listener tracking 0.0 to 1.0 progress
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

  // Text Beat visibility calculations
  // Beat 1: 0.05 to 0.32
  const beat1Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.05) / 0.10)) *
                       Math.max(0, Math.min(1, (0.34 - scrollProgress) / 0.08));

  // Beat 2: 0.36 to 0.64
  const beat2Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.36) / 0.10)) *
                       Math.max(0, Math.min(1, (0.66 - scrollProgress) / 0.08));

  // Beat 3: 0.68 to 0.88
  const beat3Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.68) / 0.08)) *
                       Math.max(0, Math.min(1, (0.88 - scrollProgress) / 0.06));

  // Final Action Button: 0.85 to 1.00
  const buttonOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.85) / 0.10));

  // Dynamic vignette & desaturation intensifies as camera approaches debris
  const vignetteDarkness = 0.55 + scrollProgress * 0.35;

  return (
    <div className="relative min-h-[350vh] bg-[#030712] text-white selection:bg-emerald-500 selection:text-black">
      
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
            />
            <Effects isLowEnd={false} />
          </Suspense>
        </Canvas>

        {/* Dynamic Pollution Vignette & Contrast Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(3, 7, 18, ${vignetteDarkness}) 100%)`,
            filter: `saturate(${1.0 - scrollProgress * 0.25})`,
          }}
        />

        {/* Transition Flash Overlay */}
        {screenFlash && (
          <div className="absolute inset-0 z-50 bg-emerald-400 animate-out fade-out duration-700 pointer-events-none" />
        )}
      </div>

      {/* ── Story Text Beats & Action Overlays (Fixed in Viewport) ── */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 sm:p-12">
        
        {/* Subtle Scroll Prompt (Fades out once user begins scrolling) */}
        <div
          className="text-center pt-8 transition-opacity duration-500"
          style={{ opacity: Math.max(0, 1 - scrollProgress * 5) }}
        >
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center justify-center gap-1.5">
            Scroll to witness the damage <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
          </p>
        </div>

        {/* ── Center Stage: 3 Progressive Text Beats ── */}
        <div className="relative max-w-2xl mx-auto w-full text-center px-4 flex items-center justify-center flex-1">
          
          {/* Beat 1 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none"
            style={{ opacity: beat1Opacity }}
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-2xl">
              Every year, millions of tonnes of plastic reach our oceans.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide">
              Over 14 million tonnes per year — IUCN Marine Brief 2024
            </p>
          </div>

          {/* Beat 2 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none"
            style={{ opacity: beat2Opacity }}
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 drop-shadow-2xl">
              Forests shrink. The air gets heavier.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wide">
              10 million hectares of forest lost annually — FAO Assessment 2024
            </p>
          </div>

          {/* Beat 3 */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none"
            style={{ opacity: beat3Opacity }}
          >
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-3 drop-shadow-2xl">
              The planet is asking for help.
            </h1>
          </div>

          {/* Beat 4 / Action: "Start Cleaning" Button */}
          {buttonOpacity > 0.05 && (
            <div
              className="relative z-20 pointer-events-auto transition-all duration-500 transform"
              style={{
                opacity: buttonOpacity,
                transform: `scale(${0.9 + buttonOpacity * 0.1})`,
              }}
            >
              <button
                onClick={handleStartCleaning}
                disabled={isTransitioning}
                className="group relative inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-extrabold text-base sm:text-lg tracking-wider uppercase shadow-[0_0_40px_rgba(74,222,128,0.6)] hover:shadow-[0_0_60px_rgba(74,222,128,0.9)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>Start Cleaning</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom Bar: Skip Intro Link ── */}
        <div className="flex items-center justify-end w-full pointer-events-auto">
          <button
            onClick={() => navigate('/clean')}
            className="text-xs font-mono text-slate-500 hover:text-emerald-400 transition-colors p-2 cursor-pointer uppercase tracking-wider"
          >
            Skip intro &rarr;
          </button>
        </div>

      </div>

    </div>
  );
};

export default Landing;
