import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, createSession, normalizeUsername, verifyPassword, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username?.trim() || !password) {
      return NextResponse.json({ error: 'Ingresa tu usuario y contraseña' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username: normalizeUsername(username) } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

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
    console.error('login error:', err);
    return NextResponse.json({ error: 'No se pudo iniciar sesión' }, { status: 500 });
  }
}
