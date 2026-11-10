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
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-88 max-w-[92vw] select-none pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-300 shrink-0">
              <Info className="w-4 h-4 text-[#4ade80]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-label uppercase text-[11px] font-semibold tracking-[0.2em] text-[#4ade80] block mb-0.5">
                Verified Global Benchmark
              </span>
              <p className="font-body font-normal text-xs text-white/90 leading-snug">
                {activeToast.message}
              </p>
              <span className="font-mono text-[10px] text-white/50 block mt-1">
                Source: {activeToast.source}
              </span>
            </div>
            <button
              onClick={dismissToast}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Mission Completed Infographic Modal ── */}
      {missionReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 select-none pointer-events-auto">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl bg-slate-950/95 border border-emerald-500/40 text-center shadow-2xl">
            {/* Celebration Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#4ade80]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <span className="font-label uppercase text-[11px] font-semibold tracking-[0.25em] text-[#4ade80] mb-1 block">
              Mission {completedModalMission} Completed
            </span>

            <h3 className="font-display font-extrabold text-xl text-white mb-3">
              {missionReveal.title}
            </h3>

            {/* Stat Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4 text-left">
              <p className="font-display font-bold text-sm text-emerald-200 mb-1 leading-snug">
                "{missionReveal.stat}"
              </p>
              <p className="font-body font-light text-xs text-white/70 mb-2 leading-relaxed">
                {missionReveal.detail}
              </p>
              <p className="font-mono text-[10px] text-white/50">
                Data: {missionReveal.source}
              </p>
            </div>

            <p className="font-label uppercase text-[11px] tracking-[0.14em] text-white/50 mb-5 flex items-center justify-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-[#4ade80]" />
              {missionReveal.nextPrompt}
            </p>

            <button
              onClick={closeCompletedModal}
              className="btn-aerospace-primary w-full text-xs py-3"
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

