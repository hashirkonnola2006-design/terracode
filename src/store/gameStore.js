import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GAME_CONFIG } from '../config/game';
import { sound } from '../utils/audio';
import { healMask } from '../three/HealMask';

export const SMOG_LOCATIONS = [
  { id: 0, lat: 41.5, lon: -87.5 },
  { id: 1, lat: 51.4, lon: 7.0 },
  { id: 2, lat: 31.2, lon: 121.5 },
  { id: 3, lat: 28.6, lon: 77.2 },
  { id: 4, lat: 26.5, lon: 50.5 },
  { id: 5, lat: -23.5, lon: -46.6 },
  { id: 6, lat: -26.2, lon: 29.2 },
  { id: 7, lat: -6.2, lon: 106.8 },
];

export const FOREST_LOCATIONS = [
  { id: 0, lat: -8.5, lon: -55.0 },
  { id: 1, lat: -1.2, lon: 22.5 },
  { id: 2, lat: 53.5, lon: -105.0 },
  { id: 3, lat: 56.0, lon: 92.0 },
  { id: 4, lat: 0.5, lon: 114.0 },
  { id: 5, lat: -22.0, lon: -43.5 },
  { id: 6, lat: -34.0, lon: 148.5 },
  { id: 7, lat: -19.0, lon: 47.0 },
  { id: 8, lat: 14.2, lon: -88.5 },
  { id: 9, lat: 13.0, lon: 75.5 },
];

export const OCEAN_GYRES = [
  { id: 0, lat: 30, lon: -145 },
  { id: 1, lat: 28, lon: -40 },
  { id: 2, lat: -15, lon: 80 },
  { id: 3, lat: -25, lon: -110 },
];

const MILESTONE_MESSAGES = {
  25: { title: '25% - Oceans are recovering', sub: 'Marine ecosystems and coral biomes are stabilizing' },
  50: { title: '50% - Forests are returning', sub: 'Continental canopies and carbon sinks are expanding' },
  75: { title: '75% - The air is clearing', sub: 'Atmospheric smog is dissipating across industrial hubs' },
  100: { title: '100% - Earth restored', sub: 'A vibrant, fully healed biosphere for all life on Earth' },
};

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

      // Milestone & Visual Feedback
      milestonesAchieved: [],
      milestoneToast: null,
      planetPulseTrigger: 0,

      // Local Heal Mask Painted Regions (Persistent)
      healRegions: [],

      // Modal & Toast feedback
      completedModalMission: null,
      activeToast: null,
      factsShownMilestones: [],

      // Helper to check and fire milestones
      checkMilestones: (newCleanliness) => {
        const state = get();
        const achieved = [...state.milestonesAchieved];
        const milestones = [25, 50, 75, 100];

        for (const m of milestones) {
          if (newCleanliness >= m && !achieved.includes(m)) {
            achieved.push(m);
            const msg = MILESTONE_MESSAGES[m];
            sound.playMilestone();
            set({
              milestonesAchieved: achieved,
              milestoneToast: { level: m, ...msg },
              planetPulseTrigger: Date.now(),
            });
            break;
          }
        }
      },

      dismissMilestoneToast: () => set({ milestoneToast: null }),

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

        sound.playPop(1.0 + (newCombo - 1) * 0.15);
        sound.triggerHaptic(15);
        sound.updateAmbientProgress(newCleanliness);

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

        let modalMission = state.completedModalMission;
        let nextActive = state.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 1;
          nextActive = 2;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;

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

        get().checkMilestones(newCleanliness);

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

        // Paint into Local Heal Mask & save region
        const loc = SMOG_LOCATIONS.find((s) => s.id === sourceId) || { lat: 30, lon: 100 };
        const newRegion = { lat: loc.lat, lon: loc.lon, radius: 0.10, alpha: 1.0 };
        healMask.paintRegion(loc.lat, loc.lon, 0.10, 1.0);
        const updatedRegions = [...state.healRegions, newRegion];

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

        set({
          cleanliness: newCleanliness,
          mission2: newM2,
          healRegions: updatedRegions,
          completedModalMission: modalMission,
          activeMissionId: nextActive,
          finished: isFinished,
        });

        get().checkMilestones(newCleanliness);
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

        // Paint into Local Heal Mask & save region
        const loc = FOREST_LOCATIONS.find((f) => f.id === patchId) || { lat: 0, lon: 0 };
        const newRegion = { lat: loc.lat, lon: loc.lon, radius: 0.12, alpha: 1.0 };
        healMask.paintRegion(loc.lat, loc.lon, 0.12, 1.0);
        const updatedRegions = [...state.healRegions, newRegion];

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

        set({
          cleanliness: newCleanliness,
          mission3: newM3,
          healRegions: updatedRegions,
          co2Absorbed: newCo2,
          completedModalMission: modalMission,
          activeMissionId: nextActive,
          finished: isFinished,
        });

        get().checkMilestones(newCleanliness);
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

        // Check if ocean gyres should be painted
        let updatedRegions = [...state.healRegions];
        OCEAN_GYRES.forEach((g) => {
          if (!updatedRegions.some((r) => Math.abs(r.lat - g.lat) < 5 && Math.abs(r.lon - g.lon) < 5)) {
            healMask.paintRegion(g.lat, g.lon, 0.15, 0.9);
            updatedRegions.push({ lat: g.lat, lon: g.lon, radius: 0.15, alpha: 0.9 });
          }
        });

        sound.playSweep();
        sound.updateAmbientProgress(newCleanliness);

        let modalMission = state.completedModalMission;
        if (isComplete && !wasComplete) {
          modalMission = 4;
          sound.playMilestone();
        }

        const isFinished = newCleanliness >= 100;

        set({
          cleanliness: newCleanliness,
          mission4: newM4,
          healRegions: updatedRegions,
          completedModalMission: modalMission,
          finished: isFinished,
        });

        get().checkMilestones(newCleanliness);
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

      // Skip & Auto-Heal Everything (smoothly animates over ~3.5 seconds)
      skipAndHealAll: () => {
        const startCleanliness = get().cleanliness;
        const targetCleanliness = 100;
        const duration = 3500; // 3.5 seconds
        const startTime = performance.now();

        // Paint all regions into heal mask
        FOREST_LOCATIONS.forEach((f) => healMask.paintRegion(f.lat, f.lon, 0.14, 1.0));
        SMOG_LOCATIONS.forEach((s) => healMask.paintRegion(s.lat, s.lon, 0.12, 1.0));
        OCEAN_GYRES.forEach((g) => healMask.paintRegion(g.lat, g.lon, 0.18, 1.0));

        const allRegions = [
          ...FOREST_LOCATIONS.map((f) => ({ lat: f.lat, lon: f.lon, radius: 0.14, alpha: 1.0 })),
          ...SMOG_LOCATIONS.map((s) => ({ lat: s.lat, lon: s.lon, radius: 0.12, alpha: 1.0 })),
          ...OCEAN_GYRES.map((g) => ({ lat: g.lat, lon: g.lon, radius: 0.18, alpha: 1.0 })),
        ];

        const animateStep = (now) => {
          const elapsed = now - startTime;
          const p = Math.min(1.0, elapsed / duration);
          // Smooth sinusoidal ease-in-out
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          const currentVal = Math.round(startCleanliness + (targetCleanliness - startCleanliness) * eased);

          set({ cleanliness: currentVal });
          get().checkMilestones(currentVal);

          if (p < 1.0) {
            requestAnimationFrame(animateStep);
          } else {
            healMask.fill();
            set({
              cleanliness: 100,
              finished: true,
              healRegions: allRegions,
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
            sound.playMilestone();
          }
        };

        requestAnimationFrame(animateStep);
      },

      // Reset / Play Again
      restartGame: () => {
        healMask.clear();
        set({
          cleanliness: 0,
          finished: false,
          itemsCollected: 0,
          co2Absorbed: 0,
          combo: 1,
          activeMissionId: 1,
          completedModalMission: null,
          milestonesAchieved: [],
          milestoneToast: null,
          planetPulseTrigger: 0,
          healRegions: [],
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
        healRegions: state.healRegions,
        milestonesAchieved: state.milestonesAchieved,
      }),
    }
  )
);

export default useGameStore;
