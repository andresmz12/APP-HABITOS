import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDayKey, getISOWeekKey, getCurrentDayKey, getCurrentWeekKey } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get('partnerId');
  const dateKey = req.nextUrl.searchParams.get('dateKey');
  const weekKey = req.nextUrl.searchParams.get('weekKey');

  if (!partnerId) return NextResponse.json({ completions: [] });

  try {
    const where: Record<string, unknown> = { partnerId };
    if (dateKey) where.dateKey = dateKey;
    if (weekKey) where.weekKey = weekKey;

    const completions = await prisma.habitCompletion.findMany({ where });
    return NextResponse.json({ completions });
  } catch {
    return NextResponse.json({ completions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { habitId, partnerId, photoUrl } = await req.json();
    const dateKey = getCurrentDayKey();
    const weekKey = getCurrentWeekKey();

    const completion = await prisma.$transaction(async (tx) => {
      const c = await tx.habitCompletion.create({
        data: { habitId, partnerId, dateKey, weekKey, pointsEarned: 1, photoUrl: photoUrl ?? null },
      });

      const field =
        partnerId === 'partner1'
          ? { partner1TotalPoints: { increment: 1 }, partner1TotalCompletions: { increment: 1 } }
          : { partner2TotalPoints: { increment: 1 }, partner2TotalCompletions: { increment: 1 } };

      await tx.weeklyStat.upsert({
        where: { weekKey },
        update: field,
        create: {
          weekKey,
          weekStart: new Date(weekKey + 'T05:00:00Z'),
          partner1TotalPoints: partnerId === 'partner1' ? 1 : 0,
          partner1TotalCompletions: partnerId === 'partner1' ? 1 : 0,
          partner2TotalPoints: partnerId === 'partner2' ? 1 : 0,
          partner2TotalCompletions: partnerId === 'partner2' ? 1 : 0,
        },
      });

      return c;
    });

    return NextResponse.json({ completion });
  } catch {
    return NextResponse.json({ error: 'Failed to create completion' }, { status: 500 });
  }
}
