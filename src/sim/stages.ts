/**
 * Maps simulation numbers to what the UI draws: the life-cycle phase, the fruit's
 * colour as it ripens, and the plant's "mood" (wilting, yellowing, cold, ...).
 */
import {
  type Environment,
  type FactorKey,
  type PlantState,
  FACTORS,
  FLOWER_CAP,
  FRUIT_VISIBLE,
  ROT_DAYS,
  getFactors,
  STRESS_THRESHOLD,
} from './model';

export type Phase =
  | 'seed'
  | 'germination'
  | 'early'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'ripening'
  | 'ripe'
  | 'overripe'
  | 'rotten'
  | 'dead';

export const PHASE_ORDER: Phase[] = [
  'seed',
  'germination',
  'early',
  'vegetative',
  'flowering',
  'fruiting',
  'ripening',
  'ripe',
];

export const PHASE_LABEL: Record<Phase, string> = {
  seed: 'Seed',
  germination: 'Germinating',
  early: 'Seedling',
  vegetative: 'Leafy plant',
  flowering: 'Flowering',
  fruiting: 'Green fruit',
  ripening: 'Ripening',
  ripe: 'Ripe 🍅',
  overripe: 'Overripe',
  rotten: 'Rotten',
  dead: 'Wilted away',
};

export function phaseOf(plant: PlantState): Phase {
  if (!plant.alive) return 'dead';
  if (plant.rotted) return 'rotten';
  const g = plant.growth;
  if (g < 4) return 'seed';
  if (g < 16) return 'germination';
  if (g < 32) return 'early';
  if (g < FLOWER_CAP - 18) return 'vegetative'; // < 52
  if (!plant.pollinated) return g >= FLOWER_CAP - 18 ? 'flowering' : 'vegetative';
  // pollinated:
  if (g < 100) return 'fruiting';
  if (plant.ripeness < 80) return 'ripening';
  if (plant.overripeDays > ROT_DAYS * 0.55) return 'overripe';
  return 'ripe';
}

export type FruitColor = 'none' | 'green' | 'orange' | 'red' | 'deepred' | 'rotten';

export function fruitColorOf(plant: PlantState): FruitColor {
  if (plant.rotted) return 'rotten';
  if (!plant.pollinated || plant.growth < FRUIT_VISIBLE) return 'none';
  const r = plant.ripeness;
  if (plant.overripeDays > ROT_DAYS * 0.55) return 'deepred';
  if (r < 35) return 'green';
  if (r < 70) return 'orange';
  if (r < 95) return 'red';
  return 'red';
}

export type Mood =
  | 'healthy'
  | 'wilting'
  | 'yellowing'
  | 'cold'
  | 'scorched'
  | 'leggy'
  | 'drowning'
  | 'dead';

export interface PlantLook {
  phase: Phase;
  mood: Mood;
  factors: Record<FactorKey, number>;
  problem: FactorKey | null;
  ripeness: number;
  fruitColor: FruitColor;
  hasFlowers: boolean;
  hasFruit: boolean;
}

export function plantLook(env: Environment, plant: PlantState): PlantLook {
  const factors = getFactors(env);
  const phase = phaseOf(plant);
  const fruitColor = fruitColorOf(plant);
  const hasFruit = fruitColor !== 'none' && fruitColor !== 'rotten' ? true : plant.rotted;
  const hasFlowers = phase === 'flowering';

  if (!plant.alive) {
    return { phase, mood: 'dead', factors, problem: null, ripeness: plant.ripeness, fruitColor, hasFlowers: false, hasFruit };
  }

  let problem: FactorKey | null = null;
  let worst = STRESS_THRESHOLD;
  for (const k of Object.keys(factors) as FactorKey[]) {
    if (factors[k] < worst) {
      worst = factors[k];
      problem = k;
    }
  }

  let mood: Mood = 'healthy';
  if (problem === 'water') mood = env.water > FACTORS.water.highOpt ? 'drowning' : 'wilting';
  else if (problem === 'nutrients') mood = 'yellowing';
  else if (problem === 'temperature') mood = env.temperature < FACTORS.temperature.lowOpt ? 'cold' : 'scorched';
  else if (problem === 'light') mood = 'leggy';

  return { phase, mood, factors, problem, ripeness: plant.ripeness, fruitColor, hasFlowers, hasFruit };
}
