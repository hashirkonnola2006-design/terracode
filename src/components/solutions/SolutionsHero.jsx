import React, { useRef, useState, useEffect } from 'react';
import { useIntroStatus } from '../intro/useIntroStatus';
import { HERO_CONFIG } from '../../config/heroSolutions';
import { Play, Leaf, ChevronDown } from 'lucide-react';
import { musicEngine } from '../../audio/musicEngine';

export const SolutionsHero = ({ onScrollToPillars, onScrollToPlay }) => {
  const heroContainerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parallax scroll handler
  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight * 1.5) {
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

  // HEAL text parallax and fade out when scrolled past hero
  const heroH = typeof window !== 'undefined' ? window.innerHeight : 900;
  const scrollFade = Math.max(0, 1 - scrollY / (heroH * 0.65));
  const isPastHero = scrollY > heroH * 1.1;

  const healParallaxY = prefersReducedMotion ? 0 : scrollY * 0.16 + mousePos.y * -8;
  const healParallaxX = prefersReducedMotion ? 0 : mousePos.x * -12;

  const handlePlayClick = (e) => {
    e.preventDefault();
    musicEngine.playClick();
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
    musicEngine.playClick();
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
      className="relative w-full h-screen min-h-[660px] overflow-hidden bg-transparent select-none"
    >
      {/* ── Giant "HEAL" Typography (Sits Behind WebGL Planet in Z-index, fades on scroll) ── */}
      {!isPastHero && (
        <div
          className={`absolute top-0 left-0 w-full z-10 flex justify-center items-start pointer-events-none transition-all duration-1000 ease-out ${
            entered ? 'translate-y-0' : '-translate-y-10'
          }`}
          style={{
            transform: `translate3d(${healParallaxX}px, ${healParallaxY}px, 0)`,
            opacity: entered ? scrollFade : 0,
          }}
        >
          <div
            className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 flex justify-between items-start select-none will-change-transform"
            style={{ paddingTop: 'clamp(116px, 18.5vh, 185px)' }}
          >
            {['H', 'E', 'A', 'L'].map((letter, idx) => (
              <span
                key={idx}
                className={`flex-1 text-center font-black ${HERO_CONFIG.healFontSize} leading-[0.74] tracking-[-0.04em] select-none`}
                style={{
                  fontFamily: "'Outfit', 'Montserrat', sans-serif",
                  fontWeight: 900,
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
      )}

      {/* ── Bottom-Left Narrative Stack & CTA Buttons ── */}
      <div
        className={`absolute ${HERO_CONFIG.headlineBottomDesktop} ${HERO_CONFIG.headlineLeftDesktop} z-30 max-w-xl pointer-events-auto`}
        style={{
          opacity: scrollFade,
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      >
        {/* Soft dark radial scrim behind text for WCAG AAA contrast */}
        <div className="absolute -inset-10 -z-10 bg-radial from-[#050505]/95 via-[#050505]/75 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-3 sm:space-y-4">
          {/* Headline on two lines - Refined, sleek & proportional */}
          <h1
            className={`tracking-[-0.03em] leading-[0.98] text-[clamp(24px,2.9vw,44px)] font-black transition-all duration-1000 delay-200 ease-out ${
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
                textShadow: '0 0 24px rgba(20, 230, 192, 0.40), 0 0 44px rgba(20, 230, 192, 0.18)',
              }}
            >
              Your move.
            </div>
          </h1>

          {/* Tagline */}
          <p
            className={`text-white/75 font-normal tracking-[0.06em] sm:tracking-[0.09em] text-sm sm:text-base md:text-lg transition-all duration-1000 delay-400 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Play. Learn. Make a difference.
          </p>

          {/* ── CTA Action Buttons ── */}
          <div
            className={`pt-1 sm:pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4 transition-all duration-1000 delay-500 ease-out ${
              entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Primary Button: Play Games */}
            <a
              href="#play"
              onClick={handlePlayClick}
              onMouseEnter={() => musicEngine.playHover()}
              className="group relative inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#14e6c0] text-[#050505] font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_22px_rgba(20,230,192,0.38)] hover:shadow-[0_0_36px_rgba(20,230,192,0.70)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current transition-transform group-hover:scale-110" />
              <span>Play Games</span>
            </a>

            {/* Secondary Button: See Solutions */}
            <a
              href="#solutions-grid"
              onClick={handleSolutionsClick}
              onMouseEnter={() => musicEngine.playHover()}
              className="group inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-full border border-white/30 text-white font-medium text-xs sm:text-sm tracking-wide bg-transparent hover:bg-[#14e6c0]/10 hover:border-[#14e6c0] hover:text-[#14e6c0] hover:shadow-[0_0_24px_rgba(20,230,192,0.22)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer backdrop-blur-sm"
            >
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" />
              <span>See Solutions</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom-Center Minimalist Scroll Indicator: --- ( v ) --- ── */}
      <div
        className={`hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 items-center gap-3 pointer-events-auto cursor-pointer group transition-all duration-1000 delay-700 ${
          entered && scrollFade > 0.5 ? 'opacity-85 hover:opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleSolutionsClick}
        onMouseEnter={() => musicEngine.playHover()}
        role="button"
        aria-label="Scroll down to solutions"
      >
        <div className="w-8 md:w-12 h-[1px] bg-white/20 group-hover:bg-[#14e6c0]/60 transition-colors" />
        <div className="w-5 h-8 rounded-full border border-white/40 group-hover:border-[#14e6c0] flex items-center justify-center transition-colors shadow-sm">
          <ChevronDown className="w-3.5 h-3.5 text-white/80 group-hover:text-[#14e6c0] animate-bounce transition-colors" />
        </div>
        <div className="w-8 md:w-12 h-[1px] bg-white/20 group-hover:bg-[#14e6c0]/60 transition-colors" />
      </div>
    </section>
  );
};

export default SolutionsHero;
