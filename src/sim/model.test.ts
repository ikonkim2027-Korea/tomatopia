import { describe, it, expect } from 'vitest';
import {
  type Environment,
  type PlantState,
  FACTORS,
  FLOWER_CAP,
  getFactors,
  limitingFactor,
  newPlant,
  step,
  trapezoid,
  pollinate,
  needsPollination,
  canHarvest,
  evaluateHarvest,
} from './model';
import { phaseOf, plantLook, fruitColorOf } from './stages';

const ideal: Environment = { light: 8, water: 65, temperature: 24, nutrients: 55 };

function simulateFrom(start: PlantState, env: Environment, days: number) {
  let p = start;
  const dt = 0.25;
  for (let t = 0; t < days; t += dt) p = step(env, p, dt);
  return p;
}
const simulate = (env: Environment, days: number) => simulateFrom(newPlant(), env, days);
const sprouted = () => simulateFrom(newPlant(), ideal, 8);

describe('trapezoid response curve', () => {
  it('is 1 inside the optimal band and 0 outside survivable range', () => {
    expect(trapezoid(24, FACTORS.temperature)).toBe(1);
    expect(trapezoid(0, FACTORS.temperature)).toBe(0);
    expect(trapezoid(45, FACTORS.temperature)).toBe(0);
  });
  it('ramps linearly on both sides (dose-response)', () => {
    expect(trapezoid(10, FACTORS.temperature)).toBeCloseTo(0.5, 5);
    expect(trapezoid(35, FACTORS.temperature)).toBeCloseTo(0.5, 5);
  });
});

describe('getFactors & limiting factor', () => {
  it('all factors are 1 at ideal', () => {
    const f = getFactors(ideal);
    expect(f.light).toBe(1); expect(f.water).toBe(1); expect(f.temperature).toBe(1); expect(f.nutrients).toBe(1);
  });
  it('identifies the scarcest resource (Liebig)', () => {
    expect(limitingFactor({ ...ideal, water: 10 }).key).toBe('water');
  });
});

describe('dormant seed', () => {
  it('a dry, dark seed waits without dying', () => {
    const p = simulate({ ...ideal, water: 0, light: 0 }, 30);
    expect(p.alive).toBe(true);
    expect(p.health).toBe(100);
    expect(p.growth).toBeLessThan(4);
  });
});

describe('growth & pollination gate', () => {
  it('growth stops at the flowering cap until pollinated', () => {
    const p = simulate(ideal, 60);
    expect(p.growth).toBeCloseTo(FLOWER_CAP, 1);
    expect(p.pollinated).toBe(false);
    expect(needsPollination(p)).toBe(true);
    expect(phaseOf(p)).toBe('flowering');
  });
  it('after pollination it grows to full-size fruit', () => {
    let p = simulate(ideal, 30); // reach flowering cap
    p = pollinate(p);
    p = simulateFrom(p, ideal, 20);
    expect(p.growth).toBe(100);
    expect(p.pollinated).toBe(true);
  });
  it('is limited by the worst factor, not the average', () => {
    const p = simulate({ ...ideal, light: 0 }, 10);
    expect(p.growth).toBeLessThan(5);
  });
});

describe('ripening & rotting', () => {
  function ripeReady() {
    let p = simulate(ideal, 30);
    p = pollinate(p);
    return simulateFrom(p, ideal, 16); // full grown + just fully ripe (not yet rotting)
  }
  it('fruit ripens to 100 then can be harvested', () => {
    const p = ripeReady();
    expect(p.ripeness).toBe(100);
    expect(canHarvest(p)).toBe(true);
    expect(fruitColorOf(p)).toBe('red');
  });
  it('rots if left far too long after ripe', () => {
    let p = ripeReady();
    p = simulateFrom(p, ideal, 12); // wait past ROT_DAYS
    expect(p.rotted).toBe(true);
    expect(phaseOf(p)).toBe('rotten');
  });
});

describe('health & death (once sprouted)', () => {
  it('drought kills a sprouted plant', () => {
    expect(simulateFrom(sprouted(), { ...ideal, water: 0 }, 25).alive).toBe(false);
  });
  it('freezing kills a sprouted plant', () => {
    expect(simulateFrom(sprouted(), { ...ideal, temperature: 0 }, 25).alive).toBe(false);
  });
  it('extreme heat kills a sprouted plant', () => {
    expect(simulateFrom(sprouted(), { ...ideal, temperature: 45 }, 25).alive).toBe(false);
  });
  it('waterlogging harms (both tails of dose-response)', () => {
    expect(simulateFrom(sprouted(), { ...ideal, water: 100 }, 25).alive).toBe(false);
  });
});

describe('harvest evaluation & scoring', () => {
  const base: PlantState = { growth: 100, health: 100, alive: true, ageDays: 40, pollinated: true, ripeness: 100, overripeDays: 0, rotted: false };
  it('perfect ripe plant scores high (1 kg = 10 pts)', () => {
    const r = evaluateHarvest(base);
    expect(r.grade).toBe('perfect');
    expect(r.weightG).toBeGreaterThan(1100);
    expect(r.score).toBe(Math.round(r.weightG / 100));
  });
  it('underripe fruit is lighter and lower grade', () => {
    const r = evaluateHarvest({ ...base, ripeness: 50 });
    expect(r.grade).toBe('underripe');
    expect(r.weightG).toBeLessThan(evaluateHarvest(base).weightG);
  });
  it('rotten fruit is composted with zero score', () => {
    const r = evaluateHarvest({ ...base, rotted: true });
    expect(r.grade).toBe('compost');
    expect(r.composted).toBe(true);
    expect(r.score).toBe(0);
  });
});

describe('plantLook', () => {
  it('healthy at ideal, wilting when dry, yellowing when starved', () => {
    expect(plantLook(ideal, sprouted()).mood).toBe('healthy');
    expect(plantLook({ ...ideal, water: 5 }, sprouted()).mood).toBe('wilting');
    expect(plantLook({ ...ideal, nutrients: 2 }, sprouted()).mood).toBe('yellowing');
  });
  it('reports dead once the plant dies', () => {
    const dead = { ...newPlant(), health: 0, alive: false };
    expect(plantLook(ideal, dead).mood).toBe('dead');
  });
});
