import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getWeekStart, getCurrentWeekKey } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get('partnerId');
  if (!partnerId) return NextResponse.json({ habits: [] });

  try {
    const habits = await prisma.habit.findMany({
      where: { partnerId, isArchived: false },
      orderBy: { sortOrder: 'asc' },
    });
    const weeklyLimitReached = await hasReachedWeeklyLimit(partnerId);
    return NextResponse.json({ habits, weeklyLimitReached });
  } catch {
    return NextResponse.json({ habits: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partnerId, name, icon, frequencyType, frequencyDays, reminderEnabled, reminderTime } =
      await req.json();

    if (await hasReachedWeeklyLimit(partnerId)) {
      return NextResponse.json(
        { error: 'Ya agregaste o duplicaste un hábito esta semana. Podrás hacerlo de nuevo la próxima semana.' },
        { status: 429 }
      );
    }

    const count = await prisma.habit.count({ where: { partnerId } });
    const habit = await prisma.habit.create({
      data: {
        partnerId,
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

// A partner may only create or duplicate one habit per week; the count resets
// automatically once the current week's start moves past their last habit's createdAt.
export async function hasReachedWeeklyLimit(partnerId: string): Promise<boolean> {
  const weekStart = getWeekStart(getCurrentWeekKey());
  const createdThisWeek = await prisma.habit.count({
    where: { partnerId, createdAt: { gte: weekStart } },
  });
  return createdThisWeek >= 1;
}
