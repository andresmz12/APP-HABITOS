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
    const existing = await prisma.coupleNote.findUnique({ where: { id } });
    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.coupleNote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
