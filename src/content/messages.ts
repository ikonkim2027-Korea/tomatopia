/** Friendly, scientifically-honest feedback shown in the plant's speech bubble. */
import type { PlantState } from '../sim/model';
import type { PlantLook, Stage } from '../sim/stages';

export type Tone = 'good' | 'warn' | 'bad';

const STAGE_CHEER: Record<Stage, string> = {
  seed: 'Your seed is cozy in the soil. Give it light and water to wake up!',
  sprout: 'A little sprout! 🌱 Keep the conditions just right.',
  seedling: 'Your seedling is growing strong. Nice work!',
  vegetative: 'Lots of healthy green leaves — the plant is making energy from light.',
  flowering: 'Flowers! 🌼 Soon they can turn into tomatoes.',
  fruiting: 'Green tomatoes are forming. Keep it up!',
  ripe: 'Your tomato is ripe and red! 🍅 You did it!',
};

export function feedback(look: PlantLook, plant: PlantState): { tone: Tone; text: string } {
  if (!plant.alive || look.mood === 'dead') {
    return { tone: 'bad', text: "Oh no — your tomato didn't make it. Press Replant to try again. 🌱" };
  }
  const severe = plant.health < 45;
  switch (look.mood) {
    case 'wilting':
      return { tone: severe ? 'bad' : 'warn', text: 'Your tomato is thirsty and wilting — it needs more water. 💧' };
    case 'drowning':
      return { tone: severe ? 'bad' : 'warn', text: "Too much water! The roots can't breathe. Let the soil dry a little." };
    case 'yellowing':
      return { tone: severe ? 'bad' : 'warn', text: 'The leaves are turning yellow — the plant is hungry for nutrients. 🌿' };
    case 'cold':
      return { tone: severe ? 'bad' : 'warn', text: "Brrr! It's too cold for the tomato to grow. Warm it up. 🌡️" };
    case 'scorched':
      return { tone: severe ? 'bad' : 'warn', text: "It's too hot! The plant is getting scorched — cool it down. 🔥" };
    case 'leggy':
      return { tone: severe ? 'bad' : 'warn', text: 'Not enough sunlight — the plant grows thin and weak reaching for light. ☀️' };
    default:
      return { tone: 'good', text: STAGE_CHEER[look.stage] };
  }
}

export const FACTOR_LABEL: Record<string, string> = {
  light: 'sunlight',
  water: 'water',
  temperature: 'warmth',
  nutrients: 'nutrients',
};
