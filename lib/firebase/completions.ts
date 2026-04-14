import { Habit, HabitCompletion, PartnerId } from '../types/models';
import { getDayKey } from '../utils/dates';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function subscribeToTodayCompletions(
  partnerId: PartnerId,
  callback: (completions: HabitCompletion[]) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const dateKey = getDayKey(new Date());
      const { completions } = await apiFetch(
        `/api/completions?partnerId=${partnerId}&dateKey=${dateKey}`
      );
      if (active) callback(completions ?? []);
    } catch {
      if (active) callback([]);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export function subscribeToWeekCompletions(
  partnerId: PartnerId,
  weekKey: string,
  callback: (completions: HabitCompletion[]) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { completions } = await apiFetch(
        `/api/completions?partnerId=${partnerId}&weekKey=${weekKey}`
      );
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
      body: JSON.stringify({ habitId: habit.id, partnerId: habit.partnerId, photoUrl }),
    });
  }
}
