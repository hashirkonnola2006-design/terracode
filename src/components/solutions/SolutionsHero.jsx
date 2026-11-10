import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { SolutionsHeroScene } from './SolutionsHeroScene';

export const SolutionsHero = ({ liteMode = false, onScrollToPillars }) => {
  const navigate = useNavigate();
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

  // Entrance animation flags
  const [entered, setEntered] = useState(prefersReducedMotion);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

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
          className="w-full max-w-[1920px] mx-auto px-2 sm:px-6 md:px-8 pt-14 sm:pt-16 md:pt-12 flex justify-between items-start font-display text-white text-[32vw] sm:text-[28vw] md:text-[24vw] leading-[0.78] uppercase select-none will-change-transform"
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

      {/* ── LAYER 4: Bottom-Left Narrative & Action Stack ── */}
      <div className="absolute bottom-5 sm:bottom-10 left-5 sm:left-10 md:left-14 lg:left-16 z-30 max-w-2xl pointer-events-auto">
        {/* Soft dark radial scrim behind text for WCAG AA readability */}
        <div className="absolute -inset-8 -z-10 bg-radial from-[#050505]/95 via-[#050505]/75 to-transparent blur-2xl pointer-events-none" />

        <div className="space-y-4 sm:space-y-5">
          {/* Headline on two lines */}
          <h1
            className={`tracking-[-0.02em] leading-[0.95] text-[clamp(40px,6.5vw,110px)] transition-all duration-1000 delay-300 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
            }}
          >
            <div className="text-white drop-shadow-md">Broken planet.</div>
            <div className="text-[#4ade80] drop-shadow-lg">Your move.</div>
          </h1>

          {/* Outlined Pill Button + Leaf Icon */}
          <div
            className={`transition-all duration-1000 delay-500 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <button
              onClick={() => navigate('/clean')}
              className="group inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border border-white/80 hover:border-[#4ade80] bg-transparent hover:bg-[#4ade80] text-white hover:text-black font-mono uppercase text-xs sm:text-sm tracking-[0.16em] transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(74,222,128,0.45)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <Leaf className="w-4 h-4 text-[#4ade80] group-hover:text-black transition-colors" />
              <span className="font-semibold">START CLEANING</span>
            </button>
          </div>

          {/* Faint Mono Caption */}
          <div
            className={`font-mono uppercase text-[10px] sm:text-xs tracking-[0.24em] text-white/40 pt-1 transition-all duration-1000 delay-700 ease-out ${
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
        <div className="w-[1px] h-10 bg-white/40 group-hover:bg-[#4ade80] transition-colors animate-pulse mb-2" />
        <span className="font-mono uppercase text-[10px] tracking-[0.25em] text-white/50 group-hover:text-white transition-colors">
          Scroll
        </span>
      </div>
    </section>
  );
};

export default SolutionsHero;
