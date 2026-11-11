import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { SolutionsHero, SolutionsHealBackground } from '../components/solutions/SolutionsHero';
import { SolutionsHeroScene } from '../components/solutions/SolutionsHeroScene';
import { DamageSection } from '../components/solutions/DamageSection';
import { SixPillarsSection } from '../components/solutions/SixPillarsSection';
import { PlaySection } from '../components/solutions/PlaySection';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { Footer } from '../components/Footer/Footer';
import { SoundControl } from '../components/audio/SoundControl';
import { musicEngine } from '../audio/musicEngine';
import { initGlobeScrollTriggers, refreshGlobeScrollTriggers } from '../config/globeScrollManager';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'hero', hash: '', label: 'Home', num: '01' },
  { id: 'damage', hash: '#damage', label: 'Damage', num: '02' },
  { id: 'solutions', hash: '#solutions', label: 'Solutions', num: '03' },
  { id: 'play', hash: '#play', label: 'Play Games', num: '04' },
];

export const Solutions = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cleanup = useGameStore((s) => s.cleanup);
  const liteMode = useGameStore((s) => s.liteMode);

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isSceneVisible, setIsSceneVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollProgressRef = useRef(0);
  const lastHashRef = useRef('');
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const userCleanProgress = (cleanup?.health || 0) / 100;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    document.title = 'TerraHeal | Solutions';
  }, []);

  // ── One-Time LocalStorage Cleanup for Deleted "Your Impact" Keys ──
  useEffect(() => {
    try {
      localStorage.removeItem('terraheal_pledge_streak');
      localStorage.removeItem('terraheal_impact_answers');
      localStorage.removeItem('terraheal_impact_score');
    } catch (_) {}
  }, []);

  // Initialize continuous GSAP ScrollTriggers connecting every section pair
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const cleanupTriggers = initGlobeScrollTriggers(isMobile);

    const handleResize = () => {
      const mobileNow = window.innerWidth < 768;
      initGlobeScrollTriggers(mobileNow);
      refreshGlobeScrollTriggers();
    };

    const handleSceneReady = () => {
      refreshGlobeScrollTriggers();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('terraheal:scene-ready', handleSceneReady);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        refreshGlobeScrollTriggers();
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('terraheal:scene-ready', handleSceneReady);
      cleanupTriggers();
    };
  }, []);

  // Tab visibility listener for 60fps performance optimization
  useEffect(() => {
    const handleVis = () => {
      setIsSceneVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on click outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Section scroll executor with header height offset
  const scrollToSection = useCallback(
    (id) => {
      if (id === 'hero') {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
          lastHashRef.current = '';
        }
        setActiveSection('hero');
        return;
      }

      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        const targetHash = `#${id}`;
        window.history.replaceState(null, '', targetHash);
        lastHashRef.current = targetHash;
        setActiveSection(id);
      }
    },
    [prefersReducedMotion]
  );

  // Scroll listener for top header styling, progress line, and scroll-spy with URL hash sync
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollPos = window.scrollY;
        setHeaderScrolled(scrollPos > 20);

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(Math.max(scrollPos / maxScroll, 0.0), 1.0);
        scrollProgressRef.current = progress;
        setScrollPercent(progress * 100);

        const damageEl = document.getElementById('damage');
        const solutionsEl = document.getElementById('solutions');
        const playEl = document.getElementById('play');

        // Scroll spy detection with threshold offsets
        let detected = 'hero';
        if (scrollPos < 250) {
          detected = 'hero';
        } else if (playEl && scrollPos >= playEl.offsetTop - 320) {
          detected = 'play';
        } else if (solutionsEl && scrollPos >= solutionsEl.offsetTop - 320) {
          detected = 'solutions';
        } else if (damageEl && scrollPos >= damageEl.offsetTop - 340) {
          detected = 'damage';
        } else {
          detected = 'hero';
        }

        setActiveSection(detected);

        // Quietly update URL hash without jump or history clutter
        const expectedHash = detected === 'hero' ? '' : `#${detected}`;
        if (window.location.hash !== expectedHash && lastHashRef.current !== expectedHash) {
          lastHashRef.current = expectedHash;
          const newUrl = expectedHash ? expectedHash : window.location.pathname;
          window.history.replaceState(null, '', newUrl);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Music Engine mood according to active section
  useEffect(() => {
    musicEngine.setSection(activeSection);
  }, [activeSection]);

  // STRICT ZERO HEALING ON SCROLL:
  // Globe stays damaged (0.0) throughout Hero, Damage, and Six Pillars.
  // Real gameplay progress in Cleanup Mission in #play is the only driver of healing.
  const activeStoryHeal = activeSection === 'play' && userCleanProgress > 0 ? userCleanProgress : 0.0;

  // Initial URL hash navigation on load (e.g. #damage, #solutions, #play, #sources)
  useEffect(() => {
    const rawHash = location.hash.replace('#', '');
    if (rawHash === 'sources') {
      navigate('/sources', { replace: true });
      return;
    }

    if (rawHash && ['damage', 'solutions', 'play'].includes(rawHash)) {
      const timer = setTimeout(() => {
        scrollToSection(rawHash);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [location.hash, navigate, scrollToSection]);

  const handleNavClick = (id) => {
    musicEngine.playClick();
    scrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[#0becc2] selection:text-black">
      {/* ── Accessible Skip to Content Link ── */}
      <a
        href="#damage"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection('damage');
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#14e6c0] focus:text-black focus:font-semibold focus:text-xs focus:tracking-wider focus:uppercase focus:rounded-sm focus:outline-none shadow-2xl"
      >
        Skip to content
      </a>

      {/* ── Fixed Top Header (All 4 Sections One Click Away) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300 ${
          headerScrolled || mobileMenuOpen
            ? 'backdrop-blur-md bg-slate-950/85 border-b border-white/10 shadow-lg'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Logo (Clicks to Top / Home) */}
        <button
          type="button"
          onClick={() => handleNavClick('hero')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] rounded-sm cursor-pointer"
          aria-label="TerraHeal Home"
        >
          <TerraHealLogo markSize={28} textClass="text-base sm:text-lg font-bold" />
        </button>

        {/* Nav Links (Desktop) — Home, Damage, Solutions, Play Games */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 font-label uppercase text-xs tracking-[0.16em]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => musicEngine.playHover()}
                className={`transition-colors cursor-pointer relative py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] rounded-sm ${
                  isActive
                    ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#14e6c0]'
                    : item.id === 'play'
                    ? 'text-[#14e6c0]/90 hover:text-[#14e6c0]'
                    : 'text-white/60 hover:text-white'
                }`}
                aria-current={isActive ? 'location' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Sound & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <SoundControl />

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => {
              musicEngine.playClick();
              setMobileMenuOpen((prev) => !prev);
            }}
            className="md:hidden p-1.5 text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] rounded-sm"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#14e6c0]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Slim 1.5px Scroll Progress Indicator Line ── */}
        <div
          className="absolute bottom-0 left-0 h-[1.5px] bg-[#14e6c0] pointer-events-none transition-[width] duration-100 ease-out"
          style={{ width: `${scrollPercent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(scrollPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Page scroll progress"
        />
      </header>

      {/* ── Mobile Drawer Sheet (Large Type, Keyboard Accessible, Backdrop Blur) ── */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          ref={mobileMenuRef}
          className="fixed top-[57px] left-0 right-0 z-30 md:hidden backdrop-blur-2xl bg-black/95 border-b border-white/10 px-6 py-6 space-y-2 shadow-2xl transition-all duration-200"
          role="dialog"
          aria-label="Mobile Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full py-3 px-3 flex items-center justify-between text-left rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14e6c0] ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-[#14e6c0]'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
                }`}
                aria-current={isActive ? 'location' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-xs text-[#14e6c0]/70">{item.num}</span>
                  <span className="font-display text-lg tracking-tight">{item.label}</span>
                </div>
                {isActive ? (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#14e6c0]">Active</span>
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-white/30" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 0. Fixed Global Space Starfield & Vignette Overlay (Layer z-0) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 45%, rgba(5,5,5,0.40) 75%, rgba(5,5,5,0.85) 100%)',
          }}
        />
      </div>

      {/* ── 0B. Giant "HEAL" Background Typography (Layer z-[2] - strictly behind 3D Earth) ── */}
      <SolutionsHealBackground />

      {/* ── 1. Single Global 3D Globe Layer (Layer z-[5] - sits in front of HEAL, behind UI) ── */}
      <div className="fixed inset-0 z-[5] pointer-events-none">
        <SolutionsHeroScene
          isVisible={isSceneVisible}
          liteMode={liteMode}
          scrollProgressRef={scrollProgressRef}
          userCleanProgress={userCleanProgress}
          storyHealProgress={activeStoryHeal}
        />
      </div>

      {/* ── 2. Full-Screen Solutions Hero (Layer z-10) ── */}
      <div id="hero" className="relative z-10 w-full bg-transparent">
        <SolutionsHero
          onScrollToPillars={() => scrollToSection('damage')}
          onScrollToPlay={() => scrollToSection('play')}
        />
      </div>

      {/* ── 3. Designed Editorial Story Flow (Layer z-10) ── */}
      <div className="relative z-10 bg-transparent">
        <main className="w-full">
          {/* SECTION 1: "THE DAMAGE" (Between Hero and Six Pillars) */}
          <DamageSection onScrollToPillars={() => scrollToSection('solutions')} />

          {/* SECTION 2: "SIX PILLARS" (Redesigned Editorial 2-Column, No Cards) */}
          <SixPillarsSection onScrollToPlay={() => scrollToSection('play')} />

          {/* SECTION 3: "PLAY GAMES" (#play) - Minimal Editorial Row Flow */}
          <PlaySection />
        </main>

        {/* Global TerraHeal Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Solutions;
