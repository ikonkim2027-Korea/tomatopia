import { describe, it, expect } from 'vitest';
import {
  type Environment,
  type PlantState,
  FACTORS,
  getFactors,
  limitingFactor,
  newPlant,
  step,
  trapezoid,
} from './model';
import { stageFromGrowth, plantLook } from './stages';

const ideal: Environment = { light: 8, water: 65, temperature: 24, nutrients: 55 };

/** Run the sim forward `days` simulated days at small timesteps. */
function simulate(env: Environment, days: number) {
  return simulateFrom(newPlant(), env, days);
}

function simulateFrom(start: PlantState, env: Environment, days: number) {
  let p = start;
  const dt = 0.25;
  for (let t = 0; t < days; t += dt) p = step(env, p, dt);
  return p;
}

/** A plant already grown past the dormant-seed stage under ideal conditions. */
function sprouted() {
  return simulateFrom(newPlant(), ideal, 8); // ~ seedling, alive & healthy
}

describe('trapezoid response curve', () => {
  it('is 1 inside the optimal band and 0 outside survivable range', () => {
    expect(trapezoid(24, FACTORS.temperature)).toBe(1);
    expect(trapezoid(0, FACTORS.temperature)).toBe(0); // frost
    expect(trapezoid(45, FACTORS.temperature)).toBe(0); // extreme heat
  });

  it('ramps linearly on both sides (dose-response: both tails fall off)', () => {
    // halfway between min(2) and lowOpt(18) is 10 -> 0.5
    expect(trapezoid(10, FACTORS.temperature)).toBeCloseTo(0.5, 5);
    // halfway between highOpt(27) and max(43) is 35 -> 0.5
    expect(trapezoid(35, FACTORS.temperature)).toBeCloseTo(0.5, 5);
  });
});

describe('getFactors', () => {
  it('reports all factors at 1 for ideal conditions', () => {
    const f = getFactors(ideal);
    expect(f.light).toBe(1);
    expect(f.water).toBe(1);
    expect(f.temperature).toBe(1);
    expect(f.nutrients).toBe(1);
  });
});

describe('limiting factor (Liebig)', () => {
  it('identifies the scarcest resource', () => {
    const env = { ...ideal, water: 10 }; // water is worst
    expect(limitingFactor(env).key).toBe('water');
  });
});

describe('growth', () => {
  it('reaches a ripe tomato under ideal conditions', () => {
    const p = simulate(ideal, 40);
    expect(p.alive).toBe(true);
    expect(p.growth).toBe(100);
    expect(stageFromGrowth(p.growth)).toBe('ripe');
    expect(p.health).toBeGreaterThan(90);
  });

  it('is limited by the worst factor, not the average', () => {
    // three perfect factors but no light -> essentially no growth
    const darkEnv = { ...ideal, light: 0 };
    const p = simulate(darkEnv, 10);
    expect(p.growth).toBeLessThan(5);
  });

  it('grows slower in dim light than full sun', () => {
    const dim = simulate({ ...ideal, light: 4 }, 15);
    const full = simulate(ideal, 15);
    expect(dim.growth).toBeLessThan(full.growth);
  });
});

describe('dormant seed', () => {
  it('a dry, dark seed waits without dying (germination just stalls)', () => {
    const p = simulate({ ...ideal, water: 0, light: 0 }, 30);
    expect(p.alive).toBe(true);
    expect(p.health).toBe(100);
    expect(p.growth).toBeLessThan(4); // never sprouted
  });
});

describe('health and death (extremes are lethal once sprouted)', () => {
  it('kills a sprouted plant with no water (drought)', () => {
    const p = simulateFrom(sprouted(), { ...ideal, water: 0 }, 25);
    expect(p.alive).toBe(false);
    expect(p.health).toBe(0);
  });

  it('kills a sprouted plant with freezing temperature', () => {
    const p = simulateFrom(sprouted(), { ...ideal, temperature: 0 }, 25);
    expect(p.alive).toBe(false);
  });

  it('kills a sprouted plant with extreme heat', () => {
    const p = simulateFrom(sprouted(), { ...ideal, temperature: 45 }, 25);
    expect(p.alive).toBe(false);
  });

  it('is harmed by waterlogging (too much water)', () => {
    const p = simulateFrom(sprouted(), { ...ideal, water: 100 }, 25);
    expect(p.alive).toBe(false); // both tails of the dose-response are harmful
  });

  it('stays alive and healthy under ideal conditions', () => {
    const p = simulate(ideal, 30);
    expect(p.alive).toBe(true);
    expect(p.health).toBeGreaterThan(90);
  });

  it('nutrient deficiency harms more slowly than drought', () => {
    const noNutrients = simulateFrom(sprouted(), { ...ideal, nutrients: 0 }, 8);
    const noWater = simulateFrom(sprouted(), { ...ideal, water: 0 }, 8);
    expect(noNutrients.health).toBeGreaterThan(noWater.health);
  });
});

describe('plantLook mood', () => {
  it('is healthy when conditions are ideal', () => {
    const p = newPlant();
    expect(plantLook(ideal, p).mood).toBe('healthy');
  });

  it('wilts when water is low', () => {
    expect(plantLook({ ...ideal, water: 5 }, newPlant()).mood).toBe('wilting');
  });

  it('drowns when water is far too high', () => {
    expect(plantLook({ ...ideal, water: 98 }, newPlant()).mood).toBe('drowning');
  });

  it('yellows when nutrients are low', () => {
    expect(plantLook({ ...ideal, nutrients: 2 }, newPlant()).mood).toBe('yellowing');
  });

  it('is cold when temperature is low and scorched when high', () => {
    expect(plantLook({ ...ideal, temperature: 4 }, newPlant()).mood).toBe('cold');
    expect(plantLook({ ...ideal, temperature: 41 }, newPlant()).mood).toBe('scorched');
  });

  it('is leggy when light is low', () => {
    expect(plantLook({ ...ideal, light: 1 }, newPlant()).mood).toBe('leggy');
  });

  it('reports dead once the plant dies', () => {
    const dead = { ...newPlant(), health: 0, alive: false };
    expect(plantLook(ideal, dead).mood).toBe('dead');
  });
});
