import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { getCurrentDayKey } from '@/lib/utils/dates';

function getColombiaCurrentTime(): string {
  const now = new Date();
  const colombiaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return `${String(colombiaNow.getUTCHours()).padStart(2, '0')}:${String(colombiaNow.getUTCMinutes()).padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentTime = getColombiaCurrentTime();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const results: Record<string, unknown> = {};

    // Global daily reminder, one per user at their own configured time
    const dueUsers = await prisma.user.findMany({
      where: { notificationsEnabled: true, reminderTime: currentTime, notificationEmail: { not: null } },
    });

    if (dueUsers.length) {
      await Promise.all(
        dueUsers.map((u) =>
          resend.emails.send({
            from: 'Hábitos en Pareja <onboarding@resend.dev>',
            to: u.notificationEmail!,
            subject: '🌟 ¡Recuerda tus hábitos de hoy!',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; color: #fff; border-radius: 16px;">
                <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Hábitos en Pareja</h1>
                <p style="color: #9ca3af; margin: 0 0 24px;">¡Hola ${u.name}! Es hora de revisar tus hábitos del día.</p>
                <a href="https://app-habitos-production-5e3c.up.railway.app/home"
                   style="display: block; text-align: center; background: ${u.avatarColor}; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  Abrir la app →
                </a>
              </div>
            `,
          })
        )
      );
    }
    results.globalReminder = { sent: dueUsers.length > 0, to: dueUsers.map((u) => u.notificationEmail), at: currentTime };

    // Per-habit reminders: habits whose reminderTime matches now and aren't completed today
    const dueHabits = await prisma.habit.findMany({
      where: { isArchived: false, reminderEnabled: true, reminderTime: currentTime },
      include: { user: true },
    });

    if (dueHabits.length) {
      const dateKey = getCurrentDayKey();
      const todaysCompletions = await prisma.habitCompletion.findMany({
        where: { dateKey, habitId: { in: dueHabits.map((h) => h.id) } },
        select: { habitId: true },
      });
      const completedHabitIds = new Set(todaysCompletions.map((c) => c.habitId));
      const pendingByUser = new Map<string, { email: string; habitNames: string[] }>();

      for (const habit of dueHabits) {
        if (completedHabitIds.has(habit.id)) continue;
        if (!habit.user.notificationEmail) continue;
        const entry = pendingByUser.get(habit.userId) ?? { email: habit.user.notificationEmail, habitNames: [] };
        entry.habitNames.push(`${habit.icon} ${habit.name}`);
        pendingByUser.set(habit.userId, entry);
      }

      const habitEmailsSent: string[] = [];
      for (const { email, habitNames } of pendingByUser.values()) {
        await resend.emails.send({
          from: 'Hábitos en Pareja <onboarding@resend.dev>',
          to: email,
          subject: '⏰ Recordatorio de hábito',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; color: #fff; border-radius: 16px;">
              <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 16px;">⏰ Es hora</h1>
              <div style="background: #1A1A24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <ul style="margin: 0; padding-left: 18px; color: #e5e7eb; font-size: 16px;">
                  ${habitNames.map((n) => `<li>${n}</li>`).join('')}
                </ul>
              </div>
              <a href="https://app-habitos-production-5e3c.up.railway.app/home"
                 style="display: block; text-align: center; background: #6C63FF; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                Abrir la app →
              </a>
            </div>
          `,
        });
        habitEmailsSent.push(email);
      }
      results.habitReminders = { sent: habitEmailsSent.length > 0, to: habitEmailsSent, at: currentTime };
    } else {
      results.habitReminders = { sent: false };
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
