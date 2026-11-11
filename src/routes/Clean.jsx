import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { CleaningScene } from '../three/CleaningScene';
import { CleanlinessMeter } from '../ui/CleanlinessMeter';
import { MissionPanel } from '../ui/MissionPanel';
import { Toast } from '../ui/Toast';
import { Tutorial } from '../ui/Tutorial';
import { EndingScreen } from '../ui/EndingScreen';
import { TerraHealLogo } from '../components/brand/TerraHealLogo';
import { navigateWithTransition } from '../utils/navigation';
import {
  Volume2,
  VolumeX,
  Zap,
  FastForward,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export const Clean = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TerraHeal | Clean the Earth';
  }, []);
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
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0">
          <button
            onClick={() => navigateWithTransition('/solutions#play', navigate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-mono text-xs transition-colors cursor-pointer"
            title="Return to Solutions Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <TerraHealLogo markSize={24} textClass="text-sm font-semibold hidden md:inline-block" to="/solutions#play" />
        </div>

        {/* Cleanliness Meter in the Center */}
        <div className="flex-1 max-w-xs sm:max-w-sm pointer-events-auto px-2">
          <CleanlinessMeter />
        </div>

        {/* Controls & Quick Actions on Right */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          
          {/* Skip / Auto-Heal (Accessibility & Demonstration) */}
          <button
            onClick={skipAndHealAll}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505]/80 hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 hover:border-white/20 font-mono text-xs transition-colors cursor-pointer"
            title="Skip game and heal Earth automatically"
          >
            <FastForward className="w-3 h-3 text-[#0becc2]" />
            <span>Skip, just heal it</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className={`p-1.5 sm:p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              muted
                ? 'bg-[#050505]/80 border-white/10 text-white/30'
                : 'bg-[#050505]/80 border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={muted ? 'Unmute audio' : 'Mute audio'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#0becc2]" />}
          </button>

          {/* Lite Mode Toggle */}
          <button
            onClick={toggleLiteMode}
            className={`p-1.5 sm:p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              liteMode
                ? 'bg-[#050505]/80 border-amber-500/40 text-amber-300'
                : 'bg-[#050505]/80 border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={liteMode ? 'Switch to Cinematic High-DPI' : 'Switch to Eco/Lite Mode'}
            aria-label="Toggle Lite Mode"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          {/* Reset / Restart */}
          <button
            onClick={restartGame}
            className="p-1.5 sm:p-2 rounded-lg bg-[#050505]/80 border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Restart Cleaning"
            aria-label="Restart Cleaning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
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

