/**
 * Guided missions. Each isolates one or more variables so students run a fair
 * test (controlling the other variables) and discover the science themselves.
 * The Scientist's Note states the accurate science in kid-friendly language.
 */
import type { Environment, FactorKey, PlantState } from '../sim/model';
import { getFactors } from '../sim/model';
import type { PlantLook } from '../sim/stages';
import { stageFromGrowth } from '../sim/stages';

export const IDEAL_ENV: Environment = { light: 8, water: 65, temperature: 24, nutrients: 55 };

export interface MissionContext {
  env: Environment;
  plant: PlantState;
  look: PlantLook;
}

export interface Mission {
  id: string;
  title: string;
  /** kid-facing goal */
  goal: string;
  hint: string;
  scientistNote: string;
  /** sliders the student controls; the rest are auto-set to ideal (controlled variables) */
  controls: FactorKey[];
  /** environment the mission starts from */
  initialEnv: Environment;
  /** completion check */
  success: (c: MissionContext) => boolean;
  successText: string;
}

const inBand = (env: Environment, key: FactorKey) => getFactors(env)[key] >= 0.99;

export const MISSIONS: Mission[] = [
  {
    id: 'wake-seed',
    title: '1 · Wake Up the Seed',
    goal: 'Give the seed what it needs to sprout: some sunlight and some water.',
    hint: 'A seed needs water to wake up and light to grow toward. Try moving both sliders up a little.',
    scientistNote:
      'Seeds are alive but resting. Water softens the seed and starts germination, and once the tiny shoot appears it needs light to make food. Without water or light, a seed cannot grow.',
    controls: ['light', 'water'],
    initialEnv: { ...IDEAL_ENV, light: 0, water: 0 },
    success: (c) => stageFromGrowth(c.plant.growth) !== 'seed' && c.plant.alive,
    successText: 'It sprouted! 🌱 Water woke the seed and light gave it energy to grow.',
  },
  {
    id: 'just-right-temp',
    title: '2 · Just-Right Temperature',
    goal: 'Find the temperature where your tomato grows the fastest.',
    hint: 'Tomatoes love warm — but not cold and not too hot. Watch the growth speed as you change the temperature.',
    scientistNote:
      'Tomatoes grow best around 21–27°C (about 70–80°F). When it gets near freezing the plant stops growing and can die. When it gets too hot (above ~35°C) the flowers drop and fruit will not form. This is a "dose-response": too little AND too much are both bad.',
    controls: ['temperature'],
    initialEnv: { ...IDEAL_ENV, temperature: 6 },
    success: (c) => c.plant.growth >= 30 && c.plant.alive && inBand(c.env, 'temperature'),
    successText: 'Perfect warmth! 🌡️ Around 24°C is the sweet spot for a happy tomato.',
  },
  {
    id: 'goldilocks-water',
    title: '3 · The Goldilocks Watering',
    goal: 'Water your plant just right — not too little, not too much.',
    hint: 'Too little water makes the plant wilt. Too much water drowns the roots. Find the middle.',
    scientistNote:
      'Roots need both water AND air. With too little water the plant wilts and dries out. With too much water the soil has no air and the roots rot and drown. Plants like steady, moderate moisture — around 50–75% is ideal.',
    controls: ['water'],
    initialEnv: { ...IDEAL_ENV, water: 100 },
    success: (c) => c.plant.growth >= 30 && c.plant.alive && inBand(c.env, 'water'),
    successText: 'Just right! 💧 Moist soil — with air for the roots too — keeps a tomato healthy.',
  },
  {
    id: 'feed-me',
    title: '4 · Feed Me!',
    goal: 'Your plant\'s leaves are turning yellow. Give it the nutrients it needs — but don\'t overfeed!',
    hint: 'Yellow leaves often mean "hungry." Add nutrients until the leaves turn green again. Adding way too much hurts the plant as well.',
    scientistNote:
      'Plants pull nutrients (like nitrogen) from the soil to build green leaves. Too few nutrients and leaves turn yellow (chlorosis) and growth slows. Too much fertilizer "burns" the roots and the plant grows only leaves and few tomatoes. Balance is best.',
    controls: ['nutrients'],
    initialEnv: { ...IDEAL_ENV, nutrients: 4 },
    success: (c) => c.plant.growth >= 45 && c.plant.alive && c.look.mood === 'healthy' && inBand(c.env, 'nutrients'),
    successText: 'Green and growing! 🌿 The right amount of nutrients turned the leaves healthy again.',
  },
  {
    id: 'grow-ripe',
    title: '5 · Grow a Ripe Tomato',
    goal: 'Balance light, water, temperature, AND nutrients to grow one ripe red tomato. 🍅',
    hint: 'A plant grows only as well as its WORST condition. Check every slider — fix the one that is lagging behind.',
    scientistNote:
      'This is the Law of the Minimum: a plant can only grow as fast as its scarcest need allows. You can have perfect light, water, and warmth, but if nutrients are missing, growth still stalls. Great gardeners keep ALL four conditions good at once.',
    controls: ['light', 'water', 'temperature', 'nutrients'],
    initialEnv: { light: 3, water: 30, temperature: 14, nutrients: 20 },
    success: (c) => c.plant.growth >= 92 && c.plant.alive,
    successText: 'You grew a ripe tomato! 🍅🎉 You balanced every condition at once — true gardener science!',
  },
];

export const SANDBOX: Mission = {
  id: 'sandbox',
  title: 'Free Greenhouse',
  goal: 'Experiment freely! Change anything and see what your tomato does.',
  hint: 'Try extremes and combinations. Can you grow the healthiest, fastest tomato?',
  scientistNote:
    'In a free experiment, scientists change one thing at a time to see what each change does. Try it: change only the water and keep everything else the same.',
  controls: ['light', 'water', 'temperature', 'nutrients'],
  initialEnv: { ...IDEAL_ENV },
  success: () => false,
  successText: '',
};

export function missionById(id: string): Mission {
  return MISSIONS.find((m) => m.id === id) ?? SANDBOX;
}
