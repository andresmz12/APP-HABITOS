import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, normalizeUsername, hashPassword, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, avatarColor, username, password, pairCode } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!username?.trim() || normalizeUsername(username).length < 3) {
      return NextResponse.json({ error: 'El usuario debe tener al menos 3 caracteres' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }
    const code = (pairCode || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Ingresa el código de tu pareja' }, { status: 400 });
    }

    const normalizedUsername = normalizeUsername(username);
    const existingUsername = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existingUsername) {
      return NextResponse.json({ error: 'Ese usuario ya está en uso' }, { status: 409 });
    }

    const host = await prisma.user.findUnique({ where: { pairCode: code } });
    if (!host || host.coupleId) {
      return NextResponse.json({ error: 'Código inválido o ya fue usado' }, { status: 404 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const couple = await tx.couple.create({ data: {} });
      await tx.user.update({ where: { id: host.id }, data: { coupleId: couple.id, pairCode: null } });
      return tx.user.create({
        data: {
          name: name.trim(),
          avatarColor: avatarColor || '#FF6B9D',
          username: normalizedUsername,
          passwordHash,
          coupleId: couple.id,
        },
      });
    });
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
    console.error('join error:', err);
    return NextResponse.json({ error: 'No se pudo vincular la pareja' }, { status: 500 });
  }
}
