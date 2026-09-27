import { prisma } from './db';
import { getCurrentDayKey, getPrevDayKey } from './utils/dates';

// Current streak = consecutive days, ending today, where the user completed
// every habit that was active for them. Breaks the moment a day falls short.
export async function computeStreak(userId: string, activeHabitCount: number): Promise<number> {
  if (activeHabitCount === 0) return 0;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);

  const completions = await prisma.habitCompletion.findMany({
    where: { userId, completedAt: { gte: since } },
    select: { dateKey: true, habitId: true },
  });

  const byDay = new Map<string, Set<string>>();
  for (const c of completions) {
    const set = byDay.get(c.dateKey) ?? new Set<string>();
    set.add(c.habitId);
    byDay.set(c.dateKey, set);
  }

  let streak = 0;
  let cursor = getCurrentDayKey();
  while (true) {
    const set = byDay.get(cursor);
    if (!set || set.size < activeHabitCount) break;
    streak++;
    cursor = getPrevDayKey(cursor);
  }
  return streak;
}
