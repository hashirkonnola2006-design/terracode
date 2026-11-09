import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import { CheckCircle2, Award, ArrowRight, X, Info } from 'lucide-react';

export const Toast = () => {
  const activeToast = useGameStore((s) => s.activeToast);
  const dismissToast = useGameStore((s) => s.dismissToast);
  const completedModalMission = useGameStore((s) => s.completedModalMission);
  const closeCompletedModal = useGameStore((s) => s.closeCompletedModal);

  // Auto-dismiss fact toast after 6s
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  const missionReveal = completedModalMission
    ? GAME_CONFIG.MISSION_REVEALS[completedModalMission]
    : null;

  return (
    <>
      {/* ── 1. Floating Fact Toast (Triggered every 10 items) ── */}
      {activeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-88 max-w-[92vw] select-none pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-emerald-500/40 shadow-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 block mb-0.5">
                Verified Global Benchmark
              </span>
              <p className="text-xs text-slate-200 leading-snug font-medium">
                {activeToast.message}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Source: {activeToast.source}
              </span>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Mission Completed Infographic Modal ── */}
      {missionReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 select-none pointer-events-auto">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900/95 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-center">
            {/* Celebration Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 mb-1 block">
              Mission {completedModalMission} Completed
            </span>

            <h3 className="text-xl font-bold text-white mb-3">
              {missionReveal.title}
            </h3>

            {/* Stat Card */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-4 text-left">
              <p className="text-sm font-semibold text-emerald-200 mb-1 leading-snug">
                "{missionReveal.stat}"
              </p>
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {missionReveal.detail}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Data: {missionReveal.source}
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-5 flex items-center justify-center gap-1.5 font-medium">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              {missionReveal.nextPrompt}
            </p>

            <button
              onClick={closeCompletedModal}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Continue Restoring
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Toast;
