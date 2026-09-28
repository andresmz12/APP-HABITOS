import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { getSessionUser, getPartner } from '@/lib/auth';
import { getWeekKey, getDayKey } from '@/lib/utils/dates';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ tasks: [] }, { status: 401 });

  const weekKey = req.nextUrl.searchParams.get('weekKey');
  const month = req.nextUrl.searchParams.get('month');
  if (!weekKey && !month) return NextResponse.json({ tasks: [] });

  try {
    const partner = await getPartner(user.coupleId, user.id);
    const userIds = partner ? [user.id, partner.id] : [user.id];

    const tasks = await prisma.weeklyTask.findMany({
      where: {
        userId: { in: userIds },
        ...(month ? { dateKey: { startsWith: month } } : { weekKey: weekKey! }),
      },
      orderBy: [{ dateKey: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { dateKey, time, endTime, text, repeatWeeks } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    if (!dateKey) {
      return NextResponse.json({ error: 'dateKey is required' }, { status: 400 });
    }
    if (time && endTime && endTime <= time) {
      return NextResponse.json({ error: 'La hora de fin debe ser después de la hora de inicio' }, { status: 400 });
    }

    const weeks = Math.min(Math.max(Number(repeatWeeks) || 1, 1), 26); // cap at ~6 months
    const seriesId = weeks > 1 ? randomUUID() : null;

    const rows = Array.from({ length: weeks }, (_, i) => {
      const occurrenceDate = new Date(dateKey + 'T00:00:00Z');
      occurrenceDate.setUTCDate(occurrenceDate.getUTCDate() + i * 7);
      const occurrenceDateKey = getDayKey(occurrenceDate);
      return {
        userId: user.id,
        weekKey: getWeekKey(occurrenceDate),
        dateKey: occurrenceDateKey,
        time: time || null,
        endTime: time && endTime ? endTime : null,
        text: text.trim(),
        seriesId,
      };
    });

    await prisma.weeklyTask.createMany({ data: rows });
    const [task] = await prisma.weeklyTask.findMany({
      where: { userId: user.id, dateKey: rows[0].dateKey, text: text.trim() },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ task, created: rows.length });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
