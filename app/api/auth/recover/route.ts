import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, sanitizeUser } from '@/lib/auth';

function normalize(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { recoveryCode } = await req.json();
    if (!recoveryCode?.trim()) {
      return NextResponse.json({ error: 'Ingresa tu código de recuperación' }, { status: 400 });
    }

    const normalized = normalize(recoveryCode);
    const users = await prisma.user.findMany({ where: { recoveryCode: { not: null } } });
    const user = users.find((u) => u.recoveryCode && normalize(u.recoveryCode) === normalized);

    if (!user) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
    }

    // Adds a session for this device alongside any others already signed in —
    // recovering on a new phone doesn't sign you out elsewhere.
    const sessionToken = await createSession(user.id);

    const res = NextResponse.json({ user: sanitizeUser(user) });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
    return res;
  } catch (err) {
    console.error('recover error:', err);
    return NextResponse.json({ error: 'No se pudo recuperar la cuenta' }, { status: 500 });
  }
}
