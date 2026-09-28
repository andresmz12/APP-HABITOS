import { WeeklyTask } from '../types/models';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `API error: ${res.status}`);
  return body;
}

export function subscribeToMonthTasks(
  monthKey: string,
  callback: (tasks: WeeklyTask[]) => void
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const { tasks } = await apiFetch(`/api/weekly-tasks?month=${monthKey}`);
      if (active) callback(tasks ?? []);
    } catch {
      if (active) callback([]);
    }
  }

  poll();
  const timer = setInterval(poll, 5000);
  return () => { active = false; clearInterval(timer); };
}

export async function createWeeklyTask(
  dateKey: string,
  text: string,
  time?: string,
  repeatWeeks?: number,
  endTime?: string
): Promise<string> {
  const { task } = await apiFetch('/api/weekly-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateKey, text, time: time || null, endTime: endTime || null, repeatWeeks }),
  });
  return task.id;
}

export async function setWeeklyTaskDone(taskId: string, done: boolean): Promise<void> {
  await apiFetch(`/api/weekly-tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
}

export async function deleteWeeklyTask(taskId: string): Promise<void> {
  await apiFetch(`/api/weekly-tasks/${taskId}`, { method: 'DELETE' });
}
