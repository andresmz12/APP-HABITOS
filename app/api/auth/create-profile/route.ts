import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE, generateSessionToken, generatePairCode, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, avatarColor } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const sessionToken = generateSessionToken();
    let pairCode = generatePairCode();

    // Extremely unlikely, but guard against a pairCode collision
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.user.findUnique({ where: { pairCode } });
      if (!existing) break;
      pairCode = generatePairCode();
    }

    const user = await prisma.user.create({
      data: { name: name.trim(), avatarColor: avatarColor || '#6C63FF', sessionToken, pairCode },
    });

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
