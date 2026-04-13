import { WeeklyStat } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function subscribeToWeeklyStat(
  weekKey: string,
  callback: (stat: WeeklyStat | null) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { stat } = await apiFetch(`/api/weekly-stats/${weekKey}`);
      if (active) callback(stat ?? null);
    } catch {
      if (active) callback(null);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function ensureWeeklyStat(weekKey: string): Promise<void> {
  await apiFetch(`/api/weekly-stats/${weekKey}`, { method: 'POST' });
}

export async function finalizeWeeklyStat(weekKey: string): Promise<void> {
  try {
    await apiFetch(`/api/weekly-stats/${weekKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalizedAt: new Date().toISOString() }),
    });
  } catch {
    // Silently fail if stat doesn't exist yet
  }
}

export async function getWeeklyStat(weekKey: string): Promise<WeeklyStat | null> {
  try {
    const { stat } = await apiFetch(`/api/weekly-stats/${weekKey}`);
    return stat ?? null;
  } catch {
    return null;
  }
}
