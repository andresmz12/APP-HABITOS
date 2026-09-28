import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Ingresa tu contraseña actual y una nueva de al menos 6 caracteres' }, { status: 400 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('change-password error:', err);
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña' }, { status: 500 });
  }
}
