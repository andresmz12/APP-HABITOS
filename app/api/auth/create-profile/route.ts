import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, generatePairCode, normalizeUsername, hashPassword, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, avatarColor, username, password } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!username?.trim() || normalizeUsername(username).length < 3) {
      return NextResponse.json({ error: 'El usuario debe tener al menos 3 caracteres' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const normalizedUsername = normalizeUsername(username);
    const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (existing) {
      return NextResponse.json({ error: 'Ese usuario ya está en uso' }, { status: 409 });
    }

    let pairCode = generatePairCode();
    for (let i = 0; i < 5; i++) {
      const existingCode = await prisma.user.findUnique({ where: { pairCode } });
      if (!existingCode) break;
      pairCode = generatePairCode();
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name: name.trim(), avatarColor: avatarColor || '#6C63FF', username: normalizedUsername, passwordHash, pairCode },
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
    console.error('create-profile error:', err);
    return NextResponse.json({ error: 'No se pudo crear el perfil' }, { status: 500 });
  }
}
