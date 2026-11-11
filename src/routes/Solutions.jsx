import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GAMES } from '../config/games';
import { SolutionsHero } from '../components/solutions/SolutionsHero';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { Footer } from '../components/Footer/Footer';
import { navigateWithTransition } from '../utils/navigation';
import {
  Leaf,
  Sparkles,
  HelpCircle,
  Lock,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Code2,
  ShieldCheck,
  RefreshCw,
  Recycle,
  Sprout,
  Sun,
  Trees,
  Scissors,
  Check,
  AlertTriangle,
} from 'lucide-react';

const SOLUTION_CARDS = [
  {
    id: 'reduce',
    icon: Scissors,
    title: '1. Reduce',
    desc: 'Cut waste at the source before it ever exists. Avoiding disposable products and excess packaging is the most impactful climate action.',
    fact: 'Prevention precedes all recycling.',
  },
  {
    id: 'reuse',
    icon: RefreshCw,
    title: '2. Reuse',
    desc: 'Repair, refill, repurpose, and share everyday containers and equipment to keep materials circulating at peak utility.',
    fact: 'Reusables displace hundreds of single-use items.',
  },
  {
    id: 'recycle',
    icon: Recycle,
    title: '3. Recycle',
    desc: 'Sort, rinse, and recover infinite materials like glass and aluminum. Up to 80% of ocean plastic leakage can be halted by 2040.',
    source: 'UN Environment Programme (UNEP 2023)',
  },
  {
    id: 'compost',
    icon: Sprout,
    title: '4. Compost',
    desc: 'Divert kitchen scraps and yard trimmings from anaerobic landfills into nutrient-rich humus that feeds living soils and retains water.',
    fact: 'Prevents potent methane emissions.',
  },
  {
    id: 'energy',
    icon: Sun,
    title: '5. Clean Energy',
    desc: 'Electrify regional grids with solar, wind, and battery storage to replace fossil smog. Renewables supplied 30% of global electricity in 2023.',
    source: 'Ember Global Electricity Review 2024',
  },
  {
    id: 'nature',
    icon: Trees,
    title: '6. Restore Nature',
    desc: 'Replant native biomes and safeguard living wetlands and oceans. Intact forests sequester 7.6 billion metric tonnes of CO2 net every year.',
    source: 'FAO Global Forest Assessment 2024',
  },
];

export const Solutions = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cleanup = useGameStore((s) => s.cleanup);
  const quiz = useGameStore((s) => s.quiz);
  const liteMode = useGameStore((s) => s.liteMode);
  const toggleLiteMode = useGameStore((s) => s.toggleLiteMode);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeNavSection, setActiveNavSection] = useState('home');

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    document.title = 'TerraHeal | Solutions';
  }, []);

  // Scroll listener for top header styling and active nav section highlighting
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setHeaderScrolled(scrollPos > 20);

      const playEl = document.getElementById('play');
      const solutionsEl = document.getElementById('solutions-grid');

      if (scrollPos < 120) {
        setActiveNavSection('home');
      } else if (playEl && scrollPos >= playEl.offsetTop - 280) {
        setActiveNavSection('play');
      } else if (solutionsEl && scrollPos >= solutionsEl.offsetTop - 300) {
        setActiveNavSection('solutions');
      } else {
        setActiveNavSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const el = document.getElementById('solutions-grid');
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
      {/* ── Fixed Top Header (Transparent over hero, border appears after scrolling) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300 ${
          headerScrolled
            ? 'backdrop-blur-md bg-slate-950/70 border-b border-white/10 shadow-lg'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Logo */}
        <TerraHealLogo markSize={28} textClass="text-base sm:text-lg font-bold" />

        {/* Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 font-label uppercase text-xs tracking-[0.18em]">
          <button
            onClick={handleHomeClick}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'home'
                ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0becc2]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={handleSolutionsClick}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'solutions'
                ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0becc2]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Solutions
          </button>
          <button
            onClick={handlePlayClick}
            className={`transition-colors cursor-pointer relative py-1 ${
              activeNavSection === 'play'
                ? 'text-[#0becc2] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0becc2]'
                : 'text-[#0becc2]/80 hover:text-[#0becc2]'
            }`}
          >
            Play Games
          </button>
        </nav>

        {/* Nav Links (Mobile) */}
        <nav className="flex md:hidden items-center gap-3 font-label uppercase text-[10px] tracking-[0.14em]">
          <button
            onClick={handleHomeClick}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'home' ? 'text-white font-semibold' : 'text-white/60'
            }`}
          >
            Home
          </button>
          <button
            onClick={handleSolutionsClick}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'solutions' ? 'text-white font-semibold' : 'text-white/60'
            }`}
          >
            Solutions
          </button>
          <button
            onClick={handlePlayClick}
            className={`transition-colors cursor-pointer py-1 ${
              activeNavSection === 'play' ? 'text-[#0becc2] font-semibold' : 'text-[#0becc2]/70'
            }`}
          >
            Play
          </button>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Audio */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg backdrop-blur-md border text-xs transition-colors cursor-pointer ${
              muted
                ? 'bg-slate-900/80 border-white/10 text-slate-500'
                : 'bg-slate-900/80 border-white/20 text-emerald-400 hover:bg-white/[0.08]'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
            aria-label="Toggle sound"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Lite Mode */}
          <button
            onClick={toggleLiteMode}
            className={`p-2 rounded-lg backdrop-blur-md border text-xs transition-colors cursor-pointer ${
              liteMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={liteMode ? 'Switch to Cinematic High-DPI' : 'Switch to Eco/Lite Mode'}
            aria-label="Toggle Lite Mode"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── 1. Rebuilt Full-Screen Solutions Hero (Reference Match) ── */}
      <SolutionsHero
        liteMode={liteMode}
        onScrollToPillars={() => scrollToSection('solutions-grid')}
      />

      {/* ── Content Below Hero: Solid #050505 Background (No WebGL) ── */}
      <div className="relative z-20 bg-[#050505]">
        <main className="pt-20 sm:pt-28 pb-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-24 sm:space-y-32">
          {/* ── 2. Solutions Grid (6 Glass Cards) ── */}
          <section id="solutions-grid" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-[#0becc2]">
              The Restoration Playbook
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Six Pillars of Planetary Healing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SOLUTION_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-[#0becc2]/40 hover:bg-slate-950/85 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-[#0becc2]/10 border border-[#0becc2]/25 flex items-center justify-center text-[#0becc2] group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-[#5df7d9] transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body font-light text-xs sm:text-sm text-white/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {(item.source || item.fact) && (
                    <div className="pt-5 mt-4 border-t border-white/5">
                      <span className="font-mono text-[10px] text-[#0becc2]/80 block">
                        {item.source ? `Data: ${item.source}` : `Key: ${item.fact}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Interactive Games Section (#play) ── */}
        <section id="play" className="space-y-8 scroll-mt-24 pt-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0becc2]/10 border border-[#0becc2]/25 text-[#0becc2] font-label text-[10px] font-semibold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-[#0becc2]" />
              Interactive Restorations
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Play to heal the planet.
            </h2>
            <p className="font-body font-light text-sm sm:text-base text-white/70 max-w-xl mx-auto">
              Choose a simulation to test your skills and heal Earth with your own hands. Every game is completely separate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Cleanup Mission */}
            <div className="p-6 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-[#0becc2]/30 shadow-[0_0_24px_rgba(11,236,194,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
              {cleanup.completed && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0becc2]/20 border border-[#0becc2]/40 text-[#5df7d9] text-[10px] font-label font-bold uppercase tracking-wider">
                  <Check className="w-3 h-3 text-[#0becc2]" /> Restored
                </div>
              )}

              <div className="space-y-3">
                <span className="font-label uppercase text-[10px] tracking-[0.2em] text-[#0becc2] font-semibold">
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
                  <span className="font-mono font-bold text-[#0becc2]">
                    {cleanup.health}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0becc2] to-[#5df7d9] transition-all duration-500"
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
                className="w-full py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-extrabold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_16px_rgba(56,189,248,0.3)] hover:shadow-[0_0_24px_rgba(56,189,248,0.5)] flex items-center justify-center gap-2"
              >
                <span>{quiz.completed ? 'Retake Quiz' : 'Play Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Game 3 Placeholder (Coming Soon) */}
            <div className="p-6 rounded-2xl bg-slate-950/40 backdrop-blur-xl border border-white/5 opacity-60 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="font-label uppercase text-[10px] tracking-[0.2em] text-white/40 font-semibold block">
                  Game 3 • In Development
                </span>
                <h3 className="font-display font-extrabold text-xl text-white/70">
                  Climate Strategy
                </h3>
                <p className="font-body font-light text-xs text-white/50 leading-relaxed">
                  A new interactive mission is on the way. Deploy global clean policies and community energy grids.
                </p>
              </div>

              <div className="pt-6">
                <div className="w-full py-3 rounded-full bg-white/5 text-white/30 font-display text-xs text-center border border-white/5 uppercase tracking-wider font-semibold">
                  Locked (Coming Soon)
                </div>
              </div>
            </div>
          </div>
        </section>

        </main>

        {/* ── Shared Minimal Footer ── */}
        <Footer />
      </div>
    </div>
  );
};

export default Solutions;

