import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, generateRecoveryCode } from '@/lib/auth';

// Fetched on demand (not part of /api/me's poll payload) so the code isn't
// echoed into the client every 5s just by having the app open.
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    if (user.recoveryCode) {
      return NextResponse.json({ recoveryCode: user.recoveryCode });
    }
    // Backfill for accounts created before recovery codes existed
    let recoveryCode = generateRecoveryCode();
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { recoveryCode } });
      if (!existing) break;
      recoveryCode = generateRecoveryCode();
    }
    await prisma.user.update({ where: { id: user.id }, data: { recoveryCode } });
    return NextResponse.json({ recoveryCode });
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el código' }, { status: 500 });
  }
}
