import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, generatePairCode, generateRecoveryCode, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, avatarColor } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    let pairCode = generatePairCode();
    let recoveryCode = generateRecoveryCode();

    // Extremely unlikely, but guard against code collisions
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { pairCode } });
      if (!existing) break;
      pairCode = generatePairCode();
    }
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { recoveryCode } });
      if (!existing) break;
      recoveryCode = generateRecoveryCode();
    }

    const user = await prisma.user.create({
      data: { name: name.trim(), avatarColor: avatarColor || '#6C63FF', pairCode, recoveryCode },
    });
    const sessionToken = await createSession(user.id);

    const res = NextResponse.json({ user: sanitizeUser(user), recoveryCode });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
    return res;
  } catch (err) {
    console.error('create-profile error:', err);
    return NextResponse.json({ error: 'No se pudo crear el perfil' }, { status: 500 });
  }
}
