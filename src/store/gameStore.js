import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GAME_CONFIG } from '../config/game';
import { sound } from '../utils/audio';
import { cleanupHealMask, quizHealMask } from '../three/HealMask';
import { QUIZ_QUESTIONS } from '../data/quiz';

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

function calculateCleanupHealth(m1, m2, m3, m4) {
  const t1 = GAME_CONFIG.MISSION_1_TARGET;
  const t2 = GAME_CONFIG.MISSION_2_TARGET;
  const t3 = GAME_CONFIG.MISSION_3_TARGET;
  const t4 = GAME_CONFIG.MISSION_4_TARGET;
  const p1 = Math.min(1.0, (m1?.count ?? 0) / t1) * GAME_CONFIG.WEIGHT_MISSION_1;
  const p2 = Math.min(1.0, (m2?.convertedSources?.length ?? 0) / t2) * GAME_CONFIG.WEIGHT_MISSION_2;
  const p3 = Math.min(1.0, (m3?.plantedPatches?.length ?? 0) / t3) * GAME_CONFIG.WEIGHT_MISSION_3;
  const p4 = Math.min(1.0, (m4?.sweptPercent ?? 0) / t4) * GAME_CONFIG.WEIGHT_MISSION_4;
  return Math.min(100, Math.round(p1 + p2 + p3 + p4));
}

// Fisher-Yates array shuffle helper
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function prepareShuffledQuiz() {
  return shuffleArray(QUIZ_QUESTIONS).map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════
      // SLICE 1: CLEANUP GAME (/clean) — 100% INDEPENDENT
      // ═══════════════════════════════════════════════════════════
      cleanup: {
        health: 0,
        completed: false,
        activeMissionId: 1,
        itemsCollected: 0,
        co2Absorbed: 0,
        combo: 1,
        lastCollectTime: 0,
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
          sweptIds: [],
        },
        healRegions: [],
        milestonesAchieved: [],
      },

      // ═══════════════════════════════════════════════════════════
      // SLICE 2: QUIZ GAME (/quiz) — 100% INDEPENDENT
      // ═══════════════════════════════════════════════════════════
      quiz: {
        health: 0,
        completed: false,
        score: 0,
        bestScore: 0,
        currentQuestion: 0,
        answers: {}, // { [qId]: { chosen: string, isCorrect: boolean } }
        healRegions: [],
        shuffledQuestions: prepareShuffledQuiz(),
      },

      // ═══════════════════════════════════════════════════════════
      // SLICE 3: GAME 3 PLACEHOLDER (/game-3) — UNUSED FOR NOW
      // ═══════════════════════════════════════════════════════════
      game3: {
        health: 0,
        completed: false,
        healRegions: [],
      },

      // ═══════════════════════════════════════════════════════════
      // GLOBAL SETTINGS & SHARED FEEDBACK
      // ═══════════════════════════════════════════════════════════
      muted: false,
      liteMode: false,
      pledges: [],
      tutorialDismissed: false,

      // Feedback & Modal state
      activeToast: null,
      milestoneToast: null,
      completedModalMission: null,
      factsShownMilestones: [],
      planetPulseTrigger: 0,

      // ── Convenience Mirrors for Backwards Compatibility on /clean ──
      cleanliness: 0,
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
        sweptIds: [],
      },
      activeMissionId: 1,
      itemsCollected: 0,
      co2Absorbed: 0,
      combo: 1,
      healRegions: [],
      finished: false,

      // Centralized helper ensuring atomic, reactive updates for both cleanup slice and root mirrors
      setCleanupState: (cleanupUpdates, extraUpdates = {}) => {
        const state = get();
        const nextCleanup =
          typeof cleanupUpdates === 'function'
            ? cleanupUpdates(state.cleanup)
            : { ...state.cleanup, ...cleanupUpdates };

        set({
          ...extraUpdates,
          cleanup: nextCleanup,
          cleanliness: nextCleanup.health,
          mission1: nextCleanup.mission1,
          mission2: nextCleanup.mission2,
          mission3: nextCleanup.mission3,
          mission4: nextCleanup.mission4,
          activeMissionId: nextCleanup.activeMissionId,
          itemsCollected: nextCleanup.itemsCollected,
          co2Absorbed: nextCleanup.co2Absorbed,
          combo: nextCleanup.combo,
          healRegions: nextCleanup.healRegions,
          finished: nextCleanup.completed,
        });

        return nextCleanup;
      },

      // ── Shared Milestone Trigger ──
      checkCleanupMilestones: (newHealth) => {
        const state = get();
        const achieved = [...state.cleanup.milestonesAchieved];
        const milestones = [25, 50, 75, 100];

        for (const m of milestones) {
          if (newHealth >= m && !achieved.includes(m)) {
            achieved.push(m);
            const msg = MILESTONE_MESSAGES[m];
            sound.playMilestone();
            get().setCleanupState(
              {
                milestonesAchieved: achieved,
              },
              {
                milestoneToast: { level: m, ...msg },
                planetPulseTrigger: Date.now(),
              }
            );
            break;
          }
        }
      },

      dismissMilestoneToast: () => set({ milestoneToast: null }),
      dismissToast: () => set({ activeToast: null }),

      // ═══════════════════════════════════════════════════════════
      // CLEANUP ACTIONS (affects cleanup slice and root mirrors)
      // ═══════════════════════════════════════════════════════════
      collectDebrisItem: (id, type = 'bottle', points = 1) => {
        const state = get();
        if (state.cleanup.mission1.collectedIds.includes(id)) return;

        const now = Date.now();
        const timeDiff = (now - state.cleanup.lastCollectTime) / 1000;
        const newCombo = timeDiff < GAME_CONFIG.COMBO_RESET_SECONDS ? Math.min(state.cleanup.combo + 1, 5) : 1;

        const target = GAME_CONFIG.MISSION_1_TARGET;
        const newCount = state.cleanup.mission1.count + 1;
        const newCollectedIds = [...state.cleanup.mission1.collectedIds, id];
        const isComplete = newCount >= target;
        const wasComplete = state.cleanup.mission1.completed;

        const newM1 = {
          ...state.cleanup.mission1,
          target,
          count: newCount,
          collectedIds: newCollectedIds,
          progress: Math.min(100, Math.round((newCount / target) * 100)),
          completed: isComplete,
        };

        const newTotalItems = state.cleanup.itemsCollected + 1;
        const newHealth = calculateCleanupHealth(
          newM1,
          state.cleanup.mission2,
          state.cleanup.mission3,
          state.cleanup.mission4
        );

        sound.playPop(1.0 + (newCombo - 1) * 0.15);
        sound.triggerHaptic(15);
        sound.updateAmbientProgress(newHealth);

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
        let nextActive = state.cleanup.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 1;
          nextActive = 2;
          sound.playMilestone();
        }

        const isFinished = newHealth >= 100;

        get().setCleanupState(
          {
            health: newHealth,
            completed: isFinished,
            mission1: newM1,
            itemsCollected: newTotalItems,
            combo: newCombo,
            lastCollectTime: now,
            activeMissionId: nextActive,
          },
          {
            activeToast: newToast,
            factsShownMilestones: newFactsShown,
            completedModalMission: modalMission,
          }
        );

        get().checkCleanupMilestones(newHealth);

        return { points, combo: newCombo };
      },

      convertSmogSource: (sourceId) => {
        const state = get();
        if (state.cleanup.mission2.convertedSources.includes(sourceId)) return;

        const target = GAME_CONFIG.MISSION_2_TARGET;
        const newSources = [...state.cleanup.mission2.convertedSources, sourceId];
        const isComplete = newSources.length >= target;
        const wasComplete = state.cleanup.mission2.completed;

        const newM2 = {
          ...state.cleanup.mission2,
          target,
          convertedSources: newSources,
          progress: Math.min(100, Math.round((newSources.length / target) * 100)),
          completed: isComplete,
        };

        const newHealth = calculateCleanupHealth(
          state.cleanup.mission1,
          newM2,
          state.cleanup.mission3,
          state.cleanup.mission4
        );

        const loc = SMOG_LOCATIONS.find((s) => s.id === sourceId) || { lat: 30, lon: 100 };
        const newRegion = { lat: loc.lat, lon: loc.lon, radius: 0.10, alpha: 1.0 };
        cleanupHealMask.paintRegion(loc.lat, loc.lon, 0.10, 1.0);
        const updatedRegions = [...state.cleanup.healRegions, newRegion];

        sound.playConvert();
        sound.triggerHaptic(25);
        sound.updateAmbientProgress(newHealth);

        let modalMission = state.completedModalMission;
        let nextActive = state.cleanup.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 2;
          nextActive = 3;
          sound.playMilestone();
        }

        const isFinished = newHealth >= 100;

        get().setCleanupState(
          {
            health: newHealth,
            completed: isFinished,
            mission2: newM2,
            healRegions: updatedRegions,
            activeMissionId: nextActive,
          },
          {
            completedModalMission: modalMission,
          }
        );

        get().checkCleanupMilestones(newHealth);
      },

      plantForestPatch: (patchId) => {
        const state = get();
        if (state.cleanup.mission3.plantedPatches.includes(patchId)) return;

        const target = GAME_CONFIG.MISSION_3_TARGET;
        const newPatches = [...state.cleanup.mission3.plantedPatches, patchId];
        const isComplete = newPatches.length >= target;
        const wasComplete = state.cleanup.mission3.completed;

        const newM3 = {
          ...state.cleanup.mission3,
          target,
          plantedPatches: newPatches,
          progress: Math.min(100, Math.round((newPatches.length / target) * 100)),
          completed: isComplete,
        };

        const newCo2 = state.cleanup.co2Absorbed + GAME_CONFIG.CO2_PER_FOREST_KG;
        const newHealth = calculateCleanupHealth(
          state.cleanup.mission1,
          state.cleanup.mission2,
          newM3,
          state.cleanup.mission4
        );

        const loc = FOREST_LOCATIONS.find((f) => f.id === patchId) || { lat: 0, lon: 0 };
        const newRegion = { lat: loc.lat, lon: loc.lon, radius: 0.12, alpha: 1.0 };
        cleanupHealMask.paintRegion(loc.lat, loc.lon, 0.12, 1.0);
        const updatedRegions = [...state.cleanup.healRegions, newRegion];

        sound.playSprout();
        sound.triggerHaptic(20);
        sound.updateAmbientProgress(newHealth);

        let modalMission = state.completedModalMission;
        let nextActive = state.cleanup.activeMissionId;
        if (isComplete && !wasComplete) {
          modalMission = 3;
          nextActive = 4;
          sound.playMilestone();
        }

        const isFinished = newHealth >= 100;

        get().setCleanupState(
          {
            health: newHealth,
            completed: isFinished,
            mission3: newM3,
            healRegions: updatedRegions,
            co2Absorbed: newCo2,
            activeMissionId: nextActive,
          },
          {
            completedModalMission: modalMission,
          }
        );

        get().checkCleanupMilestones(newHealth);
      },

      updateOceanSweep: (sweptPercent, newlySweptIds = []) => {
        const state = get();
        const target = GAME_CONFIG.MISSION_4_TARGET;
        const currentSwept = Math.max(state.cleanup.mission4.sweptPercent, sweptPercent);
        const existingIds = state.cleanup.mission4.sweptIds || [];
        const mergedIds = Array.from(new Set([...existingIds, ...newlySweptIds]));
        const isComplete = currentSwept >= target;
        const wasComplete = state.cleanup.mission4.completed;

        const newM4 = {
          ...state.cleanup.mission4,
          target,
          sweptPercent: currentSwept,
          sweptIds: mergedIds,
          progress: Math.min(100, Math.round((currentSwept / target) * 100)),
          completed: isComplete,
        };

        const newHealth = calculateCleanupHealth(
          state.cleanup.mission1,
          state.cleanup.mission2,
          state.cleanup.mission3,
          newM4
        );

        let updatedRegions = [...state.cleanup.healRegions];
        OCEAN_GYRES.forEach((g) => {
          if (!updatedRegions.some((r) => Math.abs(r.lat - g.lat) < 5 && Math.abs(r.lon - g.lon) < 5)) {
            cleanupHealMask.paintRegion(g.lat, g.lon, 0.15, 0.9);
            updatedRegions.push({ lat: g.lat, lon: g.lon, radius: 0.15, alpha: 0.9 });
          }
        });

        sound.playSweep();
        sound.updateAmbientProgress(newHealth);

        let modalMission = state.completedModalMission;
        if (isComplete && !wasComplete) {
          modalMission = 4;
          sound.playMilestone();
        }

        const isFinished = newHealth >= 100;

        get().setCleanupState(
          {
            health: newHealth,
            completed: isFinished,
            mission4: newM4,
            healRegions: updatedRegions,
          },
          {
            completedModalMission: modalMission,
          }
        );

        get().checkCleanupMilestones(newHealth);
      },

      setActiveMission: (id) =>
        get().setCleanupState({ activeMissionId: id }),

      setCompletedModalMission: (id) => set({ completedModalMission: id }),
      closeCompletedModal: () => set({ completedModalMission: null }),

      // Skip & Auto-Heal Cleanup Game only
      skipAndHealAll: () => {
        const startHealth = get().cleanup.health;
        const targetHealth = 100;
        const duration = 3500;
        const startTime = performance.now();

        FOREST_LOCATIONS.forEach((f) => cleanupHealMask.paintRegion(f.lat, f.lon, 0.14, 1.0));
        SMOG_LOCATIONS.forEach((s) => cleanupHealMask.paintRegion(s.lat, s.lon, 0.12, 1.0));
        OCEAN_GYRES.forEach((g) => cleanupHealMask.paintRegion(g.lat, g.lon, 0.18, 1.0));

        const allRegions = [
          ...FOREST_LOCATIONS.map((f) => ({ lat: f.lat, lon: f.lon, radius: 0.14, alpha: 1.0 })),
          ...SMOG_LOCATIONS.map((s) => ({ lat: s.lat, lon: s.lon, radius: 0.12, alpha: 1.0 })),
          ...OCEAN_GYRES.map((g) => ({ lat: g.lat, lon: g.lon, radius: 0.18, alpha: 1.0 })),
        ];

        const animateStep = (now) => {
          const elapsed = now - startTime;
          const p = Math.min(1.0, elapsed / duration);
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          const currentVal = Math.round(startHealth + (targetHealth - startHealth) * eased);

          get().setCleanupState({ health: currentVal });
          get().checkCleanupMilestones(currentVal);

          if (p < 1.0) {
            requestAnimationFrame(animateStep);
          } else {
            cleanupHealMask.fill();
            get().setCleanupState(
              {
                health: 100,
                completed: true,
                healRegions: allRegions,
                itemsCollected: GAME_CONFIG.MISSION_1_TARGET,
                co2Absorbed: GAME_CONFIG.MISSION_3_TARGET * GAME_CONFIG.CO2_PER_FOREST_KG,
                mission1: {
                  progress: 100,
                  target: GAME_CONFIG.MISSION_1_TARGET,
                  count: GAME_CONFIG.MISSION_1_TARGET,
                  completed: true,
                  collectedIds: Array.from({ length: 60 }, (_, i) => i),
                },
                mission2: {
                  progress: 100,
                  target: GAME_CONFIG.MISSION_2_TARGET,
                  completed: true,
                  convertedSources: Array.from({ length: 8 }, (_, i) => i),
                },
                mission3: {
                  progress: 100,
                  target: GAME_CONFIG.MISSION_3_TARGET,
                  completed: true,
                  plantedPatches: Array.from({ length: 10 }, (_, i) => i),
                },
                mission4: {
                  progress: 100,
                  target: GAME_CONFIG.MISSION_4_TARGET,
                  completed: true,
                  sweptPercent: 100,
                  sweptIds: Array.from({ length: 140 }, (_, i) => i),
                },
              },
              {
                completedModalMission: null,
              }
            );
            sound.playMilestone();
          }
        };

        requestAnimationFrame(animateStep);
      },

      // Restart ONLY Cleanup Game
      restartCleanup: () => {
        cleanupHealMask.clear();
        get().setCleanupState(
          {
            health: 0,
            completed: false,
            itemsCollected: 0,
            co2Absorbed: 0,
            combo: 1,
            activeMissionId: 1,
            lastCollectTime: 0,
            healRegions: [],
            milestonesAchieved: [],
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
              sweptIds: [],
            },
          },
          {
            completedModalMission: null,
            milestoneToast: null,
            planetPulseTrigger: 0,
          }
        );
        sound.updateAmbientProgress(0);
      },

      // Backwards-compatible alias for existing Cleanup components
      restartGame: () => {
        get().restartCleanup();
      },

      // ═══════════════════════════════════════════════════════════
      // QUIZ ACTIONS (affects quiz slice only)
      // ═══════════════════════════════════════════════════════════
      answerQuizQuestion: (questionId, chosenOption, isCorrect, region) => {
        const state = get();
        const curScore = state.quiz.score + (isCorrect ? 1 : 0);
        const curHealth = Math.min(100, state.quiz.health + (isCorrect ? 10 : 0));
        const newBest = Math.max(state.quiz.bestScore, curScore);

        let updatedHealRegions = [...state.quiz.healRegions];
        if (isCorrect && region) {
          quizHealMask.paintRegion(region.lat, region.lon, region.radius || 0.15, 1.0);
          updatedHealRegions.push({
            lat: region.lat,
            lon: region.lon,
            radius: region.radius || 0.15,
            alpha: 1.0,
          });
          sound.playConvert();
          sound.triggerHaptic(20);
        }

        set({
          quiz: {
            ...state.quiz,
            score: curScore,
            health: curHealth,
            bestScore: newBest,
            healRegions: updatedHealRegions,
            answers: {
              ...state.quiz.answers,
              [questionId]: { chosen: chosenOption, isCorrect },
            },
          },
          planetPulseTrigger: isCorrect ? Date.now() : state.planetPulseTrigger,
        });

        // Milestone notifications for Quiz Earth
        const milestones = [25, 50, 75, 100];
        milestones.forEach((m) => {
          if (curHealth >= m && state.quiz.health < m) {
            set({
              milestoneToast: { level: m, ...MILESTONE_MESSAGES[m] },
            });
            sound.playMilestone();
          }
        });
      },

      nextQuizQuestion: () => {
        const state = get();
        const nextQ = state.quiz.currentQuestion + 1;
        const total = state.quiz.shuffledQuestions.length;
        const isComplete = nextQ >= total;

        set({
          quiz: {
            ...state.quiz,
            currentQuestion: isComplete ? total - 1 : nextQ,
            completed: isComplete,
            bestScore: Math.max(state.quiz.bestScore, state.quiz.score),
          },
        });

        if (isComplete && state.quiz.score === total) {
          sound.playMilestone();
        }
      },

      retakeQuiz: () => {
        quizHealMask.clear();
        const state = get();
        set({
          quiz: {
            health: 0,
            completed: false,
            score: 0,
            bestScore: state.quiz.bestScore,
            currentQuestion: 0,
            answers: {},
            healRegions: [],
            shuffledQuestions: prepareShuffledQuiz(),
          },
          milestoneToast: null,
          planetPulseTrigger: 0,
        });
      },

      // ═══════════════════════════════════════════════════════════
      // RESET ALL PROGRESS (Hub footer link)
      // ═══════════════════════════════════════════════════════════
      resetAllProgress: () => {
        cleanupHealMask.clear();
        quizHealMask.clear();
        set({
          cleanup: {
            health: 0,
            completed: false,
            itemsCollected: 0,
            co2Absorbed: 0,
            combo: 1,
            activeMissionId: 1,
            lastCollectTime: 0,
            healRegions: [],
            milestonesAchieved: [],
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
              sweptIds: [],
            },
          },
          quiz: {
            health: 0,
            completed: false,
            score: 0,
            bestScore: 0,
            currentQuestion: 0,
            answers: {},
            healRegions: [],
            shuffledQuestions: prepareShuffledQuiz(),
          },
          game3: {
            health: 0,
            completed: false,
            healRegions: [],
          },
          pledges: [],
          completedModalMission: null,
          milestoneToast: null,
          activeToast: null,
          factsShownMilestones: [],
          planetPulseTrigger: 0,
        });
        sound.updateAmbientProgress(0);
      },

      // Global User Settings
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
    }),
    {
      // Preserved storage key during rebrand to TerraHeal to keep all existing saved user progress intact
      name: 'ecofuture_game_storage',
      version: 3, // Bumped version for reduced mission targets and synced reactive mirrors
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cleanup: state.cleanup,
        quiz: state.quiz,
        game3: state.game3,
        muted: state.muted,
        liteMode: state.liteMode,
        pledges: state.pledges,
        tutorialDismissed: state.tutorialDismissed,
      }),
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        let state = persistedState;
        if (version < 2) {
          const old = persistedState;
          state = {
            cleanup: {
              health: old.cleanliness || 0,
              completed: old.finished || (old.cleanliness >= 100),
              itemsCollected: old.itemsCollected || 0,
              co2Absorbed: old.co2Absorbed || 0,
              combo: 1,
              activeMissionId: old.activeMissionId || 1,
              lastCollectTime: 0,
              mission1: old.mission1 || {
                progress: 0,
                target: GAME_CONFIG.MISSION_1_TARGET,
                count: 0,
                completed: false,
                collectedIds: [],
              },
              mission2: old.mission2 || {
                progress: 0,
                target: GAME_CONFIG.MISSION_2_TARGET,
                completed: false,
                convertedSources: [],
              },
              mission3: old.mission3 || {
                progress: 0,
                target: GAME_CONFIG.MISSION_3_TARGET,
                completed: false,
                plantedPatches: [],
              },
              mission4: old.mission4 || {
                progress: 0,
                target: GAME_CONFIG.MISSION_4_TARGET,
                completed: false,
                sweptPercent: 0,
              },
              healRegions: old.healRegions || [],
              milestonesAchieved: old.milestonesAchieved || [],
            },
            quiz: {
              health: 0,
              completed: false,
              score: 0,
              bestScore: 0,
              currentQuestion: 0,
              answers: {},
              healRegions: [],
              shuffledQuestions: prepareShuffledQuiz(),
            },
            game3: {
              health: 0,
              completed: false,
              healRegions: [],
            },
            muted: old.muted || false,
            liteMode: old.liteMode || false,
            pledges: old.pledges || [],
            tutorialDismissed: old.tutorialDismissed || false,
          };
        }
        if (version < 3) {
          if (state && state.cleanup) {
            if (state.cleanup.mission1) {
              state.cleanup.mission1.target = GAME_CONFIG.MISSION_1_TARGET;
              state.cleanup.mission1.progress = Math.min(100, Math.round(((state.cleanup.mission1.count || 0) / GAME_CONFIG.MISSION_1_TARGET) * 100));
              state.cleanup.mission1.completed = (state.cleanup.mission1.count || 0) >= GAME_CONFIG.MISSION_1_TARGET;
            }
            if (state.cleanup.mission2) {
              state.cleanup.mission2.target = GAME_CONFIG.MISSION_2_TARGET;
              const converted = state.cleanup.mission2.convertedSources?.length || 0;
              state.cleanup.mission2.progress = Math.min(100, Math.round((converted / GAME_CONFIG.MISSION_2_TARGET) * 100));
              state.cleanup.mission2.completed = converted >= GAME_CONFIG.MISSION_2_TARGET;
            }
            if (state.cleanup.mission3) {
              state.cleanup.mission3.target = GAME_CONFIG.MISSION_3_TARGET;
              const planted = state.cleanup.mission3.plantedPatches?.length || 0;
              state.cleanup.mission3.progress = Math.min(100, Math.round((planted / GAME_CONFIG.MISSION_3_TARGET) * 100));
              state.cleanup.mission3.completed = planted >= GAME_CONFIG.MISSION_3_TARGET;
            }
            if (state.cleanup.mission4) {
              state.cleanup.mission4.target = GAME_CONFIG.MISSION_4_TARGET;
              const swept = state.cleanup.mission4.sweptPercent || 0;
              state.cleanup.mission4.progress = Math.min(100, Math.round((swept / GAME_CONFIG.MISSION_4_TARGET) * 100));
              state.cleanup.mission4.completed = swept >= GAME_CONFIG.MISSION_4_TARGET;
            }
            state.cleanup.health = calculateCleanupHealth(
              state.cleanup.mission1,
              state.cleanup.mission2,
              state.cleanup.mission3,
              state.cleanup.mission4
            );
          }
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.cleanup) {
          // Keep targets normalized with latest GAME_CONFIG
          state.cleanup.mission1.target = GAME_CONFIG.MISSION_1_TARGET;
          state.cleanup.mission2.target = GAME_CONFIG.MISSION_2_TARGET;
          state.cleanup.mission3.target = GAME_CONFIG.MISSION_3_TARGET;
          state.cleanup.mission4.target = GAME_CONFIG.MISSION_4_TARGET;
          // Synchronize root mirrors
          state.cleanliness = state.cleanup.health;
          state.mission1 = state.cleanup.mission1;
          state.mission2 = state.cleanup.mission2;
          state.mission3 = state.cleanup.mission3;
          state.mission4 = state.cleanup.mission4;
          state.activeMissionId = state.cleanup.activeMissionId;
          state.itemsCollected = state.cleanup.itemsCollected;
          state.co2Absorbed = state.cleanup.co2Absorbed;
          state.combo = state.cleanup.combo;
          state.healRegions = state.cleanup.healRegions;
          state.finished = state.cleanup.completed;
        }
      },
    }
  )
);

export default useGameStore;
if (typeof window !== 'undefined') {
  window.useGameStore = useGameStore;
}
