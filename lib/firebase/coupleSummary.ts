import { CoupleSummary } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToCoupleSummary(
  weekKey: string,
  callback: (summary: CoupleSummary | null) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const summary = await apiFetch(`/api/couple/summary?weekKey=${weekKey}`);
      if (active) callback(summary);
    } catch {
      if (active) callback(null);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}
