/**
 * Missions are milestones along ONE continuous plant's life cycle. They unlock
 * in order and auto-advance when reached — the plant is never reset between them.
 * The Scientist's Note states the accurate science in kid-friendly language.
 */
import type { Environment, PlantState } from '../sim/model';

export const IDEAL_ENV: Environment = { light: 8, water: 65, temperature: 24, nutrients: 55 };
/** The plant starts in gentle-but-imperfect conditions so the gardener must help it. */
export const START_ENV: Environment = { light: 3, water: 35, temperature: 16, nutrients: 25 };

export interface MissionContext {
  plant: PlantState;
  harvestCount: number;
}

export interface Mission {
  id: string;
  title: string;
  goal: string;
  hint: string;
  scientistNote: string;
  success: (c: MissionContext) => boolean;
  successText: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'germinate',
    title: '1 · Germination',
    goal: 'Wake the sleeping seed so it sprouts.',
    hint: 'A seed needs water to wake up and warmth to start. Raise the water and temperature.',
    scientistNote:
      'Germination is when a seed wakes from rest. Water makes the seed swell and the tiny root and shoot push out. Warmth tells the seed it is a good time to grow. Light matters most just after the shoot appears.',
    success: (c) => c.plant.growth >= 4,
    successText: 'Your seed germinated! 🌱 Water and warmth woke it up.',
  },
  {
    id: 'early-growth',
    title: '2 · Early Growth',
    goal: 'Grow the seedling\'s first true leaves.',
    hint: 'Now the little plant needs sunlight to make food. Give it plenty of light and keep the soil moist.',
    scientistNote:
      'A new seedling first opens two seed-leaves (cotyledons), then grows its first true leaves. From now on it makes its own food from sunlight, so light becomes very important.',
    success: (c) => c.plant.growth >= 16,
    successText: 'Strong little seedling! 🌿 Its leaves are catching sunlight to make food.',
  },
  {
    id: 'vegetative',
    title: '3 · Vegetative Growth',
    goal: 'Grow a big, leafy, healthy plant.',
    hint: 'Leaves are powered by light and built from nutrients. Keep all four conditions in their green "ideal" zones.',
    scientistNote:
      'In the vegetative stage the plant builds lots of stems and leaves. Nutrients (especially nitrogen) help it grow green and strong. Remember Liebig\'s Law: the plant grows only as well as its WEAKEST condition.',
    success: (c) => c.plant.growth >= 32,
    successText: 'A lush, leafy tomato plant! 🌳 Great balancing of all its needs.',
  },
  {
    id: 'flowering',
    title: '4 · Flowering',
    goal: 'Help the plant make flowers.',
    hint: 'A healthy, mature plant will start to flower. Keep conditions good and let it grow.',
    scientistNote:
      'When a tomato plant is big and healthy, it makes yellow flowers. Each flower can become a tomato — but only if it is pollinated first!',
    success: (c) => c.plant.growth >= 52,
    successText: 'Beautiful yellow flowers! 🌼 Each one could become a tomato.',
  },
  {
    id: 'pollination',
    title: '5 · Pollination',
    goal: 'Pollinate the flowers so they can become fruit.',
    hint: 'Press the 🐝 Pollinate button to shake the flowers (like wind or a bee would).',
    scientistNote:
      'Tomato flowers carry both pollen and the part that becomes fruit. They need a shake — from wind or a buzzing bee — to move the pollen so fruit can form. Without pollination, the flowers fall off and no tomatoes grow.',
    success: (c) => c.plant.pollinated,
    successText: 'Pollinated! 🐝 Now the flowers can turn into tiny green tomatoes.',
  },
  {
    id: 'ripening',
    title: '6 · Fruit & Ripening',
    goal: 'Grow the fruit and let it ripen from green to red.',
    hint: 'Green tomatoes grow first, then slowly ripen. Keep conditions good — ripening takes time and patience.',
    scientistNote:
      'A tomato grows green and full-size first, then ripens: green → orange → red. Ripening makes it sweet. A red tomato is ready to pick. Picked too early it is hard and sour; left too long it gets soft and rots.',
    success: (c) => c.plant.ripeness >= 80,
    successText: 'Red and ripe! 🍅 Your tomato is ready to harvest at its best.',
  },
  {
    id: 'harvest',
    title: '7 · Harvest!',
    goal: 'Harvest your tomato at peak ripeness for the best score.',
    hint: 'Press 🧺 Harvest when the fruit is ripe and red. Wait too long and it will rot into compost!',
    scientistNote:
      'Harvesting at the right time gives the heaviest, tastiest fruit — and the most points. A rotten tomato is not wasted, though: it becomes compost that feeds the next plant. That is a circular, zero-waste garden! ♻️',
    success: (c) => c.harvestCount >= 1,
    successText: 'Harvested! 🧺🎉 You grew a tomato from seed to harvest. Try for an even better score!',
  },
];

export function missionIndex(id: string): number {
  return MISSIONS.findIndex((m) => m.id === id);
}

export function missionById(id: string): Mission {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}
