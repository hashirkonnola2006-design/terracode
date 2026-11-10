import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const CleanlinessMeter = () => {
  const cleanliness = useGameStore((s) => s.cleanup?.health ?? s.cleanliness ?? 0);
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
      <div className="flex items-center justify-between w-full mb-1 px-0.5">
        <span className="font-mono uppercase text-[10px] tracking-[0.16em] text-white/50 flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0becc2]" />
          <span>Global Cleanliness</span>
        </span>
        <span className="font-mono tabular-nums text-xs font-medium text-white tracking-tight flex items-center gap-1 shrink-0 ml-2">
          {displayValue}%
          {displayValue === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-[#0becc2]" />}
        </span>
      </div>

      {/* Horizontal Minimal Bar */}
      <div className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        {/* Fill Bar */}
        <div
          className="h-full rounded-full bg-[#0becc2] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(displayValue, 1)}%` }}
        />
      </div>
    </div>
  );
};

export default CleanlinessMeter;
