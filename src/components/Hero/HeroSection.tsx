import React from 'react';
import { EarthCanvas } from '../Earth/EarthCanvas';
import { ArrowDown, Sparkles, Activity, ShieldAlert, HeartHandshake, Sliders } from 'lucide-react';

interface HeroSectionProps {
  healProgress: number;
  setHealProgress: (val: number) => void;
  isLowPower: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  healProgress,
  setHealProgress,
  isLowPower,
}) => {
  // Planet status description based on heal progress
  const getPlanetStatus = (progress: number) => {
    if (progress <= 0.05) {
      return {
        label: 'Polluted State (Pre-Intervention)',
        desc: 'Acidified oceans, cracked parched soil, industrial toxic smog cover.',
        color: 'text-amber-400',
        badge: 'bg-amber-950/60 border-amber-600/40 text-amber-300',
        icon: ShieldAlert,
      };
    }
    if (progress < 0.85) {
      return {
        label: `Active Healing Wave (${Math.round(progress * 100)}%)`,
        desc: 'Bio-luminescent green frontier spreading, toxic smog dissolving, vegetation recolonizing.',
        color: 'text-emerald-400',
        badge: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
        icon: Activity,
      };
    }
    return {
      label: 'Fully Restored Living Earth',
      desc: 'Pristine cyan-blue oceans, lush green continents, clean atmosphere, thriving biosphere.',
      color: 'text-cyan-300',
      badge: 'bg-cyan-950/60 border-cyan-400/40 text-cyan-300',
      icon: HeartHandshake,
    };
  };

  const status = getPlanetStatus(healProgress);
  const StatusIcon = status.icon;

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#030611] via-[#050b1a] to-[#040814]">
      {/* Background ambient radial glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[850px] md:h-[850px] rounded-full pointer-events-none transition-all duration-1000 filter blur-[120px]"
        style={{
          background:
            healProgress > 0.4
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.22) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(180, 83, 9, 0.20) 0%, rgba(120, 53, 15, 0.10) 50%, transparent 75%)',
        }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Competition Hero Typography & Context */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6 text-left">
            {/* Competition Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-900/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Theme: Green Tomorrow — Sustainable Future</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-display">
              Green Tomorrow <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Starts Here
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Together, let&apos;s build a cleaner, greener and healthier planet. Watch Earth heal in real-time as collective climate intervention transforms polluted wasteland into a thriving living biosphere.
            </p>

            {/* Planet Live Health Badge */}
            <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-500 max-w-lg w-full ${status.badge}`}>
              <div className="flex items-center gap-3 mb-1.5">
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
                <span className="font-semibold text-sm tracking-wide">{status.label}</span>
              </div>
              <p className="text-xs text-slate-300/90 leading-relaxed">{status.desc}</p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const target = healProgress < 0.5 ? 1.0 : 0.0;
                  setHealProgress(target);
                }}
                className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all duration-300 shadow-glow-green hover:shadow-glow-green-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{healProgress < 0.5 ? 'Initiate Planetary Healing' : 'Simulate Degradation'}</span>
                <Sparkles className="w-4 h-4 text-emerald-950 transition-transform group-hover:rotate-45" />
              </button>

              <a
                href="#scroll-story"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-500 transition-all backdrop-blur-md"
              >
                <span>Explore Journey</span>
                <ArrowDown className="w-4 h-4 text-slate-400 animate-bounce" />
              </a>
            </div>
          </div>

          {/* Right Column: 3D Earth Canvas & Interactive Shader Test Slider */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            
            {/* The 3D Earth Canvas Container */}
            <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
              <EarthCanvas
                healProgress={healProgress}
                scrollRotation={0}
                isLowPower={isLowPower}
              />
            </div>

            {/* Interactive Shader Testing Panel */}
            <div className="w-full max-w-md p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-glass mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Shader Test: uHeal Uniform
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {(healProgress).toFixed(2)} / 1.00
                </span>
              </div>

              {/* Slider Input */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={healProgress}
                  onChange={(e) => setHealProgress(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-all focus:outline-none"
                  aria-label="Planet healing slider"
                />
              </div>

              {/* Slider quick preset milestone buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setHealProgress(0.0)}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                    healProgress === 0.0
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Polluted (0%)
                </button>
                <button
                  type="button"
                  onClick={() => setHealProgress(0.5)}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                    healProgress > 0.4 && healProgress < 0.6
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Mid-Wave (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setHealProgress(1.0)}
                  className={`py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                    healProgress === 1.0
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Healed (100%)
                </button>
              </div>

              {/* Sustainability architecture notes badge */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  Zero image textures (100% GLSL)
                </span>
                <span className="font-mono text-slate-500">Payload: ~85 KB</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="relative z-10 pb-6 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-400 text-xs backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Scroll down to experience the planetary restoration story</span>
          <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </section>
  );
};
