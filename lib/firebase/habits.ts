import { Habit, PartnerId } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function subscribeToHabits(
  partnerId: PartnerId,
  callback: (habits: Habit[]) => void,
  onError?: (err: Error) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { habits } = await apiFetch(`/api/habits?partnerId=${partnerId}`);
      if (active) callback(habits ?? []);
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
  data: Partial<Pick<Habit, 'name' | 'icon' | 'frequencyType' | 'frequencyDays'>>
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
