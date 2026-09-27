import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from './db';

export const SESSION_COOKIE = 'session_token';

export function generateSessionToken(): string {
  return randomBytes(24).toString('hex');
}

const PAIR_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)

export function generatePairCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PAIR_CODE_CHARS[Math.floor(Math.random() * PAIR_CODE_CHARS.length)];
  }
  return code;
}

export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return prisma.user.findUnique({ where: { sessionToken: token } });
}

export async function getPartner(coupleId: string | null, ownUserId: string) {
  if (!coupleId) return null;
  return prisma.user.findFirst({ where: { coupleId, id: { not: ownUserId } } });
}

// Never send sessionToken back in a response body — it already lives in an
// httpOnly cookie, and echoing it in JSON would let an XSS read and steal it.
export function sanitizeUser<T extends { sessionToken?: string }>(user: T): Omit<T, 'sessionToken'> {
  const { sessionToken: _sessionToken, ...rest } = user;
  return rest;
}
