import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ notes: [] }, { status: 401 });
  if (!user.coupleId) return NextResponse.json({ notes: [] });

  try {
    const notes = await prisma.coupleNote.findMany({
      where: { coupleId: user.coupleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { author: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ notes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!user.coupleId) return NextResponse.json({ error: 'Aún no tienes pareja vinculada' }, { status: 400 });

  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const note = await prisma.coupleNote.create({
      data: { coupleId: user.coupleId, authorId: user.id, text: text.trim().slice(0, 280) },
      include: { author: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
