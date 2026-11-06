import React, { useEffect, useState } from 'react';
import { EarthCanvas } from '../Earth/EarthCanvas';
import { ArrowDown, Sliders, X } from 'lucide-react';

interface HeroSectionProps {
  healProgress:    number;
  setHealProgress: (v: number) => void;
  isLowPower:      boolean;
  scrollRotation?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  healProgress,
  setHealProgress,
  isLowPower,
  scrollRotation = 0,
}) => {
  const [isDebug, setIsDebug]   = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('debug') === '1') { setIsDebug(true); setShowPanel(true); }
    }
  }, []);

  const scrollDown = () => {
    const el = document.getElementById('stats-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col items-center justify-center">

      {/* ── CSS nebula / space gradient (behind canvas) ──────────── */}
      {/* This div provides the dark navy space environment.
          The canvas is transparent so this shows through. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 48%,
              rgba(5,20,50,0.85) 0%,
              rgba(3,12,30,0.95) 55%,
              #030712 100%
            ),
            radial-gradient(ellipse 40% 30% at 50% 48%,
              rgba(0,60,80,0.18) 0%, transparent 70%)
          `,
        }}
      />

      {/* ── Soft vignette overlay (darkens corners, keeps text readable) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 42%, rgba(3,7,18,0.72) 100%)',
        }}
      />

      {/* ── 3-D Earth Canvas (absolute fill, behind text) ─────────── */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <EarthCanvas
          healProgress={healProgress}
          scrollRotation={scrollRotation}
          isLowPower={isLowPower}
        />
      </div>

      {/* ── Centered Hero Text (z-30, above canvas & vignette) ─────── */}
      <div className="relative z-30 flex flex-col items-center text-center px-6 select-none pointer-events-none">
        <h1 className="
          font-display font-extrabold
          text-5xl sm:text-6xl md:text-7xl lg:text-8xl
          tracking-tight leading-[1.06]
          text-white
          drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)]
          mb-5
        ">
          Green Tomorrow<br />
          Starts{' '}
          <span
            className="text-[#4ADE80]"
            style={{ textShadow: '0 0 40px rgba(74,222,128,0.6), 0 0 80px rgba(74,222,128,0.25)' }}
          >
            Here
          </span>
        </h1>

        <p className="
          text-slate-300 text-base sm:text-lg
          max-w-sm sm:max-w-md
          font-normal leading-relaxed
          drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]
          mb-10
        ">
          Together, let&apos;s build a cleaner, greener and healthier planet.
        </p>

        {/* CTA row – pointer events re-enabled */}
        <div className="pointer-events-auto flex flex-col items-center gap-5">
          <button
            onClick={scrollDown}
            className="
              inline-flex items-center gap-2 px-8 py-3.5 rounded-full
              font-semibold text-sm text-[#030712]
              bg-[#4ADE80] hover:bg-[#3bce74]
              shadow-[0_0_28px_rgba(74,222,128,0.55)]
              hover:shadow-[0_0_44px_rgba(74,222,128,0.80)]
              transition-all duration-300
              hover:-translate-y-0.5 active:translate-y-0
            "
          >
            Scroll to Heal
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Mouse-wheel scroll indicator pill */}
          <div
            onClick={scrollDown}
            className="
              w-5 h-8 rounded-full
              border-2 border-white/30 hover:border-[#4ADE80]/70
              flex items-start justify-center p-1
              cursor-pointer transition-colors
            "
            title="Scroll down"
          >
            <span
              className="w-1.5 h-2 rounded-full bg-[#4ADE80] animate-bounce"
              style={{ boxShadow: '0 0 8px #4ade80' }}
            />
          </div>
        </div>
      </div>

      {/* ── Dev-only uHeal slider (only when ?debug=1) ──────────── */}
      {isDebug && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          {showPanel ? (
            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 w-80 text-xs shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <Sliders className="w-3.5 h-3.5" /> Dev: uHeal uniform
                </span>
                <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={healProgress}
                onChange={e => setHealProgress(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-2 rounded-lg cursor-pointer bg-slate-800"
              />
              <div className="flex justify-between mt-2 font-mono text-slate-400 text-[11px]">
                <span>0 — Polluted</span>
                <span className="text-emerald-300 font-bold">{healProgress.toFixed(2)}</span>
                <span>1 — Healed</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPanel(true)}
              className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 shadow-lg hover:scale-110 transition-transform"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
};
