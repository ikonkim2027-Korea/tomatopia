/**
 * Save/load adapter. Defaults to localStorage so the app works fully offline and
 * with no personal data. If `VITE_API_URL` is set, the backend is used instead
 * (keyed by an opaque garden id / class code — still no child PII).
 */
import type { Environment, PlantState } from '../sim/model';

export interface SaveData {
  nickname: string;
  completedMissions: string[];
  mode: 'mission' | 'sandbox';
  missionId: string;
  env: Environment;
  plant: PlantState;
  gardenId?: string | null;
}

const KEY = 'tomatopia-save-v1';
const API = import.meta.env.VITE_API_URL as string | undefined;

export function loadLocal(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

export function saveLocal(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked — non-fatal */
  }
}

/** Optional backend save (no-op when no API configured). */
export async function saveRemote(data: SaveData): Promise<string | null> {
  if (!API) return null;
  try {
    const id = data.gardenId;
    const res = await fetch(`${API}/gardens${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nickname: data.nickname, state: data }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { id: string };
    return json.id;
  } catch {
    return null;
  }
}

export const hasBackend = Boolean(API);
