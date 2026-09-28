import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, generateRecoveryCode, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, avatarColor, pairCode } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const code = (pairCode || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Ingresa el código de tu pareja' }, { status: 400 });
    }

    const host = await prisma.user.findUnique({ where: { pairCode: code } });
    if (!host || host.coupleId) {
      return NextResponse.json({ error: 'Código inválido o ya fue usado' }, { status: 404 });
    }

    let recoveryCode = generateRecoveryCode();
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { recoveryCode } });
      if (!existing) break;
      recoveryCode = generateRecoveryCode();
    }

    const user = await prisma.$transaction(async (tx) => {
      const couple = await tx.couple.create({ data: {} });
      await tx.user.update({ where: { id: host.id }, data: { coupleId: couple.id, pairCode: null } });
      return tx.user.create({
        data: { name: name.trim(), avatarColor: avatarColor || '#FF6B9D', coupleId: couple.id, recoveryCode },
      });
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
    console.error('join error:', err);
    return NextResponse.json({ error: 'No se pudo vincular la pareja' }, { status: 500 });
  }
}
