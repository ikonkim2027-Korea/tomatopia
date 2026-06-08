/**
 * Tomatopia — tomato growth simulation (pure, deterministic, no DOM/React).
 *
 * One plant is grown through its WHOLE life cycle (it is never silently reset):
 *   seed → germination → early growth → vegetative → flowering → pollination
 *        → fruit development → ripening → ripe → overripe → rotten
 *
 * The science follows standard horticultural guidance for Solanum lycopersicum:
 *   - Light:       full-sun crop, ~6-8+ h direct sun/day ideal.
 *   - Water:       steady soil moisture; drought AND waterlogging both harm.
 *   - Temperature: ideal ~18-27 °C; stalls <10, frost <2, heat damage >35.
 *   - Nutrients:   balanced fertility; too little -> chlorosis, too much -> burn.
 *
 * Two ideas we deliberately teach:
 *   1. Liebig's Law of the Minimum — growth is limited by the scarcest resource.
 *   2. Dose-response — too little AND too much of a factor are both harmful.
 */

export interface Environment {
  /** hours of direct sun per day (0-16) */
  light: number;
  /** soil moisture, percent (0-100) */
  water: number;
  /** air temperature, degrees Celsius */
  temperature: number;
  /** soil fertility / fertilizer level, percent (0-100) */
  nutrients: number;
}

export interface PlantState {
  /** structural development 0-100 (germination → full-size fruit) */
  growth: number;
  /** vitality 0-100; reaches 0 -> plant dies */
  health: number;
  alive: boolean;
  /** elapsed simulated days */
  ageDays: number;
  /** whether the flowers have been pollinated (gate to fruit set) */
  pollinated: boolean;
  /** fruit ripeness 0-100 (green → red), only advances once fruit is full-size */
  ripeness: number;
  /** simulated days spent fully ripe (drives rotting) */
  overripeDays: number;
  /** fruit has spoiled */
  rotted: boolean;
}

export type FactorKey = 'light' | 'water' | 'temperature' | 'nutrients';

export interface FactorConfig {
  min: number;
  lowOpt: number;
  highOpt: number;
  max: number;
  uiMin: number;
  uiMax: number;
  lethalAtZero: boolean;
}

export const FACTORS: Record<FactorKey, FactorConfig> = {
  light: { min: 0, lowOpt: 6, highOpt: 12, max: 16, uiMin: 0, uiMax: 16, lethalAtZero: true },
  water: { min: 0, lowOpt: 50, highOpt: 75, max: 100, uiMin: 0, uiMax: 100, lethalAtZero: true },
  temperature: { min: 2, lowOpt: 18, highOpt: 27, max: 43, uiMin: 0, uiMax: 45, lethalAtZero: true },
  nutrients: { min: 0, lowOpt: 35, highOpt: 70, max: 100, uiMin: 0, uiMax: 100, lethalAtZero: false },
};

// --- tuning ---
export const GROWTH_PER_DAY = 4;
export const RECOVER_PER_DAY = 3;
export const LETHAL_DAMAGE_PER_DAY = 12;
export const MILD_DAMAGE_PER_DAY = 6;
export const COMFORT_THRESHOLD = 0.6;
export const STRESS_THRESHOLD = 0.5;

/** Below this growth value the plant is still a dormant seed. */
export const SEED_GROWTH = 4;
/** Growth cannot pass this point until the flowers are pollinated. */
export const FLOWER_CAP = 70;
/** Fruit becomes visible / harvestable from this growth value. */
export const FRUIT_VISIBLE = 78;
/** Ripening speed (ripeness points/day at good conditions). ~7 days to ripen. */
export const RIPEN_PER_DAY = 14;
/** Days a fully-ripe fruit can wait before it rots. */
export const ROT_DAYS = 8;
/** Max harvest weight (grams) from a perfect plant. */
export const MAX_YIELD_G = 1200;

export function trapezoid(x: number, c: FactorConfig): number {
  if (x <= c.min || x >= c.max) return 0;
  if (x < c.lowOpt) return (x - c.min) / (c.lowOpt - c.min);
  if (x > c.highOpt) return (c.max - x) / (c.max - c.highOpt);
  return 1;
}

export function getFactors(env: Environment): Record<FactorKey, number> {
  return {
    light: trapezoid(env.light, FACTORS.light),
    water: trapezoid(env.water, FACTORS.water),
    temperature: trapezoid(env.temperature, FACTORS.temperature),
    nutrients: trapezoid(env.nutrients, FACTORS.nutrients),
  };
}

export function limitingFactor(env: Environment): { key: FactorKey; value: number } {
  const f = getFactors(env);
  let key: FactorKey = 'light';
  for (const k of Object.keys(f) as FactorKey[]) if (f[k] < f[key]) key = k;
  return { key, value: f[key] };
}

export function newPlant(): PlantState {
  return {
    growth: 0,
    health: 100,
    alive: true,
    ageDays: 0,
    pollinated: false,
    ripeness: 0,
    overripeDays: 0,
    rotted: false,
  };
}

/** Whether the plant currently has flowers waiting to be pollinated. */
export function needsPollination(plant: PlantState): boolean {
  return plant.alive && !plant.pollinated && plant.growth >= FLOWER_CAP;
}

/** Whether there is fruit on the plant that can be harvested. */
export function canHarvest(plant: PlantState): boolean {
  return plant.alive && plant.pollinated && plant.growth >= FRUIT_VISIBLE;
}

/** Advance the simulation by `dtDays`. Pure: returns a new state. */
export function step(env: Environment, plant: PlantState, dtDays: number): PlantState {
  if (!plant.alive) return { ...plant };

  const f = getFactors(env);
  const factorKeys = Object.keys(f) as FactorKey[];
  const minFactor = Math.min(...factorKeys.map((k) => f[k]));

  // --- Growth (limited by the scarcest resource), capped at flowering until pollinated ---
  let growth = Math.min(100, plant.growth + GROWTH_PER_DAY * minFactor * dtDays);
  if (!plant.pollinated && growth > FLOWER_CAP) growth = FLOWER_CAP;

  // --- Ripening: only once fruit is full-size and pollinated ---
  let ripeness = plant.ripeness;
  let overripeDays = plant.overripeDays;
  let rotted = plant.rotted;
  if (plant.pollinated && growth >= 100) {
    ripeness = Math.min(100, ripeness + RIPEN_PER_DAY * Math.max(0.3, minFactor) * dtDays);
    if (ripeness >= 100) {
      overripeDays += dtDays;
      if (overripeDays >= ROT_DAYS) rotted = true;
    }
  }

  // --- Health ---
  const isSeed = plant.growth < SEED_GROWTH;
  let healthDelta: number;
  if (minFactor >= COMFORT_THRESHOLD) {
    healthDelta = RECOVER_PER_DAY * dtDays;
  } else {
    let damagePerDay = 0;
    for (const k of factorKeys) {
      const fv = f[k];
      if (fv <= 0) damagePerDay += FACTORS[k].lethalAtZero ? LETHAL_DAMAGE_PER_DAY : MILD_DAMAGE_PER_DAY;
      else if (fv < STRESS_THRESHOLD) damagePerDay += MILD_DAMAGE_PER_DAY * ((STRESS_THRESHOLD - fv) / STRESS_THRESHOLD);
    }
    healthDelta = -damagePerDay * dtDays;
  }
  if (isSeed && healthDelta < 0) healthDelta = 0; // dormant seeds don't lose health
  const health = Math.max(0, Math.min(100, plant.health + healthDelta));

  return {
    growth,
    health,
    alive: health > 0,
    ageDays: plant.ageDays + dtDays,
    pollinated: plant.pollinated,
    ripeness,
    overripeDays,
    rotted,
  };
}

/** Pollinate the flowers (player action / bee visit). No-op unless flowering. */
export function pollinate(plant: PlantState): PlantState {
  if (!needsPollination(plant)) return plant;
  return { ...plant, pollinated: true };
}

export type HarvestGrade = 'perfect' | 'good' | 'underripe' | 'compost';

export interface HarvestResult {
  weightG: number;
  score: number;
  grade: HarvestGrade;
  composted: boolean;
}

/** Evaluate a harvest: weight, quality grade, score (100 g = 1 point). */
export function evaluateHarvest(plant: PlantState): HarvestResult {
  const qualityFactor = plant.health / 100; // sustained good conditions = heavier, better fruit
  let ripenessFactor: number;
  if (plant.rotted) ripenessFactor = 0;
  else if (plant.ripeness < 80) ripenessFactor = (plant.ripeness / 80) * 0.55; // underripe penalty
  else ripenessFactor = 0.85 + ((Math.min(100, plant.ripeness) - 80) / 20) * 0.15;

  const weightG = Math.round(MAX_YIELD_G * qualityFactor * ripenessFactor);
  const composted = plant.rotted;

  let grade: HarvestGrade;
  if (plant.rotted) grade = 'compost';
  else if (plant.ripeness >= 95 && plant.health >= 80) grade = 'perfect';
  else if (plant.ripeness >= 80) grade = 'good';
  else grade = 'underripe';

  const score = composted ? 0 : Math.round(weightG / 100); // 100 g = 1 point (1 kg = 10)
  return { weightG, score, grade, composted };
}
