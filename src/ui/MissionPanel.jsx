import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '../config/game';
import { musicEngine } from '../audio/musicEngine';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
  SunMedium,
  Trees,
  Droplets,
  X,
  Target,
  Compass,
  Info,
} from 'lucide-react';

const MISSION_EXPLANATIONS = {
  1: {
    tag: 'MISSION 01 / 04',
    title: 'Orbit Debris',
    subtitle: 'Clear Orbital Waste',
    color: '#0becc2',
    icon: Trash2,
    howTo: 'Tap or click floating space debris (bottles, cans, bags, and satellite fragments) orbiting Earth to disintegrate and collect them.',
    tip: 'Drag anywhere to spin Earth and collect debris orbiting on the far side of the planet.',
  },
  2: {
    tag: 'MISSION 02 / 04',
    title: 'Clean Energy',
    subtitle: 'Convert Fossil Smokestacks',
    color: '#f59e0b',
    icon: SunMedium,
    howTo: 'Locate pulsating red industrial chimneys smoking on the continents and click them to convert fossil pollution into green wind turbines and solar arrays.',
    tip: 'Rotate the globe to discover industrial sites across North America, Europe, Asia, and Africa.',
  },
  3: {
    tag: 'MISSION 03 / 04',
    title: 'Forests',
    subtitle: 'Reforest Barren Biomes',
    color: '#10b981',
    icon: Trees,
    howTo: 'Find barren brown deforestation zones marked with glowing rings and click them to plant lush native forests.',
    tip: 'Spin Earth to spot dry, deforested biomes in South America, Africa, Australia, and Eurasia.',
  },
  4: {
    tag: 'MISSION 04 / 04',
    title: 'Oceans',
    subtitle: 'Sweep Plastic Gyres',
    color: '#06b6d4',
    icon: Droplets,
    howTo: 'Drag or sweep across dense plastic waste patches in the ocean with your cursor or finger to scoop up and clear the waste.',
    tip: 'Clean all major ocean gyres across the Pacific, Atlantic, and Indian Oceans until global ocean cleanliness reaches 100%.',
  },
};

export const MissionPanel = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [popupMissionId, setPopupMissionId] = useState(null);
  const popupRef = useRef(null);
  const panelRef = useRef(null);

  const cleanup = useGameStore((s) => s.cleanup);
  const setActiveMission = useGameStore((s) => s.setActiveMission);

  // Unmount completely once Earth is 100% restored to avoid ending screen clutter
  if ((cleanup?.health ?? 0) >= 100) return null;

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

  // Dismiss popup on outside click or Escape
  useEffect(() => {
    if (!popupMissionId) return;

    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setPopupMissionId(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPopupMissionId(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popupMissionId]);

  const handleMissionClick = (mId) => {
    try {
      musicEngine.playClick();
    } catch (_) {}
    setActiveMission(mId);
    setPopupMissionId((prev) => (prev === mId ? null : mId));
  };

  const selectedExplanation = popupMissionId ? MISSION_EXPLANATIONS[popupMissionId] : null;
  const selectedMissionObj = popupMissionId ? missions.find((m) => m.id === popupMissionId) : null;
  const ExplanationIcon = selectedExplanation ? selectedExplanation.icon : null;

  return (
    <aside
      aria-label="Restoration Missions"
      className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] select-none pointer-events-auto font-sans"
    >
      <div
        ref={panelRef}
        className="rounded-xl bg-[#050505]/90 backdrop-blur-md border border-white/10 overflow-hidden shadow-xl transition-all duration-200"
      >
        {/* Sleek Minimal Header */}
        <button
          onClick={() => {
            try {
              musicEngine.playClick();
            } catch (_) {}
            setCollapsed(!collapsed);
          }}
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
              const isPopupOpen = popupMissionId === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleMissionClick(m.id)}
                  className={`group relative px-2.5 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                    isPopupOpen
                      ? 'bg-white/[0.12] ring-1 ring-[#0becc2]/60 text-white shadow-sm'
                      : isActive
                      ? 'bg-white/[0.08] text-white'
                      : m.completed
                      ? 'bg-transparent text-white/60 hover:text-white/80 hover:bg-white/[0.03]'
                      : 'bg-transparent text-white/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="Click to view mission objective & how to play"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 transition-colors ${
                          m.completed
                            ? 'text-[#0becc2]'
                            : isPopupOpen || isActive
                            ? 'text-[#0becc2]'
                            : 'text-white/40 group-hover:text-white/70'
                        }`}
                      />
                      <span className="text-xs font-medium tracking-tight">
                        {m.title}
                      </span>
                      <Info
                        className={`w-3 h-3 transition-opacity ${
                          isPopupOpen
                            ? 'opacity-100 text-[#0becc2]'
                            : 'opacity-0 group-hover:opacity-60 text-white/50'
                        }`}
                      />
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

      {/* ── Small Pop-Up Explanation Card ── */}
      {selectedExplanation && !collapsed && (
        <div
          ref={popupRef}
          className="absolute left-0 sm:left-[calc(100%+0.75rem)] bottom-[calc(100%+0.75rem)] sm:bottom-0 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl bg-[#050505]/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl text-white select-none animate-in fade-in zoom-in-95 duration-200 z-50 font-sans"
          style={{
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.85), 0 0 25px rgba(11,236,194,0.12)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: selectedExplanation.color }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60 font-semibold">
                {selectedExplanation.tag}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                try {
                  musicEngine.playClick();
                } catch (_) {}
                setPopupMissionId(null);
              }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close explanation"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title & Status */}
          <div className="flex items-start gap-2.5 mb-3">
            <div
              className="p-2 rounded-lg shrink-0 border"
              style={{
                backgroundColor: `${selectedExplanation.color}15`,
                borderColor: `${selectedExplanation.color}35`,
                color: selectedExplanation.color,
              }}
            >
              <ExplanationIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                {selectedExplanation.title}
              </h4>
              <p className="text-[11px] text-white/60 font-medium">
                {selectedExplanation.subtitle}
              </p>
            </div>
            {selectedMissionObj?.completed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0becc2]/15 border border-[#0becc2]/30 text-[#0becc2] text-[10px] font-mono font-medium shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-[10px] font-mono shrink-0">
                {selectedMissionObj?.countLabel}
              </span>
            )}
          </div>

          {/* What to do & Navigation tips */}
          <div className="space-y-2 mb-3.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#0becc2] font-semibold mb-1">
                <Target className="w-3 h-3" /> What to do
              </div>
              <p className="text-white/85 leading-relaxed text-[11px]">
                {selectedExplanation.howTo}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-semibold mb-1">
                <Compass className="w-3 h-3" /> Navigation tip
              </div>
              <p className="text-white/70 leading-relaxed text-[11px]">
                {selectedExplanation.tip}
              </p>
            </div>
          </div>

          {/* Footer action button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              try {
                musicEngine.playClick();
              } catch (_) {}
              setPopupMissionId(null);
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-colors cursor-pointer text-center"
          >
            Got it
          </button>
        </div>
      )}
    </aside>
  );
};

export default MissionPanel;
