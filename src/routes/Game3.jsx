import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EarthBackground } from '../three/EarthBackground';
import { hubHealMask } from '../three/HealMask';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { navigateWithTransition } from '../utils/navigation';

export const Game3 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TerraHeal | Game 3';
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[#0becc2] selection:text-black">
      {/* Fixed Decorative Earth */}
      <EarthBackground
        health={0}
        healMaskManager={hubHealMask}
        liteMode={false}
        enableOrbit={false}
        customCameraZ={3.2}
        spinRate={0.010}
      />

      <div className="fixed inset-0 z-0 bg-radial from-transparent via-[#050505]/70 to-[#050505]/90 pointer-events-none" />

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md bg-slate-950/40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWithTransition('/solutions#play', navigate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-label uppercase text-[11px] font-semibold tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hub</span>
          </button>

          <TerraHealLogo markSize={26} textClass="text-base font-bold hidden sm:inline" to="/solutions#play" />
        </div>
      </header>

      {/* Centered Glass Placeholder Card */}
      <main className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="p-8 sm:p-10 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/50">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-[#0becc2]">
              Game 3 • Mission In Development
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              New Mission Coming Soon
            </h1>
            <p className="font-body font-light text-xs sm:text-sm text-white/70 leading-relaxed">
              We are engineering a deep climate strategy simulation. Deploy regional renewable micro-grids, enforce carbon caps, and observe real-time planetary recovery.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateWithTransition('/solutions#play', navigate)}
              className="btn-aerospace-primary w-full text-xs py-3 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Return to Solutions Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Game3;

