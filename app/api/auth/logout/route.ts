import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE } from '@/lib/auth';

// Signs out only this device — other sessions for the same account stay active.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
