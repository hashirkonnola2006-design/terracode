import React, { useRef, useState, useEffect } from 'react';
import { SolutionsHeroScene } from './SolutionsHeroScene';
import { useIntroStatus } from '../intro/useIntroStatus';
import { HERO_CONFIG } from '../../config/heroSolutions';

export const SolutionsHero = ({ liteMode = false, onScrollToPillars }) => {
  const heroContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // IntersectionObserver to pause Three.js rendering when hero is scrolled out of view
  useEffect(() => {
    if (!heroContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(heroContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Parallax scroll handler
  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight * 1.2) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Entrance animation flags (coordinated with PixelIntroLoader exit at ~1.45s)
  const { isIntroActive, isIntroExiting } = useIntroStatus();
  const [entered, setEntered] = useState(prefersReducedMotion || !isIntroActive);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!isIntroActive) {
      const timer = setTimeout(() => setEntered(true), 100);
      return () => clearTimeout(timer);
    }
    if (isIntroExiting) {
      setEntered(true);
    }
  }, [prefersReducedMotion, isIntroActive, isIntroExiting]);

  const healParallaxY = prefersReducedMotion ? 0 : scrollY * 0.22;
  const planetParallaxY = prefersReducedMotion ? 0 : scrollY * 0.38;

  return (
    <section
      ref={heroContainerRef}
      className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#050505] select-none"
    >
      {/* ── LAYER 1: Deep Black Space Background with Faint Starfield ── */}
      <div className="absolute inset-0 z-0 bg-[#050505] pointer-events-none">
        {/* Subtle procedural star speckles */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 120px 80px, #cbd5e1, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 280px 140px, #94a3b8, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 450px 60px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 620px 180px, #e2e8f0, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 800px 90px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 980px 220px, #cbd5e1, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 1200px 130px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 1440px 70px, #94a3b8, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 1680px 190px, #ffffff, rgba(0,0,0,0))`,
            backgroundSize: '800px 400px',
          }}
        />
      </div>

      {/* ── LAYER 2: Giant "HEAL" Typography (Sits Behind WebGL Planet) ── */}
      <div
        className={`absolute top-0 left-0 w-full z-10 flex justify-center items-start pointer-events-none transition-all duration-1000 ease-out ${
          entered ? 'opacity-90 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}
        style={{
          transform: `translateY(${healParallaxY}px)`,
        }}
      >
        <div
          className={`w-full max-w-[1920px] mx-auto px-2 sm:px-6 md:px-8 ${HERO_CONFIG.healTopOffsetDesktop} flex justify-between items-start font-display text-white ${HERO_CONFIG.healFontSize} leading-[0.76] uppercase select-none will-change-transform`}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 100,
            textShadow: '0 0 60px rgba(255,255,255,0.06)',
          }}
        >
          <span className="flex-1 text-center">H</span>
          <span className="flex-1 text-center">E</span>
          <span className="flex-1 text-center">A</span>
          <span className="flex-1 text-center">L</span>
        </div>
      </div>

      {/* ── LAYER 3: WebGL Transparent Canvas (Close-up Destroyed Earth & Smoke Plumes) ── */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none transition-all duration-1200 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
        style={{
          transform: `translateY(${planetParallaxY}px)`,
        }}
      >
        <SolutionsHeroScene isVisible={isVisible} liteMode={liteMode} />
      </div>

      {/* ── LAYER 4: Bottom-Left Narrative Stack (Start Cleaning button removed) ── */}
      <div className={`absolute ${HERO_CONFIG.headlineBottomDesktop} ${HERO_CONFIG.headlineLeftDesktop} z-30 max-w-2xl pointer-events-auto`}>
        {/* Soft dark radial scrim behind text for WCAG AA readability */}
        <div className="absolute -inset-8 -z-10 bg-radial from-[#050505]/95 via-[#050505]/75 to-transparent blur-2xl pointer-events-none" />

        <div className="space-y-3 sm:space-y-4">
          {/* Headline on two lines */}
          <h1
            className={`tracking-[-0.02em] leading-[0.95] text-[clamp(38px,6vw,104px)] transition-all duration-1000 delay-300 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
            }}
          >
            <div className="text-white drop-shadow-md">Broken planet.</div>
            <div className="text-[#0becc2] drop-shadow-lg">Your move.</div>
          </h1>

          {/* Faint Mono Caption */}
          <div
            className={`font-mono uppercase text-[10px] sm:text-xs tracking-[0.24em] text-white/50 pt-1 transition-all duration-1000 delay-500 ease-out ${
              entered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            A GREENER TOMORROW
          </div>
        </div>
      </div>

      {/* ── LAYER 5: Bottom-Center Pulsing "Scroll" Indicator ── */}
      <div
        className={`hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex-col items-center pointer-events-auto cursor-pointer group transition-all duration-1000 delay-700 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onScrollToPillars}
        role="button"
        aria-label="Scroll to Six Pillars"
      >
        <div className="w-[1px] h-10 bg-white/40 group-hover:bg-[#0becc2] transition-colors animate-pulse mb-2" />
        <span className="font-mono uppercase text-[10px] tracking-[0.25em] text-white/50 group-hover:text-white transition-colors">
          Scroll
        </span>
      </div>
    </section>
  );
};

export default SolutionsHero;
