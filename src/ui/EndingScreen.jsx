import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
} from 'lucide-react';

export const EndingScreen = () => {
  const navigate = useNavigate();
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
        link.download = `TerraHeal-Clean-Earth-${Date.now()}.png`;
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
    const text = `I just restored Earth to 100% on TerraHeal! Cleaned ${itemsCollected} items and planted ${m3.plantedPatches.length} forests. Together we can heal our planet.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TerraHeal — Green Tomorrow',
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
    <div className="fixed inset-0 z-40 overflow-y-auto bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 sm:p-8 flex flex-col justify-start sm:justify-end pointer-events-auto animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto w-full pt-16 sm:pt-24 pb-8 space-y-6 sm:space-y-8">
        
        {/* ── 1. Victory Headline & Subtext ── */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0becc2]/10 border border-[#0becc2]/30 text-[#0becc2] font-label text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase">
            <Globe2 className="w-3.5 h-3.5" /> Planet Earth Fully Restored
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.08] sm:leading-[1.05]">
            This is the Tomorrow We Can Build
          </h2>
          <p className="font-body font-light text-xs sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
            You cleaned <span className="text-[#0becc2] font-semibold font-mono tabular-nums">{itemsCollected}</span> orbital debris items and restored{' '}
            <span className="text-[#0becc2] font-semibold font-mono tabular-nums">{m3.plantedPatches.length}</span> native forest biomes. Imagine what we can achieve together.
          </p>
        </div>

        {/* ── 2. Results & Action Bar ── */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-center mb-6">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-label uppercase text-[11px] tracking-[0.2em] text-white/60 block mb-1">Global Health</span>
              <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#0becc2]">100%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-label uppercase text-[11px] tracking-[0.2em] text-white/60 block mb-1">Items Collected</span>
              <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-white">{itemsCollected}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-label uppercase text-[11px] tracking-[0.2em] text-white/60 block mb-1">CO2 Sequestered</span>
              <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-teal-300">
                {(co2Absorbed / 1000).toFixed(1)}t
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-label uppercase text-[11px] tracking-[0.2em] text-white/60 block mb-1">Your Pledges</span>
              <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-amber-300">
                {pledges.length}/3
              </span>
            </div>
          </div>

          {/* Screenshot & Share Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleDownloadScreenshot}
              disabled={downloading}
              className="btn-aerospace-primary text-[12px] py-2.5 px-5"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Capturing...' : 'Download My Clean Earth'}
            </button>

            <button
              onClick={handleShare}
              className="btn-aerospace-secondary text-[12px] py-2.5 px-5"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Link Copied!' : 'Share Impact'}
            </button>

            <button
              onClick={restartGame}
              className="px-5 py-2.5 rounded-full bg-transparent hover:bg-white/[0.06] text-white/60 hover:text-white font-label text-[12px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 border border-white/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Play Again
            </button>

            <button
              onClick={() => navigate('/solutions#play')}
              className="px-5 py-2.5 rounded-full bg-[#0becc2]/20 hover:bg-[#0becc2]/30 text-[#0becc2] font-label text-[12px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 border border-[#0becc2]/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Hub
            </button>
          </div>
        </div>

        {/* ── 3. Real-World Action Cards with Pledges ── */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="font-label uppercase text-[12px] tracking-[0.25em] text-[#0becc2] font-semibold">
              Take Real-World Action Today
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GAME_CONFIG.PLEDGES.map((item) => {
              const isPledged = pledges.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl backdrop-blur-xl border transition-all duration-200 ${
                    isPledged
                      ? 'bg-[#0becc2]/10 border-[#0becc2]/40 ring-1 ring-[#0becc2]/20'
                      : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-label uppercase text-[11px] tracking-[0.2em] text-[#0becc2] font-semibold block mb-1">
                    {item.category}
                  </span>
                  <h4 className="font-display font-bold text-base text-white mb-2">{item.action}</h4>
                  <p className="font-body font-light text-xs text-white/70 leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <span className="font-mono tabular-nums text-[11px] text-white/50 block mb-4">
                    Impact: {item.impact}
                  </span>

                  <button
                    onClick={() => addPledge(item.id)}
                    disabled={isPledged}
                    className={`w-full py-2 px-3 rounded-full font-label text-[12px] font-semibold tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isPledged
                        ? 'bg-[#0becc2]/20 text-[#0becc2] border border-[#0becc2]/40 cursor-default'
                        : 'bg-white/[0.05] hover:bg-[#0becc2] hover:text-black text-white border border-white/20'
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
        <footer className="pt-8 border-t border-white/10 text-center space-y-4 text-xs text-white/50">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://github.com/hashirkonnola2006-design/terracode"
              target="_blank"
              rel="noreferrer"
              className="font-label uppercase text-[11px] tracking-[0.14em] inline-flex items-center gap-1.5 hover:text-[#0becc2] transition-colors"
            >
              <Code2 className="w-4 h-4" /> GitHub Repository
            </a>
            <span className="font-label uppercase text-[11px] tracking-[0.14em] inline-flex items-center gap-1.5 text-white/80 font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#0becc2]" /> Built for TerraCode 2026
            </span>
            <button
              onClick={toggleLiteMode}
              className="font-label uppercase text-[11px] tracking-[0.14em] hover:text-[#0becc2] transition-colors cursor-pointer"
            >
              Display: {liteMode ? 'Lite Mode' : 'Cinematic High-DPI'}
            </button>
          </div>

          <p className="font-mono text-[11px] text-white/40 max-w-2xl mx-auto leading-relaxed">
            Data & scientific benchmarks sourced from <span className="text-white/60">UNEP</span>, <span className="text-white/60">IRENA</span>,{' '}
            <span className="text-white/60">Ember Energy Review 2024</span>, <span className="text-white/60">FAO FRA 2024</span>, and{' '}
            <span className="text-white/60">IUCN</span>. Earth textures courtesy of NASA Blue Marble and Visible Earth. Procedural shaders powered by Three.js & Ashima simplex noise.
          </p>
        </footer>

      </div>
    </div>
  );
};

export default EndingScreen;
