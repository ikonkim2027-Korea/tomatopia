/** Friendly, scientifically-honest feedback shown in the plant's speech bubble. */
import type { PlantState, HarvestGrade } from '../sim/model';
import type { PlantLook, Phase } from '../sim/stages';

export type Tone = 'good' | 'warn' | 'bad';

const PHASE_CHEER: Record<Phase, { tone: Tone; text: string }> = {
  seed: { tone: 'warn', text: 'Your seed is resting. Add water and warmth to wake it up. 💧' },
  germination: { tone: 'good', text: "It's germinating! 🌱 A tiny shoot is reaching up." },
  early: { tone: 'good', text: 'Your seedling is opening its first leaves to catch the sun.' },
  vegetative: { tone: 'good', text: 'Lots of healthy green leaves — making food from light! 🌿' },
  flowering: { tone: 'good', text: 'Flowers are open! 🌼 Press 🐝 Pollinate to help them become fruit.' },
  fruiting: { tone: 'good', text: 'Little green tomatoes are growing! 🍏' },
  ripening: { tone: 'good', text: 'Patience — your tomatoes are ripening from green to red.' },
  ripe: { tone: 'good', text: 'Ripe and red! 🍅 Harvest now for the best score!' },
  overripe: { tone: 'warn', text: 'Hurry! 🍅 Your tomato is overripe — harvest before it rots!' },
  rotten: { tone: 'bad', text: 'It rotted — but rotten fruit makes great compost. Harvest it to compost! ♻️' },
  dead: { tone: 'bad', text: "Oh no — your plant didn't make it. Press Replant to try again. 🌱" },
};

export function feedback(look: PlantLook, plant: PlantState): { tone: Tone; text: string } {
  if (!plant.alive) return PHASE_CHEER.dead;
  if (look.phase === 'rotten') return PHASE_CHEER.rotten;

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
      return PHASE_CHEER[look.phase];
  }
}

export const FACTOR_LABEL: Record<string, string> = {
  light: 'sunlight',
  water: 'water',
  temperature: 'warmth',
  nutrients: 'nutrients',
};

export const GRADE_LABEL: Record<HarvestGrade, string> = {
  perfect: 'Perfect 🌟',
  good: 'Good 👍',
  underripe: 'Underripe 🍏',
  compost: 'Compost ♻️',
};

export const GRADE_MESSAGE: Record<HarvestGrade, string> = {
  perfect: 'A heavy, juicy, perfectly-ripe tomato. Top marks!',
  good: 'A nice ripe tomato. Keep conditions perfect for an even bigger one!',
  underripe: 'Picked a bit early — green tomatoes are lighter and sour. Let it ripen longer next time.',
  compost: 'It spoiled — but nothing is wasted! It becomes compost that feeds your next plant. ♻️',
};
