import React from 'react';
import { Zap, ZapOff } from 'lucide-react';

interface LowPowerToggleProps {
  isLowPower: boolean;
  onToggle: () => void;
}

export const LowPowerToggle: React.FC<LowPowerToggleProps> = ({ isLowPower, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
        isLowPower
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-green'
          : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-500'
      } backdrop-blur-md`}
      title="Toggle between 3D WebGL and ultra-low-power 2D mode for energy sustainability"
    >
      {isLowPower ? (
        <ZapOff className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
      ) : (
        <Zap className="w-3.5 h-3.5 text-amber-400" />
      )}
      <span>{isLowPower ? 'Eco Mode: ON' : 'Eco Mode: 3D High'}</span>
    </button>
  );
};

