/**
 * Tomatopia — tomato growth simulation (pure, deterministic, no DOM/React).
 *
 * The science here models how four environmental factors affect a tomato plant
 * (Solanum lycopersicum). Tuning values follow standard horticultural guidance:
 *   - Light:        full-sun crop, ~6-8+ h direct sun/day ideal.
 *   - Water:        consistent soil moisture; drought AND waterlogging both harm.
 *   - Temperature:  ideal ~18-27 deg C; growth stalls <10, frost <2, heat damage >35.
 *   - Nutrients:    balanced fertility; deficiency -> chlorosis, excess -> fertilizer burn.
 *
 * Two ideas we deliberately teach:
 *   1. Liebig's Law of the Minimum — growth is limited by the scarcest resource
 *      (growthRate uses min() of the factors, not the average).
 *   2. Dose-response — for every factor, too little AND too much are both harmful
 *      (each factor is a trapezoid that falls off on both sides).
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
  /** life-cycle progress 0-100 (drives the visible stage) */
  growth: number;
  /** vitality 0-100; reaches 0 -> plant dies */
  health: number;
  /** whether the plant is still alive */
  alive: boolean;
  /** elapsed simulated days */
  ageDays: number;
}

export type FactorKey = 'light' | 'water' | 'temperature' | 'nutrients';

export interface FactorConfig {
  /** below this value (or above `max`) the factor contributes 0 */
  min: number;
  /** start of the ideal band */
  lowOpt: number;
  /** end of the ideal band */
  highOpt: number;
  /** above this value the factor contributes 0 */
  max: number;
  /** slider bounds shown in the UI */
  uiMin: number;
  uiMax: number;
  /** if true, a factor of 0 is lethal quickly (water/temp/light); nutrients is slow */
  lethalAtZero: boolean;
}

/**
 * Scientifically-grounded ranges for each factor. `min`/`max` are the edges of
 * survival; `lowOpt`/`highOpt` bound the ideal band where the factor = 1.
 */
export const FACTORS: Record<FactorKey, FactorConfig> = {
  light: { min: 0, lowOpt: 6, highOpt: 12, max: 16, uiMin: 0, uiMax: 16, lethalAtZero: true },
  water: { min: 0, lowOpt: 50, highOpt: 75, max: 100, uiMin: 0, uiMax: 100, lethalAtZero: true },
  temperature: { min: 2, lowOpt: 18, highOpt: 27, max: 43, uiMin: 0, uiMax: 45, lethalAtZero: true },
  nutrients: { min: 0, lowOpt: 35, highOpt: 70, max: 100, uiMin: 0, uiMax: 100, lethalAtZero: false },
};

/** Growth at perfect conditions, in progress-units per simulated day. ~30 days to ripe. */
export const GROWTH_PER_DAY = 3.5;
/** Health regained per day when every factor is comfortable. */
export const RECOVER_PER_DAY = 3;
/** Health lost per day for a fully-out-of-range lethal factor. */
export const LETHAL_DAMAGE_PER_DAY = 12;
/** Max health lost per day from a non-lethal factor (e.g. nutrient stress). */
export const MILD_DAMAGE_PER_DAY = 6;
/** A factor at or above this is considered "comfortable" for recovery/health. */
export const COMFORT_THRESHOLD = 0.6;
/** Below this a factor is "stressing" the plant. */
export const STRESS_THRESHOLD = 0.5;

/**
 * Trapezoidal suitability curve: 0 outside [min,max], ramps up to 1 across
 * [min,lowOpt], stays 1 across [lowOpt,highOpt], ramps down to 0 across [highOpt,max].
 */
export function trapezoid(x: number, c: FactorConfig): number {
  if (x <= c.min || x >= c.max) return 0;
  if (x < c.lowOpt) return (x - c.min) / (c.lowOpt - c.min);
  if (x > c.highOpt) return (c.max - x) / (c.max - c.highOpt);
  return 1;
}

/** Suitability factor (0-1) for each environmental variable. */
export function getFactors(env: Environment): Record<FactorKey, number> {
  return {
    light: trapezoid(env.light, FACTORS.light),
    water: trapezoid(env.water, FACTORS.water),
    temperature: trapezoid(env.temperature, FACTORS.temperature),
    nutrients: trapezoid(env.nutrients, FACTORS.nutrients),
  };
}

/** The factor currently limiting growth the most (Liebig's law). */
export function limitingFactor(env: Environment): { key: FactorKey; value: number } {
  const f = getFactors(env);
  let key: FactorKey = 'light';
  for (const k of Object.keys(f) as FactorKey[]) {
    if (f[k] < f[key]) key = k;
  }
  return { key, value: f[key] };
}

/** A fresh, unplanted seed. */
export function newPlant(): PlantState {
  return { growth: 0, health: 100, alive: true, ageDays: 0 };
}

/**
 * Advance the simulation by `dtDays` simulated days. Pure: returns a new state.
 */
/** Below this growth value the plant is still a dormant seed. */
export const SEED_GROWTH = 4;

export function step(env: Environment, plant: PlantState, dtDays: number): PlantState {
  if (!plant.alive) return { ...plant };

  const f = getFactors(env);
  const factorKeys = Object.keys(f) as FactorKey[];
  const minFactor = Math.min(...factorKeys.map((k) => f[k]));

  // --- Growth: limited by the scarcest resource ---
  const growthDelta = GROWTH_PER_DAY * minFactor * dtDays;
  const growth = Math.min(100, plant.growth + growthDelta);

  // A dormant seed waits without dying: a dry, dark seed simply doesn't
  // germinate yet, it isn't harmed. Health rules begin once it has sprouted.
  const isSeed = plant.growth < SEED_GROWTH;

  // --- Health: recover when comfortable, take damage when stressed ---
  let healthDelta: number;
  if (minFactor >= COMFORT_THRESHOLD) {
    healthDelta = RECOVER_PER_DAY * dtDays;
  } else {
    let damagePerDay = 0;
    for (const k of factorKeys) {
      const fv = f[k];
      if (fv <= 0) {
        damagePerDay += FACTORS[k].lethalAtZero ? LETHAL_DAMAGE_PER_DAY : MILD_DAMAGE_PER_DAY;
      } else if (fv < STRESS_THRESHOLD) {
        damagePerDay += MILD_DAMAGE_PER_DAY * ((STRESS_THRESHOLD - fv) / STRESS_THRESHOLD);
      }
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
  };
}
