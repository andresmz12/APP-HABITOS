import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getWeekStart, getCurrentWeekKey } from '@/lib/utils/dates';
import { computeStreak } from '@/lib/streak';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ habits: [] }, { status: 401 });

  try {
    const weekKey = getCurrentWeekKey();
    const [habits, weeklyLimitReached, stat] = await Promise.all([
      prisma.habit.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { sortOrder: 'asc' },
      }),
      hasReachedWeeklyLimit(user.id),
      prisma.weeklyStat.findUnique({ where: { userId_weekKey: { userId: user.id, weekKey } } }),
    ]);
    const streak = await computeStreak(user.id, habits.length);
    return NextResponse.json({ habits, weeklyLimitReached, streak, weeklyPoints: stat?.totalPoints ?? 0 });
  } catch {
    return NextResponse.json({ habits: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { name, icon, frequencyType, frequencyDays, reminderEnabled, reminderTime } = await req.json();

    if (await hasReachedWeeklyLimit(user.id)) {
      return NextResponse.json(
        { error: 'Ya agregaste o duplicaste un hábito esta semana. Podrás hacerlo de nuevo la próxima semana.' },
        { status: 429 }
      );
    }

    const count = await prisma.habit.count({ where: { userId: user.id } });
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name,
        icon,
        frequencyType,
        frequencyDays,
        reminderEnabled: !!reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : null,
        sortOrder: count,
      },
    });
    return NextResponse.json({ habit });
  } catch {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

// A user may only create or duplicate one habit per week; the count resets
// automatically once the current week's start moves past their last habit's createdAt.
export async function hasReachedWeeklyLimit(userId: string): Promise<boolean> {
  const weekStart = getWeekStart(getCurrentWeekKey());
  const createdThisWeek = await prisma.habit.count({
    where: { userId, createdAt: { gte: weekStart } },
  });
  return createdThisWeek >= 1;
}
