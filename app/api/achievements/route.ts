import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { computeBadges } from '@/lib/badges';
import { computeStreak } from '@/lib/streak';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ badges: [] }, { status: 401 });

  try {
    const [habitsCreated, taskCount, statsAgg] = await Promise.all([
      prisma.habit.count({ where: { userId: user.id } }),
      prisma.weeklyTask.count({ where: { userId: user.id } }),
      prisma.weeklyStat.aggregate({ where: { userId: user.id }, _sum: { totalCompletions: true } }),
    ]);

    const activeHabits = await prisma.habit.count({ where: { userId: user.id, isArchived: false } });
    const streak = await computeStreak(user.id, activeHabits);

    const badges = computeBadges({
      habitsCreated,
      totalCompletions: statsAgg._sum.totalCompletions ?? 0,
      streak,
      isPaired: !!user.coupleId,
      hasTasks: taskCount > 0,
    });

    return NextResponse.json({ badges });
  } catch {
    return NextResponse.json({ badges: [] }, { status: 500 });
  }
}
