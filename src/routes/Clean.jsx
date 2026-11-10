import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { CleaningScene } from '../three/CleaningScene';
import { CleanlinessMeter } from '../ui/CleanlinessMeter';
import { MissionPanel } from '../ui/MissionPanel';
import { Toast } from '../ui/Toast';
import { Tutorial } from '../ui/Tutorial';
import { EndingScreen } from '../ui/EndingScreen';
import {
  Volume2,
  VolumeX,
  Zap,
  Leaf,
  FastForward,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export const Clean = () => {
  const navigate = useNavigate();
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const liteMode = useGameStore((s) => s.liteMode);
  const toggleLiteMode = useGameStore((s) => s.toggleLiteMode);
  const skipAndHealAll = useGameStore((s) => s.skipAndHealAll);
  const restartGame = useGameStore((s) => s.restartGame);

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden select-none">
      
      {/* ── 1. Interactive 3D Canvas (Fullscreen background layer) ── */}
      <CleaningScene />

      {/* ── 2. Minimal Top Bar (Fixed) ── */}
      <header className="fixed top-0 left-0 right-0 z-[60] px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 pointer-events-none">
        
        {/* Back to Hub + Brand / Logo on Left */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto shrink-0">
          <button
            onClick={() => navigate('/solutions#play')}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white font-label uppercase text-[10px] sm:text-[11px] font-semibold tracking-wider transition-colors cursor-pointer"
            title="Return to Solutions Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4ade80]" />
          </div>
          <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white hidden md:inline-block">
            EcoFuture
          </span>
        </div>

        {/* Cleanliness Meter in the Center */}
        <div className="flex-1 max-w-xs sm:max-w-md pointer-events-auto px-1 sm:px-2">
          <CleanlinessMeter />
        </div>

        {/* Controls & Quick Actions on Right */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
          
          {/* Skip / Auto-Heal (Accessibility & Demonstration) */}
          <button
            onClick={skipAndHealAll}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.10] text-white/80 hover:text-white border border-white/20 font-label uppercase text-[11px] font-semibold tracking-[0.14em] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400"
            title="Skip game and heal Earth automatically"
          >
            <FastForward className="w-3.5 h-3.5 text-emerald-400" />
            <span>Skip, just heal it</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md border text-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
              muted
                ? 'bg-slate-900/80 border-white/10 text-slate-500'
                : 'bg-slate-900/80 border-white/20 text-emerald-400 hover:bg-white/[0.08]'
            }`}
            title={muted ? 'Unmute audio' : 'Mute audio'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Lite Mode Toggle */}
          <button
            onClick={toggleLiteMode}
            className={`p-1.5 sm:p-2 rounded-lg backdrop-blur-md border text-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
              liteMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={liteMode ? 'Switch to Cinematic High-DPI' : 'Switch to Eco/Lite Mode'}
            aria-label="Toggle Lite Mode"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Reset / Restart */}
          <button
            onClick={restartGame}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400"
            title="Restart Cleaning"
            aria-label="Restart Cleaning"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </header>

      {/* ── 3. Missions Drawer (Bottom-left) ── */}
      <MissionPanel />

      {/* ── 4. Notifications & Modals (Fact toasts & Mission completion reveals) ── */}
      <Toast />

      {/* ── 5. Tutorial Overlay (First-time visitors) ── */}
      <Tutorial />

      {/* ── 6. 100% Cleanliness Ending Screen ── */}
      <EndingScreen />

    </div>
  );
};

export default Clean;

