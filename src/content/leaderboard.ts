/**
 * Local leaderboard. Scores live in this browser (no account, no tracking). A
 * few friendly demo gardeners are seeded so there's someone to race. If a backend
 * is configured later, a global board can replace the seeds.
 */
import type { HarvestGrade } from '../sim/model';
import type { HarvestRecord } from '../state/persistence';

export interface ScoreEntry {
  nickname: string;
  score: number;
  weightG: number;
  grade: HarvestGrade;
  you?: boolean;
}

export const SEED_SCORES: ScoreEntry[] = [
  { nickname: 'GreenThumbGo', score: 14, weightG: 1380, grade: 'perfect' },
  { nickname: 'TomatoTitan', score: 13, weightG: 1290, grade: 'perfect' },
  { nickname: 'SunnySprout', score: 11, weightG: 1120, grade: 'good' },
  { nickname: 'BeeBuddy', score: 10, weightG: 1010, grade: 'good' },
  { nickname: 'RootRanger', score: 8, weightG: 840, grade: 'good' },
  { nickname: 'LeafyLuna', score: 6, weightG: 640, grade: 'underripe' },
];

/** Merge the player's harvests with the seed scores and sort high → low. */
export function buildLeaderboard(nickname: string, harvests: HarvestRecord[]): ScoreEntry[] {
  const mine: ScoreEntry[] = harvests
    .filter((h) => h.score > 0)
    .map((h) => ({ nickname: nickname || 'You', score: h.score, weightG: h.weightG, grade: h.grade, you: true }));
  return [...SEED_SCORES, ...mine].sort((a, b) => b.score - a.score).slice(0, 12);
}
