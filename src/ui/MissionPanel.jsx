import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  CheckCircle2,
  Trash2,
  SunMedium,
  Trees,
  Droplets,
  Flame,
} from 'lucide-react';

export const MissionPanel = () => {
  const [collapsed, setCollapsed] = useState(false);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const setActiveMission = useGameStore((s) => s.setActiveMission);
  const m1 = useGameStore((s) => s.mission1);
  const m2 = useGameStore((s) => s.mission2);
  const m3 = useGameStore((s) => s.mission3);
  const m4 = useGameStore((s) => s.mission4);
  const combo = useGameStore((s) => s.combo);
  const co2Absorbed = useGameStore((s) => s.co2Absorbed);

  const missions = [
    {
      id: 1,
      title: 'Orbit Cleanup',
      description: 'Tap floating space debris',
      progress: m1.progress,
      countLabel: `${m1.count}/${m1.target}`,
      completed: m1.completed,
      icon: Trash2,
      accent: 'text-amber-400',
      tag: combo > 1 ? `x${combo} Combo!` : null,
    },
    {
      id: 2,
      title: 'Clean Energy',
      description: 'Convert smog & coal emissions',
      progress: m2.progress,
      countLabel: `${m2.convertedSources.length}/${m2.target}`,
      completed: m2.completed,
      icon: SunMedium,
      accent: 'text-yellow-400',
    },
    {
      id: 3,
      title: 'Reforest Continents',
      description: 'Tap dry patches to plant trees',
      progress: m3.progress,
      countLabel: `${m3.plantedPatches.length}/${m3.target}`,
      completed: m3.completed,
      icon: Trees,
      accent: 'text-emerald-400',
      tag: co2Absorbed > 0 ? `${(co2Absorbed / 1000).toFixed(1)}t CO2` : null,
    },
    {
      id: 4,
      title: 'Water & Oceans',
      description: 'Drag net to sweep ocean plastic',
      progress: m4.progress,
      countLabel: `${m4.sweptPercent}%`,
      completed: m4.completed,
      icon: Droplets,
      accent: 'text-cyan-400',
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-30 w-72 sm:w-80 max-w-[calc(100vw-2rem)] select-none pointer-events-auto">
      <div className="rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-800/70 text-left transition-colors cursor-pointer border-b border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-200">
              Restoration Missions
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>
              {missions.filter((m) => m.completed).length}/4 Done
            </span>
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Missions List */}
        {!collapsed && (
          <div className="p-2 space-y-1.5 max-h-[55vh] overflow-y-auto">
            {missions.map((m) => {
              const Icon = m.icon;
              const isActive = activeMissionId === m.id;
              const isLocked = m.id > 1 && !missions[m.id - 2].completed && !m.completed;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (!isLocked) setActiveMission(m.id);
                  }}
                  className={`relative p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : m.completed
                      ? 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-slate-800/80 ${m.accent}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {m.title}
                          </span>
                          {m.tag && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                              {m.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="font-mono text-[11px] font-semibold text-slate-300">
                          {m.countLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.completed ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionPanel;

