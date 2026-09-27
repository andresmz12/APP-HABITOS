import { Habit, PartnerId } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToHabits(
  partnerId: PartnerId,
  callback: (habits: Habit[], weeklyLimitReached: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { habits, weeklyLimitReached } = await apiFetch(`/api/habits?partnerId=${partnerId}`);
      if (active) callback(habits ?? [], !!weeklyLimitReached);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function createHabit(
  partnerId: PartnerId,
  data: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'isArchived' | 'partnerId'>
): Promise<string> {
  const { habit } = await apiFetch('/api/habits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partnerId, ...data }),
  });
  return habit.id;
}

export async function updateHabit(
  habitId: string,
  data: Partial<Pick<Habit, 'name' | 'icon' | 'frequencyType' | 'frequencyDays' | 'reminderEnabled' | 'reminderTime'>>
): Promise<void> {
  await apiFetch(`/api/habits/${habitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteHabit(habitId: string): Promise<void> {
  await apiFetch(`/api/habits/${habitId}`, { method: 'DELETE' });
}

export async function duplicateHabit(habitId: string): Promise<string> {
  const { habit } = await apiFetch(`/api/habits/${habitId}/duplicate`, { method: 'POST' });
  return habit.id;
}
