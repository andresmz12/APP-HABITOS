import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, getPartner } from '@/lib/auth';
import { getCurrentDayKey } from '@/lib/utils/dates';
import { computeStreak } from '@/lib/streak';

async function buildSide(userId: string, name: string, avatarColor: string, weekKey: string) {
  const [habits, weekCompletions, stat] = await Promise.all([
    prisma.habit.findMany({ where: { userId, isArchived: false }, orderBy: { sortOrder: 'asc' } }),
    prisma.habitCompletion.findMany({ where: { userId, weekKey } }),
    prisma.weeklyStat.findUnique({ where: { userId_weekKey: { userId, weekKey } } }),
  ]);

  const todayKey = getCurrentDayKey();
  const todayCompletions = weekCompletions.filter((c) => c.dateKey === todayKey);
  const streak = await computeStreak(userId, habits.length);

  return {
    user: { id: userId, name, avatarColor },
    habits,
    habitsCount: habits.length,
    todayCompletions: todayCompletions.length,
    weekCompletions,
    points: stat?.totalPoints ?? 0,
    totalCompletions: stat?.totalCompletions ?? 0,
    streak,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const weekKey = req.nextUrl.searchParams.get('weekKey');
  if (!weekKey) return NextResponse.json({ error: 'weekKey is required' }, { status: 400 });

  try {
    const partner = await getPartner(user.coupleId, user.id);

    const me = await buildSide(user.id, user.name, user.avatarColor, weekKey);
    const partnerSide = partner
      ? await buildSide(partner.id, partner.name, partner.avatarColor, weekKey)
      : null;

    return NextResponse.json({ me, partner: partnerSide, pairCode: user.pairCode });
  } catch {
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
  }
}
