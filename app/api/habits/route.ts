import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getCurrentWeekKey } from '@/lib/utils/dates';
import { computeStreak } from '@/lib/streak';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ habits: [] }, { status: 401 });

  try {
    const weekKey = getCurrentWeekKey();
    const [habits, stat] = await Promise.all([
      prisma.habit.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.weeklyStat.findUnique({ where: { userId_weekKey: { userId: user.id, weekKey } } }),
    ]);
    const streak = await computeStreak(user.id, habits.length);
    return NextResponse.json({ habits, streak, weeklyPoints: stat?.totalPoints ?? 0 });
  } catch {
    return NextResponse.json({ habits: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { name, icon, frequencyType, frequencyDays, reminderEnabled, reminderTime } = await req.json();

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
