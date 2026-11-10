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
    <div className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] select-none pointer-events-auto">
      <div className="rounded-xl bg-slate-950/85 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-200 shadow-2xl">
        {/* Header Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.03] hover:bg-white/[0.06] text-left transition-colors duration-200 cursor-pointer border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0becc2]" />
            <span className="font-label uppercase text-[11px] sm:text-[12px] tracking-[0.18em] sm:tracking-[0.22em] text-white/80 font-semibold">
              Restoration Missions
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs text-white/50">
            <span className="tabular-nums">
              {missions.filter((m) => m.completed).length}/4 Done
            </span>
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Missions List */}
        {!collapsed && (
          <div className="p-2 space-y-1.5 max-h-[44vh] sm:max-h-[55vh] overflow-y-auto">
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
                  className={`relative p-2.5 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-[#0becc2]/10 border-[#0becc2]/40 ring-1 ring-[#0becc2]/20'
                      : m.completed
                      ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      : 'bg-white/[0.015] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md bg-white/[0.05] ${m.accent}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-label uppercase text-[12px] tracking-[0.08em] font-semibold ${isActive ? 'text-white' : 'text-white/80'}`}>
                            {m.title}
                          </span>
                          {m.tag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0becc2]/20 text-[#0becc2] font-mono tabular-nums">
                              {m.tag}
                            </span>
                          )}
                        </div>
                        <p className="font-body font-light text-[12px] text-white/60 leading-tight">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0becc2]" />
                      ) : (
                        <span className="font-mono tabular-nums text-[12px] font-semibold text-white/80">
                          {m.countLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.completed ? 'bg-[#0becc2]' : 'bg-gradient-to-r from-[#0becc2] to-[#5df7d9]'
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

