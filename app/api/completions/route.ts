import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getCurrentDayKey, getCurrentWeekKey } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ completions: [] }, { status: 401 });

  const dateKey = req.nextUrl.searchParams.get('dateKey');
  const weekKey = req.nextUrl.searchParams.get('weekKey');

  try {
    const where: Record<string, unknown> = { userId: user.id };
    if (dateKey) where.dateKey = dateKey;
    if (weekKey) where.weekKey = weekKey;

    const completions = await prisma.habitCompletion.findMany({ where });
    return NextResponse.json({ completions });
  } catch {
    return NextResponse.json({ completions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { habitId, photoUrl } = await req.json();

    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const dateKey = getCurrentDayKey();
    const weekKey = getCurrentWeekKey();

    const completion = await prisma.$transaction(async (tx) => {
      const already = await tx.habitCompletion.findFirst({ where: { habitId, dateKey } });
      if (already) return already;

      const c = await tx.habitCompletion.create({
        data: { habitId, userId: user.id, dateKey, weekKey, pointsEarned: 1, photoUrl: photoUrl ?? null },
      });

      await tx.weeklyStat.upsert({
        where: { userId_weekKey: { userId: user.id, weekKey } },
        update: { totalPoints: { increment: 1 }, totalCompletions: { increment: 1 } },
        create: { userId: user.id, weekKey, totalPoints: 1, totalCompletions: 1 },
      });

      return c;
    });

    return NextResponse.json({ completion });
  } catch {
    return NextResponse.json({ error: 'Failed to create completion' }, { status: 500 });
  }
}
