import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
  SunMedium,
  Trees,
  Droplets,
} from 'lucide-react';

export const MissionPanel = () => {
  const [collapsed, setCollapsed] = useState(false);
  const cleanup = useGameStore((s) => s.cleanup);
  const setActiveMission = useGameStore((s) => s.setActiveMission);

  const activeMissionId = cleanup?.activeMissionId ?? 1;
  const m1Raw = cleanup?.mission1;
  const m2Raw = cleanup?.mission2;
  const m3Raw = cleanup?.mission3;
  const m4Raw = cleanup?.mission4;

  // Normalized mission progress & targets
  const m1Count = m1Raw?.count ?? 0;
  const m1Target = GAME_CONFIG.MISSION_1_TARGET;
  const m1Completed = m1Count >= m1Target || Boolean(m1Raw?.completed);
  const m1Progress = Math.min(100, Math.round((m1Count / m1Target) * 100));

  const m2Count = m2Raw?.convertedSources?.length ?? 0;
  const m2Target = GAME_CONFIG.MISSION_2_TARGET;
  const m2Completed = m2Count >= m2Target || Boolean(m2Raw?.completed);
  const m2Progress = Math.min(100, Math.round((m2Count / m2Target) * 100));

  const m3Count = m3Raw?.plantedPatches?.length ?? 0;
  const m3Target = GAME_CONFIG.MISSION_3_TARGET;
  const m3Completed = m3Count >= m3Target || Boolean(m3Raw?.completed);
  const m3Progress = Math.min(100, Math.round((m3Count / m3Target) * 100));

  const m4Percent = m4Raw?.sweptPercent ?? 0;
  const m4Target = GAME_CONFIG.MISSION_4_TARGET;
  const m4Completed = m4Percent >= m4Target || Boolean(m4Raw?.completed);
  const m4Progress = Math.min(100, Math.round((m4Percent / m4Target) * 100));

  const missions = [
    {
      id: 1,
      title: 'Orbit Debris',
      progress: m1Progress,
      countLabel: `${m1Count}/${m1Target}`,
      completed: m1Completed,
      icon: Trash2,
    },
    {
      id: 2,
      title: 'Clean Energy',
      progress: m2Progress,
      countLabel: `${m2Count}/${m2Target}`,
      completed: m2Completed,
      icon: SunMedium,
    },
    {
      id: 3,
      title: 'Forests',
      progress: m3Progress,
      countLabel: `${m3Count}/${m3Target}`,
      completed: m3Completed,
      icon: Trees,
    },
    {
      id: 4,
      title: 'Oceans',
      progress: m4Progress,
      countLabel: `${m4Percent}%`,
      completed: m4Completed,
      icon: Droplets,
    },
  ];

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <aside
      aria-label="Restoration Missions"
      className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] select-none pointer-events-auto font-sans"
    >
      <div className="rounded-xl bg-[#050505]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl transition-all duration-200">
        {/* Sleek Minimal Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0becc2]" />
            <span className="font-mono uppercase text-[10px] tracking-[0.18em] text-white/80 font-medium">
              Missions
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-white/50">
            <span className="tabular-nums font-medium text-white/70">
              {completedCount}/4
            </span>
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Minimal Missions List */}
        {!collapsed && (
          <div className="px-3 py-2 space-y-1.5 border-t border-white/5">
            {missions.map((m) => {
              const Icon = m.icon;
              const isActive = activeMissionId === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setActiveMission(m.id)}
                  className={`group px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : m.completed
                      ? 'bg-transparent text-white/60 hover:text-white/80'
                      : 'bg-transparent text-white/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${m.completed ? 'text-[#0becc2]' : isActive ? 'text-[#0becc2]' : 'text-white/40'}`} />
                      <span className="text-xs font-medium tracking-tight">
                        {m.title}
                      </span>
                    </div>

                    <div className="text-right">
                      {m.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0becc2]" />
                      ) : (
                        <span className="font-mono tabular-nums text-[11px] text-white/50">
                          {m.countLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hairline 2px progress bar */}
                  <div className="w-full h-[2px] rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.completed ? 'bg-[#0becc2]' : 'bg-[#0becc2]/80'
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
    </aside>
  );
};

export default MissionPanel;

