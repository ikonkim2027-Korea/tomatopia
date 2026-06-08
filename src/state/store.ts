import { create } from 'zustand';
import {
  type Environment,
  type FactorKey,
  type PlantState,
  type HarvestResult,
  newPlant,
  step,
  pollinate as pollinatePlant,
  evaluateHarvest,
  canHarvest,
  needsPollination,
} from '../sim/model';
import { MISSIONS, START_ENV, missionById, missionIndex } from '../content/missions';
import { loadLocal, saveLocal, saveRemote, type SaveData, type HarvestRecord } from './persistence';

/** Real ms per tick (4 ticks/sec). */
export const TICK_MS = 250;
/** Simulated days advanced per real second at 1x speed. */
const DAYS_PER_SEC = 0.5;

export type View = 'greenhouse' | 'profile' | 'leaderboard';

interface GameState {
  nickname: string;
  view: View;
  mode: 'mission' | 'sandbox';
  missionId: string;
  env: Environment;
  plant: PlantState;
  running: boolean;
  speed: number;
  completedMissions: string[];
  justCompleted: string | null;
  harvests: HarvestRecord[];
  totalScore: number;
  compostCredit: number;
  lastHarvest: HarvestResult | null;
  gardenId: string | null;

  // selectors
  currentMission: () => (typeof MISSIONS)[number];
  isUnlocked: (id: string) => boolean;
  canHarvestNow: () => boolean;
  needsPollinationNow: () => boolean;

  // actions
  setControl: (key: FactorKey, value: number) => void;
  tick: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
  selectMission: (id: string) => void;
  setMode: (m: 'mission' | 'sandbox') => void;
  setView: (v: View) => void;
  pollinate: () => void;
  harvest: () => void;
  replant: () => void;
  dismissCompleted: () => void;
  dismissHarvest: () => void;
  setNickname: (n: string) => void;
  resetProgress: () => void;
  save: () => void;
}

function snapshot(s: GameState): SaveData {
  return {
    nickname: s.nickname,
    mode: s.mode,
    missionId: s.missionId,
    completedMissions: s.completedMissions,
    env: s.env,
    plant: s.plant,
    totalScore: s.totalScore,
    harvests: s.harvests,
    compostCredit: s.compostCredit,
    gardenId: s.gardenId,
  };
}

/** Complete the current mission if its goal is met, and auto-advance to the next. */
function advanceMissions(s: GameState, plant: PlantState, harvestCount: number) {
  if (s.mode !== 'mission') return {};
  const m = missionById(s.missionId);
  if (s.completedMissions.includes(m.id)) return {};
  if (!m.success({ plant, harvestCount })) return {};

  const completedMissions = [...s.completedMissions, m.id];
  const idx = missionIndex(m.id);
  const next = MISSIONS[idx + 1];
  return {
    completedMissions,
    justCompleted: m.id,
    missionId: next ? next.id : m.id, // auto-advance to the next mission
    running: false, // pause to celebrate
  };
}

const saved = loadLocal();

export const useGame = create<GameState>((set, get) => ({
  nickname: saved?.nickname ?? '',
  view: 'greenhouse',
  mode: saved?.mode ?? 'mission',
  missionId: saved?.missionId ?? MISSIONS[0].id,
  env: saved?.env ?? { ...START_ENV },
  plant: saved?.plant ?? newPlant(),
  running: false,
  speed: 1,
  completedMissions: saved?.completedMissions ?? [],
  justCompleted: null,
  harvests: saved?.harvests ?? [],
  totalScore: saved?.totalScore ?? 0,
  compostCredit: saved?.compostCredit ?? 0,
  lastHarvest: null,
  gardenId: saved?.gardenId ?? null,

  currentMission: () => missionById(get().missionId),
  isUnlocked: (id) => {
    const idx = missionIndex(id);
    if (idx <= 0) return true;
    return get().completedMissions.includes(MISSIONS[idx - 1].id);
  },
  canHarvestNow: () => canHarvest(get().plant),
  needsPollinationNow: () => needsPollination(get().plant),

  setControl: (key, value) => set((s) => ({ env: { ...s.env, [key]: value } })),

  tick: () => {
    const s = get();
    if (!s.running || !s.plant.alive) return;
    const dt = (TICK_MS / 1000) * DAYS_PER_SEC * s.speed;
    const plant = step(s.env, s.plant, dt);
    set({ plant, ...advanceMissions(s, plant, s.harvests.length) });
  },

  togglePlay: () => set((s) => ({ running: !s.running })),
  setSpeed: (speed) => set({ speed }),

  selectMission: (id) => {
    if (!get().isUnlocked(id)) return; // locked missions can't be selected
    set({ missionId: id, mode: 'mission' });
  },

  setMode: (mode) => set({ mode }),
  setView: (view) => set({ view }),

  pollinate: () => {
    const s = get();
    const plant = pollinatePlant(s.plant);
    if (plant === s.plant) return;
    set({ plant, ...advanceMissions(s, plant, s.harvests.length) });
  },

  harvest: () => {
    const s = get();
    if (!canHarvest(s.plant)) return;
    const result = evaluateHarvest(s.plant);
    const record: HarvestRecord = {
      weightG: result.weightG,
      score: result.score,
      grade: result.grade,
      day: Math.floor(s.plant.ageDays),
      ts: Date.now(),
    };
    const harvests = [record, ...s.harvests];
    const totalScore = s.totalScore + result.score;
    const compostCredit = s.compostCredit + (result.composted ? 1 : 0);

    // Start a fresh plant; compost from spoiled fruit gives the next seedling a
    // small nutrient head start (circular, zero-waste garden).
    const nutrientBoost = Math.min(20, compostCredit * 12);
    const env = { ...s.env, nutrients: Math.min(100, s.env.nutrients + (result.composted ? nutrientBoost : 0)) };

    // Complete the harvest mission silently — the harvest result modal is the reward.
    let completedMissions = s.completedMissions;
    let missionId = s.missionId;
    if (s.mode === 'mission') {
      const m = missionById(s.missionId);
      if (!completedMissions.includes(m.id) && m.success({ plant: newPlant(), harvestCount: harvests.length })) {
        completedMissions = [...completedMissions, m.id];
        const next = MISSIONS[missionIndex(m.id) + 1];
        missionId = next ? next.id : m.id;
      }
    }

    set({
      plant: newPlant(),
      env,
      harvests,
      totalScore,
      compostCredit: result.composted ? compostCredit : s.compostCredit,
      completedMissions,
      missionId,
      lastHarvest: result,
      running: false,
    });
  },

  replant: () => set({ plant: newPlant(), running: true, lastHarvest: null }),
  dismissCompleted: () => set({ justCompleted: null, running: true }),
  dismissHarvest: () => set({ lastHarvest: null, running: true }),
  setNickname: (nickname) => set({ nickname }),

  resetProgress: () =>
    set({
      completedMissions: [],
      missionId: MISSIONS[0].id,
      mode: 'mission',
      env: { ...START_ENV },
      plant: newPlant(),
      harvests: [],
      totalScore: 0,
      compostCredit: 0,
      running: false,
      justCompleted: null,
      lastHarvest: null,
    }),

  save: () => {
    const s = get();
    const data = snapshot(s);
    saveLocal(data);
    void saveRemote(data).then((id) => {
      if (id && id !== s.gardenId) set({ gardenId: id });
    });
  },
}));

/** Persist on every change. */
useGame.subscribe(() => saveLocal(snapshot(useGame.getState())));
