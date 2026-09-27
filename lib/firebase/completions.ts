import { Habit, HabitCompletion } from '../types/models';
import { getCurrentDayKey } from '../utils/dates';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToTodayCompletions(
  callback: (completions: HabitCompletion[]) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const dateKey = getCurrentDayKey();
      const { completions } = await apiFetch(`/api/completions?dateKey=${dateKey}`);
      if (active) callback(completions ?? []);
    } catch {
      if (active) callback([]);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function toggleCompletion(
  habit: Habit,
  existingCompletion: HabitCompletion | null,
  photoUrl?: string
): Promise<void> {
  if (existingCompletion) {
    await apiFetch(`/api/completions/${existingCompletion.id}`, { method: 'DELETE' });
  } else {
    await apiFetch('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId: habit.id, photoUrl }),
    });
  }
}
