import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function dbToStat(row: Awaited<ReturnType<typeof prisma.weeklyStat.findUnique>>) {
  if (!row) return null;
  return {
    weekKey: row.weekKey,
    weekStart: row.weekStart,
    partner1: { totalPoints: row.partner1TotalPoints, totalCompletions: row.partner1TotalCompletions },
    partner2: { totalPoints: row.partner2TotalPoints, totalCompletions: row.partner2TotalCompletions },
    finalizedAt: row.finalizedAt ?? undefined,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ weekKey: string }> }
) {
  try {
    const { weekKey } = await params;
    const stat = await prisma.weeklyStat.findUnique({ where: { weekKey } });
    return NextResponse.json({ stat: dbToStat(stat) });
  } catch {
    return NextResponse.json({ stat: null }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ weekKey: string }> }
) {
  try {
    const { weekKey } = await params;
    const stat = await prisma.weeklyStat.upsert({
      where: { weekKey },
      update: {},
      create: {
        weekKey,
        weekStart: new Date(),
        partner1TotalPoints: 0,
        partner1TotalCompletions: 0,
        partner2TotalPoints: 0,
        partner2TotalCompletions: 0,
      },
    });
    return NextResponse.json({ stat: dbToStat(stat) });
  } catch {
    return NextResponse.json({ error: 'Failed to ensure weekly stat' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weekKey: string }> }
) {
  try {
    const { weekKey } = await params;
    const data = await req.json();
    const stat = await prisma.weeklyStat.update({ where: { weekKey }, data });
    return NextResponse.json({ stat: dbToStat(stat) });
  } catch {
    return NextResponse.json({ error: 'Failed to update weekly stat' }, { status: 500 });
  }
}
