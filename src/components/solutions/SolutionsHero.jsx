import React, { useRef, useState, useEffect } from 'react';
import { SolutionsHeroScene } from './SolutionsHeroScene';
import { useIntroStatus } from '../intro/useIntroStatus';
import { HERO_CONFIG } from '../../config/heroSolutions';
import { Play, Leaf, ChevronDown } from 'lucide-react';

export const SolutionsHero = ({ liteMode = false, onScrollToPillars, onScrollToPlay }) => {
  const heroContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pause Three.js rendering when hero is scrolled out of view
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
      if (window.scrollY < window.innerHeight * 1.3) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  // Mouse move handler for soft text parallax
  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  // Entrance animation flags
  const { isIntroActive, isIntroExiting } = useIntroStatus();
  const [entered, setEntered] = useState(prefersReducedMotion || !isIntroActive);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!isIntroActive) {
      const timer = setTimeout(() => setEntered(true), 80);
      return () => clearTimeout(timer);
    }
    if (isIntroExiting) {
      setEntered(true);
    }
  }, [prefersReducedMotion, isIntroActive, isIntroExiting]);

  const healParallaxY = prefersReducedMotion ? 0 : scrollY * 0.16 + mousePos.y * -8;
  const healParallaxX = prefersReducedMotion ? 0 : mousePos.x * -12;
  const planetParallaxY = prefersReducedMotion ? 0 : scrollY * 0.38;

  const handlePlayClick = (e) => {
    e.preventDefault();
    if (onScrollToPlay) {
      onScrollToPlay();
    } else {
      const el = document.getElementById('play');
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  const handleSolutionsClick = (e) => {
    e.preventDefault();
    if (onScrollToPillars) {
      onScrollToPillars();
    } else {
      const el = document.getElementById('solutions-grid');
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  return (
    <section
      ref={heroContainerRef}
      className="relative w-full h-screen min-h-[660px] overflow-hidden bg-[#050505] select-none"
    >
      {/* ── LAYER 1: Deep Black Space Background with Stars & Cosmic Dust ── */}
      <div className="absolute inset-0 z-0 bg-[#050505] pointer-events-none">
        {/* Procedural star speckles */}
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 24px 34px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 130px 85px, #cbd5e1, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 290px 145px, #94a3b8, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 460px 65px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 630px 185px, #e2e8f0, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 810px 95px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 990px 225px, #cbd5e1, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 1210px 135px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 1450px 75px, #94a3b8, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 1690px 195px, #ffffff, rgba(0,0,0,0))`,
            backgroundSize: '820px 420px',
          }}
        />

        {/* Ambient atmospheric nebula dust */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 75% 25%, rgba(56, 189, 248, 0.12) 0%, transparent 55%), radial-gradient(circle at 20% 75%, rgba(20, 230, 192, 0.08) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* ── LAYER 2: Giant "HEAL" Typography (Sits Behind WebGL Planet) ── */}
      <div
        className={`absolute top-0 left-0 w-full z-10 flex justify-center items-start pointer-events-none transition-all duration-1000 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
        }`}
        style={{
          transform: `translate3d(${healParallaxX}px, ${healParallaxY}px, 0)`,
        }}
      >
        <div
          className={`w-full max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 ${HERO_CONFIG.healTopOffsetDesktop} flex justify-between items-start select-none will-change-transform`}
        >
          {['H', 'E', 'A', 'L'].map((letter, idx) => (
            <span
              key={idx}
              className={`flex-1 text-center font-black ${HERO_CONFIG.healFontSize} leading-[0.74] tracking-[-0.04em] select-none`}
              style={{
                fontFamily: "'Outfit', 'Montserrat', sans-serif",
                fontWeight: 900,
                // Bright white-silver at top fading to transparent blue at bottom with frost texture
                background:
                  'linear-gradient(180deg, #ffffff 0%, #e2e8f0 32%, #94a3b8 64%, rgba(56, 189, 248, 0.22) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 40px rgba(255,255,255,0.08))',
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* ── LAYER 3: WebGL Transparent Canvas (Earth, Rim Glow, Lava Rifts, 3D Floating Debris) ── */}
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

      {/* ── LAYER 4: Bottom-Left Narrative Stack & CTA Buttons (Image 1 Reference) ── */}
      <div
        className={`absolute ${HERO_CONFIG.headlineBottomDesktop} ${HERO_CONFIG.headlineLeftDesktop} z-30 max-w-xl pointer-events-auto`}
      >
        {/* Soft dark radial scrim behind text for WCAG AAA contrast */}
        <div className="absolute -inset-10 -z-10 bg-radial from-[#050505]/95 via-[#050505]/75 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-4 sm:space-y-5">
          {/* Headline on two lines: "Broken planet." in white, "Your move." in teal #14e6c0 */}
          <h1
            className={`tracking-[-0.03em] leading-[0.92] text-[clamp(40px,5.8vw,92px)] font-black transition-all duration-1000 delay-200 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              fontFamily: "'Outfit', 'Montserrat', sans-serif",
              fontWeight: 900,
            }}
          >
            <div className="text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Broken planet.
            </div>
            <div
              className="text-[#14e6c0]"
              style={{
                textShadow: '0 0 28px rgba(20, 230, 192, 0.45), 0 0 50px rgba(20, 230, 192, 0.20)',
              }}
            >
              Your move.
            </div>
          </h1>

          {/* Tagline: "Play. Learn. Make a difference." */}
          <p
            className={`text-white/75 font-normal tracking-[0.06em] sm:tracking-[0.09em] text-sm sm:text-base md:text-lg transition-all duration-1000 delay-400 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Play. Learn. Make a difference.
          </p>

          {/* ── CTA Action Buttons (Image 1 Match) ── */}
          <div
            className={`pt-1 sm:pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4 transition-all duration-1000 delay-500 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Primary Button: Play Games */}
            <a
              href="#play"
              onClick={handlePlayClick}
              className="group relative inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#14e6c0] text-[#050505] font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_22px_rgba(20,230,192,0.38)] hover:shadow-[0_0_36px_rgba(20,230,192,0.70)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current transition-transform group-hover:scale-110" />
              <span>Play Games</span>
            </a>

            {/* Secondary Button: See Solutions */}
            <a
              href="#solutions-grid"
              onClick={handleSolutionsClick}
              className="group inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-full border border-white/30 text-white font-medium text-xs sm:text-sm tracking-wide bg-transparent hover:bg-[#14e6c0]/10 hover:border-[#14e6c0] hover:text-[#14e6c0] hover:shadow-[0_0_24px_rgba(20,230,192,0.22)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer backdrop-blur-sm"
            >
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" />
              <span>See Solutions</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── LAYER 5: Bottom-Center Minimalist Scroll Indicator: --- ( v ) --- ── */}
      <div
        className={`hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 items-center gap-3 pointer-events-auto cursor-pointer group transition-all duration-1000 delay-700 ${
          entered ? 'opacity-85 hover:opacity-100' : 'opacity-0'
        }`}
        onClick={handleSolutionsClick}
        role="button"
        aria-label="Scroll down to solutions"
      >
        {/* Left thin flanking line */}
        <div className="w-8 md:w-12 h-[1px] bg-white/20 group-hover:bg-[#14e6c0]/60 transition-colors" />

        {/* Rounded mouse-pill container with bouncing chevron */}
        <div className="w-5 h-8 rounded-full border border-white/40 group-hover:border-[#14e6c0] flex items-center justify-center transition-colors shadow-sm">
          <ChevronDown className="w-3.5 h-3.5 text-white/80 group-hover:text-[#14e6c0] animate-bounce transition-colors" />
        </div>

        {/* Right thin flanking line */}
        <div className="w-8 md:w-12 h-[1px] bg-white/20 group-hover:bg-[#14e6c0]/60 transition-colors" />
      </div>

      {/* ── LAYER 6: Cinematic Edge Vignette ── */}
      <div
        className="absolute inset-0 z-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 50%, rgba(5,5,5,0.45) 80%, rgba(5,5,5,0.85) 100%)',
        }}
      />
    </section>
  );
};

export default SolutionsHero;
