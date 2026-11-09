import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GAME_CONFIG } from '../config/game';
import { sound } from '../utils/audio';

const calculateCleanliness = (m1, m2, m3, m4) => {
  const p1 = Math.min(1.0, m1.count / m1.target) * GAME_CONFIG.WEIGHT_MISSION_1;
  const p2 = Math.min(1.0, m2.convertedSources.length / m2.target) * GAME_CONFIG.WEIGHT_MISSION_2;
  const p3 = Math.min(1.0, m3.plantedPatches.length / m3.target) * GAME_CONFIG.WEIGHT_MISSION_3;
  const p4 = Math.min(1.0, m4.sweptPercent / m4.target) * GAME_CONFIG.WEIGHT_MISSION_4;
  return Math.min(100, Math.round(p1 + p2 + p3 + p4));
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Cleanliness overall score 0 - 100%
      cleanliness: 0,

      // Mission progress states
      mission1: {
        progress: 0,
        target: GAME_CONFIG.MISSION_1_TARGET,
        completed: false,
        count: 0,
        collectedIds: [],
      },
      mission2: {
        progress: 0,
        target: GAME_CONFIG.MISSION_2_TARGET,
        completed: false,
        convertedSources: [], // IDs of converted sources
      },
      mission3: {
        progress: 0,
        target: GAME_CONFIG.MISSION_3_TARGET,
        completed: false,
        plantedPatches: [], // IDs of planted patches
      },
      mission4: {
        progress: 0,
        target: GAME_CONFIG.MISSION_4_TARGET,
        completed: false,
        sweptPercent: 0,
      },

      // Game state & UI
      activeMissionId: 1,
      itemsCollected: 0,
      co2Absorbed: 0,
      combo: 1,
      lastCollectTime: 0,
      muted: false,
      liteMode: false,
      finished: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      pledges: [],
      tutorialDismissed: false,

      // Modal & Toast feedback
      completedModalMission: null, // Mission ID that just completed
      activeToast: null,
      factsShownMilestones: [],

      // ── Actions ──

      // Mission 1: Collect floating space debris
      collectDebrisItem: (id, type = 'bottle', points = 1) => {
        const state = get();
        if (state.mission1.collectedIds.includes(id)) return;

        const now = Date.now();
        const timeDiff = (now - state.lastCollectTime) / 1000;
        const newCombo = timeDiff < GAME_CONFIG.COMBO_RESET_SECONDS ? Math.min(state.combo + 1, 5) : 1;

        const newCount = state.mission1.count + 1;
        const newCollectedIds = [...state.mission1.collectedIds, id];
        const isComplete = newCount >= state.mission1.target;
        const wasComplete = state.mission1.completed;

        const newM1 = {
          ...state.mission1,
          count: newCount,
          collectedIds: newCollectedIds,
          progress: Math.min(100, Math.round((newCount / state.mission1.target) * 100)),
          completed: isComplete,
        };

        const newTotalItems = state.itemsCollected + 1;
        const newCleanliness = calculateCleanliness(newM1, state.mission2, state.mission3, state.mission4);

        // Sound & haptic
        sound.playPop(1.0 + (newCombo - 1) * 0.15);
        sound.triggerHaptic(15);
        sound.updateAmbientProgress(newCleanliness);

        // Trigger fact toast every 10 items
        let newToast = state.activeToast;
        const newFactsShown = [...state.factsShownMilestones];
        const fact = GAME_CONFIG.COLLECTION_FACTS.find(
          (f) => f.milestone <= newTotalItems && !newFactsShown.includes(f.milestone)
        );
        if (fact) {
          newFactsShown.push(fact.milestone);
          newToast = {
            id: Date.now(),
            message: fact.stat,
            source: `${fact.source} (${fact.year})`,
          };
        }

        // Mission complete trigger
        let modalMission = state.completedModalMission;
        let nextActive = state.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 1;
          nextActive = 2;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;
        if (isFinished && !state.finished) {
          sound.playMilestone();
        }

        set({
          cleanliness: newCleanliness,
          mission1: newM1,
          itemsCollected: newTotalItems,
          combo: newCombo,
          lastCollectTime: now,
          activeToast: newToast,
          factsShownMilestones: newFactsShown,
          completedModalMission: modalMission,
          activeMissionId: nextActive,
          finished: isFinished,
        });

        return { points, combo: newCombo };
      },

      // Mission 2: Convert smog / emission source
      convertSmogSource: (sourceId) => {
        const state = get();
        if (state.mission2.convertedSources.includes(sourceId)) return;

        const newSources = [...state.mission2.convertedSources, sourceId];
        const isComplete = newSources.length >= state.mission2.target;
        const wasComplete = state.mission2.completed;

        const newM2 = {
          ...state.mission2,
          convertedSources: newSources,
          progress: Math.min(100, Math.round((newSources.length / state.mission2.target) * 100)),
          completed: isComplete,
        };

        const newCleanliness = calculateCleanliness(state.mission1, newM2, state.mission3, state.mission4);

        sound.playConvert();
        sound.triggerHaptic(25);
        sound.updateAmbientProgress(newCleanliness);

        let modalMission = state.completedModalMission;
        let nextActive = state.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 2;
          nextActive = 3;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;
        if (isFinished && !state.finished) {
          sound.playMilestone();
        }

        set({
          cleanliness: newCleanliness,
          mission2: newM2,
          completedModalMission: modalMission,
          activeMissionId: nextActive,
          finished: isFinished,
        });
      },

      // Mission 3: Plant tree patch on continent
      plantForestPatch: (patchId) => {
        const state = get();
        if (state.mission3.plantedPatches.includes(patchId)) return;

        const newPatches = [...state.mission3.plantedPatches, patchId];
        const isComplete = newPatches.length >= state.mission3.target;
        const wasComplete = state.mission3.completed;

        const newM3 = {
          ...state.mission3,
          plantedPatches: newPatches,
          progress: Math.min(100, Math.round((newPatches.length / state.mission3.target) * 100)),
          completed: isComplete,
        };

        const newCo2 = state.co2Absorbed + GAME_CONFIG.CO2_PER_FOREST_KG;
        const newCleanliness = calculateCleanliness(state.mission1, state.mission2, newM3, state.mission4);

        sound.playSprout();
        sound.triggerHaptic(20);
        sound.updateAmbientProgress(newCleanliness);

        let modalMission = state.completedModalMission;
        let nextActive = state.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 3;
          nextActive = 4;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;
        if (isFinished && !state.finished) {
          sound.playMilestone();
        }

        set({
          cleanliness: newCleanliness,
          mission3: newM3,
          co2Absorbed: newCo2,
          completedModalMission: modalMission,
          activeMissionId: nextActive,
          finished: isFinished,
        });
      },

      // Mission 4: Sweep ocean plastic particles
      updateOceanSweep: (sweptPercent) => {
        const state = get();
        const currentSwept = Math.max(state.mission4.sweptPercent, sweptPercent);
        const isComplete = currentSwept >= state.mission4.target;
        const wasComplete = state.mission4.completed;

        const newM4 = {
          ...state.mission4,
          sweptPercent: currentSwept,
          progress: Math.min(100, Math.round((currentSwept / state.mission4.target) * 100)),
          completed: isComplete,
        };

        const newCleanliness = calculateCleanliness(state.mission1, state.mission2, state.mission3, newM4);

        sound.playSweep();
        sound.updateAmbientProgress(newCleanliness);

        let modalMission = state.completedModalMission;
        if (isComplete && !wasComplete) {
          modalMission = 4;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;
        if (isFinished && !state.finished) {
          sound.playMilestone();
        }

        set({
          cleanliness: newCleanliness,
          mission4: newM4,
          completedModalMission: modalMission,
          finished: isFinished,
        });
      },

      setActiveMission: (id) => set({ activeMissionId: id }),
      setCompletedModalMission: (id) => set({ completedModalMission: id }),
      closeCompletedModal: () => set({ completedModalMission: null }),
      dismissToast: () => set({ activeToast: null }),

      toggleMute: () => {
        const next = !get().muted;
        sound.setMuted(next);
        set({ muted: next });
      },

      toggleLiteMode: () => set((s) => ({ liteMode: !s.liteMode })),
      setLiteMode: (val) => set({ liteMode: val }),

      dismissTutorial: () => set({ tutorialDismissed: true }),

      addPledge: (pledgeId) => {
        const state = get();
        if (state.pledges.includes(pledgeId)) return;
        set({ pledges: [...state.pledges, pledgeId] });
      },

      // Skip & Auto-Heal Everything (Accessibility & instant review)
      skipAndHealAll: () => {
        sound.playMilestone();
        set({
          cleanliness: 100,
          finished: true,
          itemsCollected: GAME_CONFIG.MISSION_1_TARGET,
          co2Absorbed: GAME_CONFIG.MISSION_3_TARGET * GAME_CONFIG.CO2_PER_FOREST_KG,
          mission1: {
            progress: 100,
            target: GAME_CONFIG.MISSION_1_TARGET,
            count: GAME_CONFIG.MISSION_1_TARGET,
            completed: true,
            collectedIds: Array.from({ length: GAME_CONFIG.MISSION_1_TARGET }, (_, i) => i),
          },
          mission2: {
            progress: 100,
            target: GAME_CONFIG.MISSION_2_TARGET,
            completed: true,
            convertedSources: Array.from({ length: GAME_CONFIG.MISSION_2_TARGET }, (_, i) => i),
          },
          mission3: {
            progress: 100,
            target: GAME_CONFIG.MISSION_3_TARGET,
            completed: true,
            plantedPatches: Array.from({ length: GAME_CONFIG.MISSION_3_TARGET }, (_, i) => i),
          },
          mission4: {
            progress: 100,
            target: GAME_CONFIG.MISSION_4_TARGET,
            completed: true,
            sweptPercent: 100,
          },
          completedModalMission: null,
        });
      },

      // Reset / Play Again
      restartGame: () => {
        set({
          cleanliness: 0,
          finished: false,
          itemsCollected: 0,
          co2Absorbed: 0,
          combo: 1,
          activeMissionId: 1,
          completedModalMission: null,
          startTime: Date.now(),
          elapsedSeconds: 0,
          factsShownMilestones: [],
          mission1: {
            progress: 0,
            target: GAME_CONFIG.MISSION_1_TARGET,
            count: 0,
            completed: false,
            collectedIds: [],
          },
          mission2: {
            progress: 0,
            target: GAME_CONFIG.MISSION_2_TARGET,
            completed: false,
            convertedSources: [],
          },
          mission3: {
            progress: 0,
            target: GAME_CONFIG.MISSION_3_TARGET,
            completed: false,
            plantedPatches: [],
          },
          mission4: {
            progress: 0,
            target: GAME_CONFIG.MISSION_4_TARGET,
            completed: false,
            sweptPercent: 0,
          },
        });
        sound.updateAmbientProgress(0);
      },
    }),
    {
      name: 'ecofuture_game_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cleanliness: state.cleanliness,
        mission1: state.mission1,
        mission2: state.mission2,
        mission3: state.mission3,
        mission4: state.mission4,
        itemsCollected: state.itemsCollected,
        co2Absorbed: state.co2Absorbed,
        pledges: state.pledges,
        muted: state.muted,
        liteMode: state.liteMode,
        tutorialDismissed: state.tutorialDismissed,
      }),
    }
  )
);

export default useGameStore;

