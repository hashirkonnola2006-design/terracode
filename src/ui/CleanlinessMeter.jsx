import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const CleanlinessMeter = () => {
  const cleanliness = useGameStore((s) => s.cleanliness);
  const [displayValue, setDisplayValue] = useState(cleanliness);

  // Smooth number ticker animation
  useEffect(() => {
    let start = displayValue;
    const end = cleanliness;
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [cleanliness]);

  const milestones = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md mx-auto">
      {/* Percentage Header */}
      <div className="flex items-center justify-between w-full mb-1.5 px-1">
        <span className="font-label uppercase text-[10px] sm:text-[12px] tracking-[0.14em] sm:tracking-[0.2em] text-[#4ade80] flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-[#4ade80] shrink-0" />
          <span className="hidden min-[380px]:inline">Global </span>Cleanliness
        </span>
        <span className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-1 shrink-0 ml-2">
          {displayValue}%
          {displayValue === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />}
        </span>
      </div>

      {/* Horizontal Glass Bar with Milestones */}
      <div className="relative w-full h-2.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 p-0.5 overflow-visible">
        {/* Fill Bar */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 shadow-[0_0_12px_rgba(74,222,128,0.5)] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(displayValue, 2)}%` }}
        />

        {/* Milestone Ticks */}
        {milestones.map((m) => {
          const isReached = displayValue >= m;
          return (
            <div
              key={m}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${m}%`, transform: 'translateX(-50%)' }}
            >
              {/* Tick Mark */}
              <div
                className={`w-0.5 h-full ${
                  isReached ? 'bg-emerald-200' : 'bg-slate-600/80'
                } transition-colors duration-300`}
              />
              {/* Subtle Milestone Dot on Top */}
              <div
                className={`w-1.5 h-1.5 rounded-full -mt-2.5 transition-all duration-300 ${
                  isReached ? 'bg-emerald-400 ring-2 ring-emerald-500/50 scale-110' : 'bg-slate-700'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CleanlinessMeter;

