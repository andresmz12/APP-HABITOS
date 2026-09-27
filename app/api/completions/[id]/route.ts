import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.habitCompletion.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.habitCompletion.delete({ where: { id } });
      await tx.weeklyStat.update({
        where: { userId_weekKey: { userId: existing.userId, weekKey: existing.weekKey } },
        data: { totalPoints: { decrement: 1 }, totalCompletions: { decrement: 1 } },
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete completion' }, { status: 500 });
  }
}
