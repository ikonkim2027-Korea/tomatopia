import { create } from 'zustand';
import {
  type Environment,
  type FactorKey,
  type PlantState,
  newPlant,
  step,
} from '../sim/model';
import { plantLook, type PlantLook } from '../sim/stages';
import { MISSIONS, SANDBOX, missionById, IDEAL_ENV } from '../content/missions';
import { loadLocal, saveLocal, saveRemote, type SaveData } from './persistence';

/** Real ms per tick (4 ticks/sec). */
export const TICK_MS = 250;
/** Simulated days advanced per real second at 1x speed. */
const DAYS_PER_SEC = 0.5;

interface GameState {
  nickname: string;
  mode: 'mission' | 'sandbox';
  missionId: string;
  env: Environment;
  plant: PlantState;
  running: boolean;
  speed: number; // 1 or 3
  completedMissions: string[];
  justCompleted: string | null;
  gardenId: string | null;

  // selectors
  look: () => PlantLook;
  currentMission: () => (typeof MISSIONS)[number];
  isLocked: (key: FactorKey) => boolean;

  // actions
  setControl: (key: FactorKey, value: number) => void;
  tick: () => void;
  togglePlay: () => void;
  setSpeed: (s: number) => void;
  selectMission: (id: string) => void;
  startSandbox: () => void;
  replant: () => void;
  dismissCompleted: () => void;
  setNickname: (n: string) => void;
  save: () => void;
}

function snapshot(s: GameState): SaveData {
  return {
    nickname: s.nickname,
    completedMissions: s.completedMissions,
    mode: s.mode,
    missionId: s.missionId,
    env: s.env,
    plant: s.plant,
    gardenId: s.gardenId,
  };
}

const saved = loadLocal();

export const useGame = create<GameState>((set, get) => ({
  nickname: saved?.nickname ?? '',
  mode: saved?.mode ?? 'mission',
  missionId: saved?.missionId ?? MISSIONS[0].id,
  env: saved?.env ?? { ...MISSIONS[0].initialEnv },
  plant: saved?.plant ?? newPlant(),
  running: false,
  speed: 1,
  completedMissions: saved?.completedMissions ?? [],
  justCompleted: null,
  gardenId: saved?.gardenId ?? null,

  look: () => plantLook(get().env, get().plant),
  currentMission: () => missionById(get().missionId),
  isLocked: (key) => {
    const s = get();
    if (s.mode === 'sandbox') return false;
    return !s.currentMission().controls.includes(key);
  },

  setControl: (key, value) => {
    if (get().isLocked(key)) return;
    set((s) => ({ env: { ...s.env, [key]: value } }));
  },

  tick: () => {
    const s = get();
    if (!s.running || !s.plant.alive) return;
    const dt = (TICK_MS / 1000) * DAYS_PER_SEC * s.speed;
    const plant = step(s.env, s.plant, dt);
    const look = plantLook(s.env, plant);

    let justCompleted = s.justCompleted;
    let completedMissions = s.completedMissions;
    let running = true;

    if (s.mode === 'mission') {
      const m = s.currentMission();
      if (
        m.id !== 'sandbox' &&
        !s.completedMissions.includes(m.id) &&
        m.success({ env: s.env, plant, look })
      ) {
        justCompleted = m.id;
        completedMissions = [...s.completedMissions, m.id];
        running = false; // pause to celebrate
      }
    }
    set({ plant, justCompleted, completedMissions, running });
  },

  togglePlay: () => set((s) => ({ running: !s.running })),
  setSpeed: (speed) => set({ speed }),

  selectMission: (id) => {
    const m = missionById(id);
    set({
      mode: id === 'sandbox' ? 'sandbox' : 'mission',
      missionId: id,
      env: { ...m.initialEnv },
      plant: newPlant(),
      running: true,
      justCompleted: null,
    });
  },

  startSandbox: () =>
    set({
      mode: 'sandbox',
      missionId: SANDBOX.id,
      env: { ...IDEAL_ENV },
      plant: newPlant(),
      running: true,
      justCompleted: null,
    }),

  replant: () => set({ plant: newPlant(), running: true, justCompleted: null }),
  dismissCompleted: () => set({ justCompleted: null }),
  setNickname: (nickname) => set({ nickname }),

  save: () => {
    const s = get();
    const data = snapshot(s);
    saveLocal(data);
    void saveRemote(data).then((id) => {
      if (id && id !== s.gardenId) set({ gardenId: id });
    });
  },
}));

/** Persist on meaningful changes (debounced by the browser's event loop). */
useGame.subscribe(() => {
  const s = useGame.getState();
  saveLocal(snapshot(s));
});
