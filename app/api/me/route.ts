import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, getPartner, sanitizeUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ user: null, partner: null });
  const partner = await getPartner(user.coupleId, user.id);
  return NextResponse.json({ user: sanitizeUser(user), partner: partner ? sanitizeUser(partner) : null });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.avatarColor !== undefined) data.avatarColor = body.avatarColor;
    if (body.notificationEmail !== undefined) data.notificationEmail = body.notificationEmail || null;
    if (body.reminderTime !== undefined) data.reminderTime = body.reminderTime;
    if (body.notificationsEnabled !== undefined) data.notificationsEnabled = !!body.notificationsEnabled;

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 });
  }
}
