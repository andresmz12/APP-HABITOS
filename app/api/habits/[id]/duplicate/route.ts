import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasReachedWeeklyLimit } from '../../route';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const original = await prisma.habit.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (await hasReachedWeeklyLimit(original.partnerId)) {
      return NextResponse.json(
        { error: 'Ya agregaste o duplicaste un hábito esta semana. Podrás hacerlo de nuevo la próxima semana.' },
        { status: 429 }
      );
    }

    const count = await prisma.habit.count({ where: { partnerId: original.partnerId } });
    const habit = await prisma.habit.create({
      data: {
        partnerId: original.partnerId,
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
