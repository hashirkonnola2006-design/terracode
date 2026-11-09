import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import {
  Download,
  Share2,
  RotateCcw,
  Check,
  Heart,
  Globe2,
  ExternalLink,
  ShieldCheck,
  Code2,
  Zap,
} from 'lucide-react';

export const EndingScreen = () => {
  const cleanliness = useGameStore((s) => s.cleanliness);
  const itemsCollected = useGameStore((s) => s.itemsCollected);
  const co2Absorbed = useGameStore((s) => s.co2Absorbed);
  const m3 = useGameStore((s) => s.mission3);
  const pledges = useGameStore((s) => s.pledges);
  const addPledge = useGameStore((s) => s.addPledge);
  const restartGame = useGameStore((s) => s.restartGame);
  const liteMode = useGameStore((s) => s.liteMode);
  const toggleLiteMode = useGameStore((s) => s.toggleLiteMode);

  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only render when Earth has reached 100% cleanliness
  if (cleanliness < 100) return null;

  // Capture canvas to PNG
  const handleDownloadScreenshot = () => {
    setDownloading(true);
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `EcoFuture-Clean-Earth-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.warn('Screenshot capture failed:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  // Share impact
  const handleShare = async () => {
    const text = `I just restored Earth to 100% on EcoFuture! Cleaned ${itemsCollected} items and planted ${m3.plantedPatches.length} forests. Together we can build a green tomorrow.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EcoFuture — Green Tomorrow',
          text,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 sm:p-8 flex flex-col justify-end pointer-events-auto animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto w-full pt-24 pb-8 space-y-8">
        
        {/* ── 1. Victory Headline & Subtext ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-widest uppercase">
            <Globe2 className="w-3.5 h-3.5" /> Planet Earth Fully Restored
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            This is the Tomorrow We Can Build
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            You cleaned <span className="text-emerald-400 font-bold">{itemsCollected}</span> orbital debris items and restored{' '}
            <span className="text-emerald-400 font-bold">{m3.plantedPatches.length}</span> native forest biomes. Imagine what we can achieve together.
          </p>
        </div>

        {/* ── 2. Results & Action Bar ── */}
        <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-700/60 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Global Health</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">100%</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Items Collected</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-white">{itemsCollected}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CO2 Sequestered</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-teal-300">
                {(co2Absorbed / 1000).toFixed(1)}t
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Your Pledges</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-amber-300">
                {pledges.length}/3
              </span>
            </div>
          </div>

          {/* Screenshot & Share Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownloadScreenshot}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Capturing...' : 'Download My Clean Earth'}
            </button>

            <button
              onClick={handleShare}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Link Copied!' : 'Share Impact'}
            </button>

            <button
              onClick={restartGame}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 border border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Play Again
            </button>
          </div>
        </div>

        {/* ── 3. Real-World Action Cards with Pledges ── */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              Take Real-World Action Today
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GAME_CONFIG.PLEDGES.map((item) => {
              const isPledged = pledges.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl backdrop-blur-xl border transition-all ${
                    isPledged
                      ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    {item.category}
                  </span>
                  <h4 className="text-base font-bold text-white mb-2">{item.action}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <span className="text-[10px] text-slate-400 block mb-4 font-mono">
                    Impact: {item.impact}
                  </span>

                  <button
                    onClick={() => addPledge(item.id)}
                    disabled={isPledged}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isPledged
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isPledged ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Pledged
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5" /> Take This Pledge
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Competition Footer (Only displayed at game completion) ── */}
        <footer className="pt-8 border-t border-slate-800/80 text-center space-y-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://github.com/hashirkonnola2006-design/terracode"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <Code2 className="w-4 h-4" /> GitHub Repository
            </a>
            <span className="inline-flex items-center gap-1.5 text-slate-300 font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Built for TerraCode 2026
            </span>
            <button
              onClick={toggleLiteMode}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Display: {liteMode ? 'Lite Mode' : 'Cinematic High-DPI'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Data & scientific benchmarks sourced from <span className="text-slate-300">UNEP</span>, <span className="text-slate-300">IRENA</span>,{' '}
            <span className="text-slate-300">Ember Energy Review 2024</span>, <span className="text-slate-300">FAO FRA 2024</span>, and{' '}
            <span className="text-slate-300">IUCN</span>. Earth textures courtesy of NASA Blue Marble and Visible Earth. Procedural shaders powered by Three.js & Ashima simplex noise.
          </p>
        </footer>

      </div>
    </div>
  );
};

export default EndingScreen;
