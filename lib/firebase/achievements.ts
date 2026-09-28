import { Badge } from '../types/models';

async function apiFetch(path: string) {
  const res = await fetch(path);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToAchievements(callback: (badges: Badge[]) => void): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { badges } = await apiFetch('/api/achievements');
      if (active) callback(badges ?? []);
    } catch {
      if (active) callback([]);
    }
  }

  poll();
  const timer = setInterval(poll, 15000);
  return () => { active = false; clearInterval(timer); };
}
