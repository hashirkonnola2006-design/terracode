import React, { useState, useEffect } from 'react';
import { EarthCanvas } from '../Earth/EarthCanvas';
import { ArrowDown, Sliders, X } from 'lucide-react';

interface HeroSectionProps {
  healProgress: number;
  setHealProgress: (val: number) => void;
  isLowPower: boolean;
  onScrollToHeal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  healProgress,
  setHealProgress,
  isLowPower,
  onScrollToHeal,
}) => {
  // Dev-only debug slider: only active when ?debug=1 is in URL
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') {
        setIsDebugMode(true);
        setShowDebugPanel(true);
      }
    }
  }, []);

  const handleScrollClick = () => {
    if (onScrollToHeal) {
      onScrollToHeal();
    } else {
      const target = document.getElementById('story-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#030712] select-none">
      
      {/* Cinematic Vignette & Deep Space Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#071329]/60 via-[#030712]/90 to-[#02050c] pointer-events-none z-0" />

      {/* Atmospheric corner clouds (recreating Image B's cinematic depth) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-800/20 rounded-full filter blur-[90px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-900/15 rounded-full filter blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[600px] h-64 bg-slate-900/40 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Subtle Foreground Floating Leaf Silhouette Accents (Left & Right margins, matching Image B) */}
      <div className="absolute top-1/4 -left-6 w-24 h-24 text-emerald-500/25 filter blur-[2px] pointer-events-none transform -rotate-45 hidden md:block animate-float-slow">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q50,0 90,10 Q100,50 80,90 Q40,100 10,80 Z" />
        </svg>
      </div>
      <div className="absolute top-1/3 -right-8 w-28 h-28 text-emerald-400/20 filter blur-[3px] pointer-events-none transform rotate-12 hidden md:block">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q50,0 90,10 Q100,50 80,90 Q40,100 10,80 Z" />
        </svg>
      </div>

      {/* 3D Earth Canvas: Full, Centered, and Uncropped behind the typography */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10 pointer-events-auto">
        <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
          <EarthCanvas
            healProgress={healProgress}
            scrollRotation={0}
            isLowPower={isLowPower}
          />
        </div>
      </div>

      {/* Minimal Centered Hero Typography & Actions (anchored cleanly over the globe, matching Image B) */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 pt-32 pb-16 flex-1 flex flex-col items-center justify-end text-center pointer-events-none">
        
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08] mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
          Green Tomorrow <br />
          Starts <span className="text-[#4ADE80] drop-shadow-[0_0_20px_rgba(74,222,128,0.55)]">Here</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal max-w-xl mx-auto mb-7 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Together, let&apos;s build a cleaner, greener and healthier planet.
        </p>

        {/* Glowing Green "Scroll to Heal" CTA Button */}
        <div className="pointer-events-auto flex flex-col items-center gap-5">
          <button
            onClick={handleScrollClick}
            className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm text-slate-950 bg-[#4ADE80] hover:bg-[#3cd072] transition-all duration-300 shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:shadow-[0_0_45px_rgba(74,222,128,0.75)] transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Scroll to Heal</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Mouse Scroll Indicator Pill with animated green dot (matching Image B) */}
          <div
            onClick={handleScrollClick}
            className="w-5 h-8 rounded-full border-2 border-white/30 hover:border-emerald-400/80 flex items-start justify-center p-1 cursor-pointer transition-colors backdrop-blur-sm"
            title="Scroll down"
          >
            <div className="w-1.5 h-2 rounded-full bg-[#4ADE80] animate-bounce shadow-[0_0_6px_#4ade80]" />
          </div>
        </div>

      </div>

      {/* Dev-Only Shader Test Slider (Only rendered when ?debug=1 is in URL) */}
      {isDebugMode && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          {showDebugPanel ? (
            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl w-80 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <Sliders className="w-3.5 h-3.5" /> Dev Mode: uHeal
                </span>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={healProgress}
                onChange={(e) => setHealProgress(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-[11px] font-mono text-slate-400">
                <span>0.0 (Polluted)</span>
                <span className="text-emerald-300 font-bold">{healProgress.toFixed(2)}</span>
                <span>1.0 (Healed)</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-emerald-400 shadow-lg hover:scale-110 transition-transform"
              title="Open Dev Shader Slider"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

    </section>
  );
};
