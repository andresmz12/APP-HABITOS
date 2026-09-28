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

function formatGroups(code: string, groupSize: number): string {
  return code.match(new RegExp(`.{1,${groupSize}}`, 'g'))!.join('-');
}

// Longer than a pair code since it's a standing credential, not a one-time handoff.
export function generateRecoveryCode(): string {
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += PAIR_CODE_CHARS[Math.floor(Math.random() * PAIR_CODE_CHARS.length)];
  }
  return formatGroups(raw, 4); // e.g. "AB3D-EFGH-2345"
}

// A user can be signed in on several devices at once — each one gets its own
// Session row/token rather than sharing a single token on the User itself.
export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  // Best-effort activity timestamp; don't fail the request if this races/errors.
  prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return session.user;
}

export async function createSession(userId: string, device?: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({ data: { token, userId, device } });
  return token;
}

export async function getPartner(coupleId: string | null, ownUserId: string) {
  if (!coupleId) return null;
  return prisma.user.findFirst({ where: { coupleId, id: { not: ownUserId } } });
}

// Never send recoveryCode back in a response body by default — it's a
// standing credential. Routes that intentionally reveal it (e.g. right after
// generating it) do so via their own explicit field.
export function sanitizeUser<T extends { recoveryCode?: string | null }>(user: T): Omit<T, 'recoveryCode'> {
  const { recoveryCode: _recoveryCode, ...rest } = user;
  return rest;
}
