import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.weeklyTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const { done } = await req.json();
    const task = await prisma.weeklyTask.update({
      where: { id },
      data: { done: !!done },
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.weeklyTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.weeklyTask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
