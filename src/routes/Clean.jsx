import React from 'react';
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
} from 'lucide-react';

export const Clean = () => {
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
      <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 pointer-events-none">
        
        {/* Brand / Logo on Left */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
            <Leaf className="w-4 h-4 fill-slate-950" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white hidden sm:inline-block">
            EcoFuture
          </span>
        </div>

        {/* Cleanliness Meter in the Center */}
        <div className="flex-1 max-w-md pointer-events-auto px-2">
          <CleanlinessMeter />
        </div>

        {/* Controls & Quick Actions on Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          
          {/* Skip / Auto-Heal (Accessibility & Demonstration) */}
          <button
            onClick={skipAndHealAll}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 text-xs font-medium tracking-wide transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Skip game and heal Earth automatically"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip, just heal it</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
              muted
                ? 'bg-slate-900/80 border-slate-700 text-slate-500'
                : 'bg-slate-900/80 border-slate-700 text-emerald-400 hover:bg-slate-800'
            }`}
            title={muted ? 'Unmute audio' : 'Mute audio'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Lite Mode Toggle */}
          <button
            onClick={toggleLiteMode}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
              liteMode
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={liteMode ? 'Switch to Cinematic High-DPI' : 'Switch to Eco/Lite Mode'}
            aria-label="Toggle Lite Mode"
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Reset / Restart */}
          <button
            onClick={restartGame}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Restart Cleaning"
            aria-label="Restart Cleaning"
          >
            <RotateCcw className="w-4 h-4" />
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

