import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentWeekKey } from '@/lib/utils/dates';

function dbToConfig(row: Awaited<ReturnType<typeof prisma.appConfig.findUnique>>) {
  if (!row) return null;
  return {
    coupleId: row.coupleId,
    isOnboardingComplete: row.isOnboardingComplete,
    currentWeekKey: row.currentWeekKey,
    createdAt: row.createdAt,
    partner1: {
      id: 'partner1' as const,
      name: row.partner1Name,
      avatarColor: row.partner1AvatarColor,
      avatarEmoji: row.partner1AvatarEmoji,
      notificationTime: row.partner1NotificationTime,
      notificationsEnabled: row.partner1NotificationsEnabled,
    },
    partner2: {
      id: 'partner2' as const,
      name: row.partner2Name,
      avatarColor: row.partner2AvatarColor,
      avatarEmoji: row.partner2AvatarEmoji,
      notificationTime: row.partner2NotificationTime,
      notificationsEnabled: row.partner2NotificationsEnabled,
    },
    partner1NotificationEmail: row.partner1NotificationEmail ?? undefined,
    partner2NotificationEmail: row.partner2NotificationEmail ?? undefined,
    notificationTimes: row.notificationTimes,
  };
}

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({ where: { id: 'app' } });
    return NextResponse.json({ config: dbToConfig(config) });
  } catch {
    return NextResponse.json({ config: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { partner1, partner2 } = await req.json();
    const weekKey = getCurrentWeekKey();
    const partnerData = {
      isOnboardingComplete: true,
      currentWeekKey: weekKey,
      partner1Name: partner1.name,
      partner1AvatarColor: partner1.avatarColor,
      partner1AvatarEmoji: partner1.avatarEmoji,
      partner1NotificationTime: partner1.notificationTime ?? '20:00',
      partner1NotificationsEnabled: partner1.notificationsEnabled ?? false,
      partner2Name: partner2.name,
      partner2AvatarColor: partner2.avatarColor,
      partner2AvatarEmoji: partner2.avatarEmoji,
      partner2NotificationTime: partner2.notificationTime ?? '20:00',
      partner2NotificationsEnabled: partner2.notificationsEnabled ?? false,
    };
    // upsert so re-running onboarding never fails with a unique constraint error
    const config = await prisma.appConfig.upsert({
      where: { id: 'app' },
      update: partnerData,
      create: { id: 'app', coupleId: crypto.randomUUID(), ...partnerData },
    });
    return NextResponse.json({ config: dbToConfig(config) });
  } catch {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.currentWeekKey) data.currentWeekKey = body.currentWeekKey;
    if (body.partner1NotificationEmail !== undefined) data.partner1NotificationEmail = body.partner1NotificationEmail || null;
    if (body.partner2NotificationEmail !== undefined) data.partner2NotificationEmail = body.partner2NotificationEmail || null;
    if (body.notificationTimes !== undefined) data.notificationTimes = body.notificationTimes || '20:00';

    if (body.partner1) {
      const p = body.partner1;
      if (p.name !== undefined) data.partner1Name = p.name;
      if (p.avatarColor !== undefined) data.partner1AvatarColor = p.avatarColor;
      if (p.avatarEmoji !== undefined) data.partner1AvatarEmoji = p.avatarEmoji;
      if (p.notificationTime !== undefined) data.partner1NotificationTime = p.notificationTime;
      if (p.notificationsEnabled !== undefined) data.partner1NotificationsEnabled = p.notificationsEnabled;
    }

    if (body.partner2) {
      const p = body.partner2;
      if (p.name !== undefined) data.partner2Name = p.name;
      if (p.avatarColor !== undefined) data.partner2AvatarColor = p.avatarColor;
      if (p.avatarEmoji !== undefined) data.partner2AvatarEmoji = p.avatarEmoji;
      if (p.notificationTime !== undefined) data.partner2NotificationTime = p.notificationTime;
      if (p.notificationsEnabled !== undefined) data.partner2NotificationsEnabled = p.notificationsEnabled;
    }

    const config = await prisma.appConfig.update({ where: { id: 'app' }, data });
    return NextResponse.json({ config: dbToConfig(config) });
  } catch {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
