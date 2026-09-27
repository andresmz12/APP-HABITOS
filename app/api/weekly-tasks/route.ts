import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, getPartner } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ tasks: [] }, { status: 401 });

  const weekKey = req.nextUrl.searchParams.get('weekKey');
  if (!weekKey) return NextResponse.json({ tasks: [] });

  try {
    const partner = await getPartner(user.coupleId, user.id);
    const userIds = partner ? [user.id, partner.id] : [user.id];

    const tasks = await prisma.weeklyTask.findMany({
      where: { weekKey, userId: { in: userIds } },
      orderBy: { createdAt: 'asc' },
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
    const { weekKey, dateKey, text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const task = await prisma.weeklyTask.create({
      data: { userId: user.id, weekKey, dateKey, text: text.trim() },
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
