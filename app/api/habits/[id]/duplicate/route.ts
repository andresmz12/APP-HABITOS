import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const original = await prisma.habit.findUnique({ where: { id } });
    if (!original || original.userId !== user.id) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const count = await prisma.habit.count({ where: { userId: user.id } });
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: original.name,
        icon: original.icon,
        frequencyType: original.frequencyType,
        frequencyDays: original.frequencyDays,
        reminderEnabled: original.reminderEnabled,
        reminderTime: original.reminderTime,
        sortOrder: count,
      },
    });
    return NextResponse.json({ habit });
  } catch {
    return NextResponse.json({ error: 'Failed to duplicate habit' }, { status: 500 });
  }
}
