import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { SolutionsHero, SolutionsHealBackground } from '../components/solutions/SolutionsHero';
import { SolutionsHeroScene } from '../components/solutions/SolutionsHeroScene';
import { DamageSection } from '../components/solutions/DamageSection';
import { SixPillarsSection } from '../components/solutions/SixPillarsSection';
import { YourImpactSection } from '../components/solutions/YourImpactSection';
import { SectionFade } from '../components/Common/SectionFade';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { Footer } from '../components/Footer/Footer';
import { navigateWithTransition } from '../utils/navigation';
import { SoundControl } from '../components/audio/SoundControl';
import { musicEngine } from '../audio/musicEngine';
import { initGlobeScrollTriggers, refreshGlobeScrollTriggers } from '../config/globeScrollManager';
import { Sparkles, ArrowRight, Lock, Check } from 'lucide-react';

export const Solutions = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cleanup = useGameStore((s) => s.cleanup);
  const quiz = useGameStore((s) => s.quiz);
  const liteMode = useGameStore((s) => s.liteMode);

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState('home');
  const [currentSection, setCurrentSection] = useState('hero');
  const [isSceneVisible, setIsSceneVisible] = useState(true);

  const scrollProgressRef = useRef(0);
  const userCleanProgress = (cleanup?.health || 0) / 100;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    document.title = 'TerraHeal | Solutions';
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

  // Scroll listener for top header styling and navbar scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setHeaderScrolled(scrollPos > 20);

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(Math.max(scrollPos / maxScroll, 0.0), 1.0);
      scrollProgressRef.current = progress;

      const damageEl = document.getElementById('damage');
      const solutionsEl = document.getElementById('solutions');
      const impactEl = document.getElementById('impact');
      const playEl = document.getElementById('play');

      let detectedSection = 'hero';
      let navTarget = 'home';

      // Guard top hero viewport explicitly
      if (scrollPos < 250) {
        detectedSection = 'hero';
        navTarget = 'home';
      } else if (playEl && playEl.offsetTop > 400 && scrollPos >= playEl.offsetTop - 300) {
        detectedSection = 'play';
        navTarget = 'play';
      } else if (impactEl && impactEl.offsetTop > 400 && scrollPos >= impactEl.offsetTop - 300) {
        detectedSection = 'impact';
        navTarget = 'solutions';
      } else if (solutionsEl && solutionsEl.offsetTop > 400 && scrollPos >= solutionsEl.offsetTop - 300) {
        detectedSection = 'pillars';
        navTarget = 'solutions';
      } else if (damageEl && damageEl.offsetTop > 400 && scrollPos >= damageEl.offsetTop - 320) {
        detectedSection = 'damage';
        navTarget = 'solutions';
      } else {
        detectedSection = 'hero';
        navTarget = 'home';
      }

      setCurrentSection(detectedSection);
      setActiveNavSection(navTarget);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Music Engine mood according to active section
  useEffect(() => {
    musicEngine.setSection(currentSection);
  }, [currentSection]);

  // STRICT ZERO HEALING ON SCROLL:
  // Globe stays damaged (0.0) the whole way down.
  // The only thing allowed to change the globe's heal state is real gameplay in Cleanup Mission
  // when the user reaches the #play section.
  const activeStoryHeal = currentSection === 'play' && userCleanProgress > 0 ? userCleanProgress : 0.0;

  // Smooth scroll to #play or redirect #sources
  useEffect(() => {
    if (location.hash === '#play') {
      setTimeout(() => {
        const el = document.getElementById('play');
        if (el) el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }, 150);
    } else if (location.hash === '#sources') {
      navigate('/sources', { replace: true });
    }
  }, [location.hash, navigate, prefersReducedMotion]);

  const handleHomeClick = () => {
    if (window.scrollY === 0) return;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const handleSolutionsClick = () => {
    const el = document.getElementById('damage');
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handlePlayClick = () => {
    const el = document.getElementById('play');
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[#0becc2] selection:text-black">
      {/* ── Fixed Top Header (Clean, short navigation) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300 ${
          headerScrolled
            ? 'backdrop-blur-md bg-slate-950/70 border-b border-white/10 shadow-lg'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Logo */}
        <TerraHealLogo markSize={28} textClass="text-base sm:text-lg font-bold" />

        {/* Nav Links (Desktop) — Home, Solutions, Play Games */}
        <nav className="hidden md:flex items-center gap-8 font-label uppercase text-xs tracking-[0.18em]">
          <button
            onClick={() => {
              musicEngine.playClick();
              handleHomeClick();
            }}
            onMouseEnter={() => musicEngine.playHover()}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'home'
                ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#14e6c0]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              musicEngine.playClick();
              handleSolutionsClick();
            }}
            onMouseEnter={() => musicEngine.playHover()}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'solutions'
                ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#14e6c0]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Solutions
          </button>
          <button
            onClick={() => {
              musicEngine.playClick();
              handlePlayClick();
            }}
            onMouseEnter={() => musicEngine.playHover()}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'play'
                ? 'text-[#14e6c0] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#14e6c0]'
                : 'text-[#14e6c0]/90 hover:text-[#14e6c0]'
            }`}
          >
            Play Games
          </button>
        </nav>

        {/* Nav Links (Mobile) */}
        <nav className="flex md:hidden items-center gap-3 font-label uppercase text-[10px] tracking-[0.14em]">
          <button
            onClick={() => {
              musicEngine.playClick();
              handleHomeClick();
            }}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'home' ? 'text-white font-semibold' : 'text-white/60'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              musicEngine.playClick();
              handleSolutionsClick();
            }}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'solutions' ? 'text-white font-semibold' : 'text-white/60'
            }`}
          >
            Solutions
          </button>
          <button
            onClick={() => {
              musicEngine.playClick();
              handlePlayClick();
            }}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'play' ? 'text-[#14e6c0] font-semibold' : 'text-[#14e6c0]/80'
            }`}
          >
            Play
          </button>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <SoundControl />
        </div>
      </header>

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
          {/* SECTION 1: "THE DAMAGE" (New, between Hero and Six Pillars) */}
          <DamageSection onScrollToPillars={() => scrollToSection('solutions')} />

          {/* SECTION 2: "SIX PILLARS" (Redesigned Editorial 2-Column, No Cards) */}
          <SixPillarsSection onScrollToImpact={() => scrollToSection('impact')} />

          {/* SECTION 3: "YOUR IMPACT" (New Personal Alignment Check & 7-Day Challenge) */}
          <YourImpactSection onScrollToPlay={() => scrollToSection('play')} />

          {/* SECTION 4: "PLAY GAMES" (#play) */}
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
            <SectionFade>
              <section id="play" className="space-y-10 scroll-mt-24">
                <div className="text-center space-y-2 relative">
                  <div className="absolute -inset-6 bg-slate-950/60 blur-2xl -z-10 rounded-full pointer-events-none" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14e6c0]/10 border border-[#14e6c0]/25 text-[#14e6c0] font-label text-[10px] font-semibold tracking-[0.2em] uppercase">
                    <Sparkles className="w-3 h-3 text-[#14e6c0]" />
                    Interactive Restorations
                  </div>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                    Play to heal the planet.
                  </h2>
                  <p className="font-body font-light text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
                    Choose an interactive simulation to test your skills and heal Earth with your own hands.
                    Progress is linked directly to the living planet above.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Cleanup Mission */}
                  <div className="p-6 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-[#14e6c0]/30 shadow-[0_0_24px_rgba(20,230,192,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
                    {cleanup.completed && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#14e6c0]/20 border border-[#14e6c0]/40 text-[#5df7d9] text-[10px] font-label font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3 text-[#14e6c0]" /> Restored
                      </div>
                    )}

                    <div className="space-y-3">
                      <span className="font-label uppercase text-[10px] tracking-[0.2em] text-[#14e6c0] font-semibold">
                        Game 1 • Hands-on Sim
                      </span>
                      <h3 className="font-display font-extrabold text-xl text-white">
                        Cleanup Mission
                      </h3>
                      <p className="font-body font-light text-xs text-white/70 leading-relaxed">
                        Clear orbital debris, reforest degraded continents, convert industrial smog, and sweep oceanic plastic gyres.
                      </p>
                    </div>

                    {/* Cleanup Progress */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-label uppercase text-[10px] tracking-wider text-white/60">
                          Planet Health
                        </span>
                        <span className="font-mono font-bold text-[#14e6c0]">
                          {cleanup.health}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#14e6c0] to-[#5df7d9] transition-all duration-500"
                          style={{ width: `${Math.max(cleanup.health, 2)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => navigateWithTransition('/clean', navigate)}
                      className="btn-aerospace-primary w-full text-xs py-3 cursor-pointer"
                    >
                      {cleanup.completed
                        ? 'Play Again'
                        : cleanup.health > 0
                        ? 'Continue Mission'
                        : 'Start Cleaning'}
                    </button>
                  </div>

                  {/* Card 2: Zero-Waste Quiz */}
                  <div className="p-6 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-sky-500/30 shadow-[0_0_24px_rgba(56,189,248,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
                    {quiz.completed && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-label font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3 text-sky-400" /> Completed
                      </div>
                    )}

                    <div className="space-y-3">
                      <span className="font-label uppercase text-[10px] tracking-[0.2em] text-sky-400 font-semibold">
                        Game 2 • Knowledge Sim
                      </span>
                      <h3 className="font-display font-extrabold text-xl text-white">
                        Zero-Waste Quiz
                      </h3>
                      <p className="font-body font-light text-xs text-white/70 leading-relaxed">
                        10 questions on circular recycling, composting, and zero-waste habits. Every correct answer visibly heals Earth.
                      </p>
                    </div>

                    {/* Quiz Progress & Best Score */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-label uppercase text-[10px] tracking-wider text-white/60">
                          Best Score
                        </span>
                        <span className="font-mono font-bold text-sky-400">
                          {quiz.bestScore > 0 ? `${quiz.bestScore} / 10` : 'Not played yet'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${Math.max(quiz.bestScore * 10, 2)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => navigateWithTransition('/quiz', navigate)}
                      className="btn-aerospace-secondary w-full text-xs py-3 cursor-pointer"
                    >
                      {quiz.completed
                        ? 'Retake Quiz'
                        : quiz.bestScore > 0
                        ? 'Improve Score'
                        : 'Start Quiz'}
                    </button>
                  </div>

                  {/* Card 3: System Simulation (Coming Soon) */}
                  <div className="p-6 rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/5 flex flex-col justify-between space-y-6 relative opacity-75">
                    <div className="space-y-3">
                      <span className="font-label uppercase text-[10px] tracking-[0.2em] text-white/40 font-semibold">
                        Game 3 • City Sim
                      </span>
                      <h3 className="font-display font-extrabold text-xl text-white/80">
                        Circular City
                      </h3>
                      <p className="font-body font-light text-xs text-white/50 leading-relaxed">
                        Balance urban energy grids, organic compost sorting, and material reuse loops across a living metropolis.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-white/40 text-xs font-mono">
                        <Lock className="w-3.5 h-3.5 text-white/40" />
                        <span>In Development</span>
                      </div>
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-label text-xs uppercase tracking-wider bg-white/5 text-white/30 cursor-not-allowed border border-white/5 text-center"
                      >
                        Locked
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </SectionFade>
          </div>
        </main>

        {/* Global TerraHeal Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Solutions;
