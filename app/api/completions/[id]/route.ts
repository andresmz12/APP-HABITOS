import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const completion = await tx.habitCompletion.delete({ where: { id } });

      const field =
        completion.partnerId === 'partner1'
          ? { partner1TotalPoints: { decrement: 1 }, partner1TotalCompletions: { decrement: 1 } }
          : { partner2TotalPoints: { decrement: 1 }, partner2TotalCompletions: { decrement: 1 } };

      await tx.weeklyStat.update({
        where: { weekKey: completion.weekKey },
        data: field,
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete completion' }, { status: 500 });
  }
}
