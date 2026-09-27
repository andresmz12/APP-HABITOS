import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const weekKey = req.nextUrl.searchParams.get('weekKey');
  if (!weekKey) return NextResponse.json({ tasks: [] });

  try {
    const tasks = await prisma.weeklyTask.findMany({
      where: { weekKey },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partnerId, weekKey, dateKey, text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const task = await prisma.weeklyTask.create({
      data: { partnerId, weekKey, dateKey, text: text.trim() },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
