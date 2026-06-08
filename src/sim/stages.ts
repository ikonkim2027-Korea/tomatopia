/**
 * Maps simulation numbers to the things the UI draws: the life-cycle stage and
 * the plant's visible "mood" (wilting, yellowing, cold, etc.).
 */
import {
  type Environment,
  type FactorKey,
  type PlantState,
  FACTORS,
  getFactors,
  STRESS_THRESHOLD,
} from './model';

export type Stage =
  | 'seed'
  | 'sprout'
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'ripe';

export const STAGE_ORDER: Stage[] = [
  'seed',
  'sprout',
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'ripe',
];

const STAGE_THRESHOLDS: { stage: Stage; min: number }[] = [
  { stage: 'ripe', min: 92 },
  { stage: 'fruiting', min: 76 },
  { stage: 'flowering', min: 58 },
  { stage: 'vegetative', min: 38 },
  { stage: 'seedling', min: 18 },
  { stage: 'sprout', min: 4 },
  { stage: 'seed', min: 0 },
];

export const STAGE_LABEL: Record<Stage, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  seedling: 'Seedling',
  vegetative: 'Leafy plant',
  flowering: 'Flowering',
  fruiting: 'Green fruit',
  ripe: 'Ripe tomato',
};

/** Discrete life-cycle stage from growth progress (0-100). */
export function stageFromGrowth(growth: number): Stage {
  for (const t of STAGE_THRESHOLDS) {
    if (growth >= t.min) return t.stage;
  }
  return 'seed';
}

export type Mood =
  | 'healthy'
  | 'wilting' // low water
  | 'yellowing' // low nutrients
  | 'cold' // low temperature
  | 'scorched' // high temperature / heat
  | 'leggy' // low light
  | 'drowning' // too much water
  | 'dead';

export interface PlantLook {
  stage: Stage;
  mood: Mood;
  /** 0-1 suitability per factor, for meters and markers */
  factors: Record<FactorKey, number>;
  /** which factor is hurting the plant most right now (or null if happy) */
  problem: FactorKey | null;
}

/**
 * Derive everything the art layer needs. The "mood" is chosen from the most
 * severe problem so the plant visibly reacts to the worst condition.
 */
export function plantLook(env: Environment, plant: PlantState): PlantLook {
  const factors = getFactors(env);
  const stage = stageFromGrowth(plant.growth);

  if (!plant.alive) {
    return { stage, mood: 'dead', factors, problem: null };
  }

  // Find the most-stressed factor (lowest suitability under the stress line).
  let problem: FactorKey | null = null;
  let worst = STRESS_THRESHOLD;
  for (const k of Object.keys(factors) as FactorKey[]) {
    if (factors[k] < worst) {
      worst = factors[k];
      problem = k;
    }
  }

  let mood: Mood = 'healthy';
  if (problem === 'water') {
    mood = env.water > FACTORS.water.highOpt ? 'drowning' : 'wilting';
  } else if (problem === 'nutrients') {
    mood = 'yellowing';
  } else if (problem === 'temperature') {
    mood = env.temperature < FACTORS.temperature.lowOpt ? 'cold' : 'scorched';
  } else if (problem === 'light') {
    mood = 'leggy';
  }

  return { stage, mood, factors, problem };
}
