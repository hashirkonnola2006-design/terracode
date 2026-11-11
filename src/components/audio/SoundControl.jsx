import React, { useState, useEffect, useRef } from 'react';
import { musicEngine } from '../../audio/musicEngine';
import { Volume2, VolumeX, Sliders } from 'lucide-react';

export const SoundControl = ({ className = '', buttonClass = '' }) => {
  const [audioState, setAudioState] = useState(() => musicEngine.getState());
  const [showSlider, setShowSlider] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    // Sync with music engine state
    const unsubscribe = musicEngine.subscribe((state) => {
      setAudioState({ ...state });
    });

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => {
        unsubscribe();
        mq.removeEventListener('change', listener);
      };
    }

    return unsubscribe;
  }, []);

  // Listen for first interaction to unlock Web Audio
  useEffect(() => {
    const handleInteract = () => {
      musicEngine.handleFirstInteraction();
    };
    window.addEventListener('pointerdown', handleInteract, { once: true, passive: true });
    window.addEventListener('keydown', handleInteract, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteract);
      window.removeEventListener('keydown', handleInteract);
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    musicEngine.playClick();
    musicEngine.toggle();
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setShowSlider(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowSlider(false);
    }, 450);
  };

  const isMuted = audioState.isMuted;
  const isPlaying = audioState.isPlaying && !isMuted;
  const showPulse = isMuted && !prefersReducedMotion;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sound Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isMuted ? 'Unmute chiptune audio' : 'Mute chiptune audio'}
        title={isMuted ? 'Unmute Pixel x Space chiptune' : 'Mute Audio'}
        className={`relative p-2 rounded-lg backdrop-blur-md border text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
          buttonClass
            ? buttonClass
            : isMuted
            ? 'bg-slate-900/80 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
            : 'bg-slate-900/80 border-[#0becc2]/40 text-[#0becc2] hover:bg-white/[0.08]'
        } ${showPulse ? 'ring-2 ring-[#0becc2]/40 shadow-[0_0_12px_rgba(11,236,194,0.25)] animate-pulse' : ''}`}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <div className="flex items-center gap-0.5 h-4">
            {/* 3 Animated Equalizer Bars for retro 8-bit vibe */}
            <span className="w-[3px] bg-[#0becc2] rounded-full animate-[musicBar1_0.75s_ease-in-out_infinite]" />
            <span className="w-[3px] bg-[#0becc2] rounded-full animate-[musicBar2_0.6s_ease-in-out_infinite]" />
            <span className="w-[3px] bg-[#0becc2] rounded-full animate-[musicBar3_0.85s_ease-in-out_infinite]" />
          </div>
        )}
      </button>

      {/* Floating Volume Slider Popover */}
      {showSlider && (
        <div
          role="dialog"
          aria-label="Audio volume controls"
          className="absolute right-0 top-full mt-2 z-50 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl w-48 text-left space-y-3 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-label uppercase text-[9px] tracking-wider text-white/50 font-semibold flex items-center gap-1">
              <Sliders className="w-3 h-3 text-[#0becc2]" /> Retro Audio
            </span>
            <span className="font-mono text-[9px] text-[#0becc2]">
              {isMuted ? 'MUTED' : 'PLAYING'}
            </span>
          </div>

          {/* Music Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/70">Music (Chiptune)</span>
              <span className="font-mono text-[#0becc2] tabular-nums">
                {Math.round(audioState.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={audioState.musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                musicEngine.setMusicVolume(val);
                if (isMuted && val > 0) musicEngine.setMuted(false);
              }}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0becc2]"
            />
          </div>

          {/* SFX Volume */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/70">Sound Effects</span>
              <span className="font-mono text-[#0becc2] tabular-nums">
                {Math.round(audioState.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={audioState.sfxVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                musicEngine.setSfxVolume(val);
                if (isMuted && val > 0) musicEngine.setMuted(false);
              }}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0becc2]"
            />
          </div>

          {/* Quick Mute Toggle in Popover */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-full py-1 text-center font-label text-[10px] tracking-wider uppercase rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            {isMuted ? 'Unmute Audio' : 'Mute All'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundControl;
