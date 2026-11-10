import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GAMES } from '../config/games';
import { EarthBackground } from '../three/EarthBackground';
import { hubHealMask } from '../three/HealMask';
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
  const resetAllProgress = useGameStore((s) => s.resetAllProgress);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Smooth scroll to #play if URL hash matches
  useEffect(() => {
    if (location.hash === '#play') {
      setTimeout(() => {
        const el = document.getElementById('play');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [location.hash]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetConfirm = () => {
    resetAllProgress();
    setShowResetConfirm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-emerald-500 selection:text-black">
      {/* ── Fixed Decorative 3D Earth (Always Polluted, Slow Spin, Zero Game Progress) ── */}
      <EarthBackground
        health={0}
        healMaskManager={hubHealMask}
        liteMode={liteMode}
        enableOrbit={false}
        customCameraZ={3.2}
        spinRate={0.010}
      />

      {/* ── Scrim Vignette Overlay for Crisp Readability ── */}
      <div className="fixed inset-0 z-0 bg-radial from-transparent via-[#030712]/75 to-[#030712]/95 pointer-events-none" />

      {/* ── Fixed Top Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md bg-slate-950/40 border-b border-white/5">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Leaf className="w-4 h-4 text-[#4ade80]" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight">
            EcoFuture
          </span>
        </button>

        {/* Nav Links */}
        <nav className="flex items-center gap-4 sm:gap-6 font-label uppercase text-xs tracking-[0.18em]">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Solutions
          </button>
          <button
            onClick={() => scrollToSection('play')}
            className="text-[#4ade80] hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
          >
            Play Games
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

      {/* ── Main Scrolling Content ── */}
      <main className="relative z-10 pt-28 sm:pt-36 pb-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-24 sm:space-y-32">
        {/* ── 1. Hero Section ── */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-6 sm:pt-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#4ade80] font-label text-[11px] font-semibold tracking-[0.22em] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#4ade80]" />
            Proven Climate Action
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05]">
            Solutions that <span className="text-[#4ade80]">already work.</span>
          </h1>

          <p className="font-body font-light text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            Practical, scalable strategies to eliminate waste, restore nature, and reverse planetary decline.
          </p>

          <div className="pt-8">
            <button
              onClick={() => scrollToSection('solutions-grid')}
              className="inline-flex flex-col items-center gap-2 text-white/50 hover:text-[#4ade80] transition-colors cursor-pointer text-xs font-label uppercase tracking-[0.18em]"
            >
              <span>Explore Solutions</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </section>

        {/* ── 2. Solutions Grid (6 Glass Cards) ── */}
        <section id="solutions-grid" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-[#4ade80]">
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
                  className="p-6 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 hover:bg-slate-950/85 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#4ade80] group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-body font-light text-xs sm:text-sm text-white/70 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {(item.source || item.fact) && (
                    <div className="pt-5 mt-4 border-t border-white/5">
                      <span className="font-mono text-[10px] text-emerald-400/80 block">
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#4ade80] font-label text-[10px] font-semibold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3 text-[#4ade80]" />
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
            <div className="p-6 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_0_24px_rgba(74,222,128,0.12)] flex flex-col justify-between space-y-6 relative overflow-hidden">
              {cleanup.completed && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-label font-bold uppercase tracking-wider">
                  <Check className="w-3 h-3 text-[#4ade80]" /> Restored
                </div>
              )}

              <div className="space-y-3">
                <span className="font-label uppercase text-[10px] tracking-[0.2em] text-[#4ade80] font-semibold">
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
                  <span className="font-mono font-bold text-[#4ade80]">
                    {cleanup.health}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.max(cleanup.health, 2)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => navigate('/clean')}
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
                onClick={() => navigate('/quiz')}
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

        {/* ── 4. Footer & Licences ── */}
        <footer className="pt-16 border-t border-white/10 space-y-8 text-xs text-white/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="font-display font-bold text-sm text-white block">
                EcoFuture Platform
              </span>
              <p className="font-body text-xs text-white/60 leading-relaxed">
                An interactive environmental simulation dedicated to raising awareness for zero-waste practices and clean renewable energy.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-label uppercase text-[11px] font-semibold text-white/80 tracking-wider block">
                Data Sources & Benchmarks
              </span>
              <ul className="space-y-1 text-white/50 font-body text-xs">
                <li>• UNEP (Turning off the Tap 2023)</li>
                <li>• Ember Global Electricity Review 2024</li>
                <li>• FAO Forest Resources Assessment 2024</li>
                <li>• IPCC Climate & Land Special Report</li>
                <li>• ESA Space Debris Office 2024</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-label uppercase text-[11px] font-semibold text-white/80 tracking-wider block">
                Credits & Assets
              </span>
              <p className="text-white/50 font-body text-xs leading-relaxed">
                Earth textures courtesy of NASA Visible Earth (Blue Marble). 3D rendering powered by Three.js & React Three Fiber.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/hashirkonnola2006-design/terracode"
                target="_blank"
                rel="noreferrer"
                className="font-label uppercase text-[11px] tracking-wider hover:text-[#4ade80] transition-colors inline-flex items-center gap-1.5"
              >
                <Code2 className="w-4 h-4" /> GitHub Repository
              </a>
              <span className="font-label uppercase text-[11px] tracking-wider text-white/70">
                TerraCode 2026
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Reset All Progress Link */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-red-400/70 hover:text-red-400 font-label uppercase text-[11px] tracking-wider transition-colors cursor-pointer"
              >
                Reset All Progress
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Reset Confirmation Dialog ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-950 border border-red-500/40 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-white">
              Reset All Game Progress?
            </h3>
            <p className="font-body text-xs text-white/70 leading-relaxed">
              This will clear both the Cleanup Mission and Zero-Waste Quiz progress, scores, and saved Earth states. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solutions;

