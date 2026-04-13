import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get('partnerId');
  if (!partnerId) return NextResponse.json({ habits: [] });

  try {
    const habits = await prisma.habit.findMany({
      where: { partnerId, isArchived: false },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ habits });
  } catch {
    return NextResponse.json({ habits: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partnerId, name, icon, frequencyType, frequencyDays } = await req.json();
    const count = await prisma.habit.count({ where: { partnerId } });
    const habit = await prisma.habit.create({
      data: { partnerId, name, icon, frequencyType, frequencyDays, sortOrder: count },
    });
    return NextResponse.json({ habit });
  } catch {
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
