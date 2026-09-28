import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import { getCurrentDayKey, getCurrentWeekKey, formatWeekRange } from '@/lib/utils/dates';
import { getPartner } from '@/lib/auth';

function getColombiaNow(): Date {
  const now = new Date();
  return new Date(now.getTime() - 5 * 60 * 60 * 1000);
}

function getColombiaCurrentTime(): string {
  const colombiaNow = getColombiaNow();
  return `${String(colombiaNow.getUTCHours()).padStart(2, '0')}:${String(colombiaNow.getUTCMinutes()).padStart(2, '0')}`;
}

// 0 = Sunday, matching Date#getUTCDay()
function getColombiaDayOfWeek(): number {
  return getColombiaNow().getUTCDay();
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

    // Calendar task reminders: pending tasks with a matching time, today
    const todayKey = getCurrentDayKey();
    const dueTasks = await prisma.weeklyTask.findMany({
      where: { dateKey: todayKey, time: currentTime, done: false },
      include: { user: true },
    });

    if (dueTasks.length) {
      const taskEmailsSent: string[] = [];
      for (const task of dueTasks) {
        if (!task.user.notificationEmail) continue;
        await resend.emails.send({
          from: 'Hábitos en Pareja <onboarding@resend.dev>',
          to: task.user.notificationEmail,
          subject: '📅 Tienes un pendiente ahora',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; color: #fff; border-radius: 16px;">
              <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 16px;">📅 Es hora</h1>
              <div style="background: #1A1A24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #e5e7eb; font-size: 16px;">${task.text}</p>
              </div>
              <a href="https://app-habitos-production-5e3c.up.railway.app/home"
                 style="display: block; text-align: center; background: #6C63FF; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                Abrir la app →
              </a>
            </div>
          `,
        });
        taskEmailsSent.push(task.user.notificationEmail);
      }
      results.taskReminders = { sent: taskEmailsSent.length > 0, to: taskEmailsSent, at: currentTime };
    } else {
      results.taskReminders = { sent: false };
    }

    // Weekly recap: every Sunday at 20:00 Colombia time, one email per user
    // with their own + their partner's stats for the week that's ending.
    if (getColombiaDayOfWeek() === 0 && currentTime === '20:00') {
      const weekKey = getCurrentWeekKey();
      const users = await prisma.user.findMany({ where: { notificationEmail: { not: null } } });
      const recapEmailsSent: string[] = [];

      for (const user of users) {
        const partner = await getPartner(user.coupleId, user.id);
        const [myStat, partnerStat] = await Promise.all([
          prisma.weeklyStat.findUnique({ where: { userId_weekKey: { userId: user.id, weekKey } } }),
          partner
            ? prisma.weeklyStat.findUnique({ where: { userId_weekKey: { userId: partner.id, weekKey } } })
            : Promise.resolve(null),
        ]);

        const myPoints = myStat?.totalPoints ?? 0;
        const partnerPoints = partnerStat?.totalPoints ?? 0;

        await resend.emails.send({
          from: 'Hábitos en Pareja <onboarding@resend.dev>',
          to: user.notificationEmail!,
          subject: '📊 Tu resumen de la semana',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; color: #fff; border-radius: 16px;">
              <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 4px;">📊 Así les fue esta semana</h1>
              <p style="color: #9ca3af; margin: 0 0 24px; font-size: 14px;">${formatWeekRange(weekKey)}</p>
              <div style="background: #1A1A24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #e5e7eb; font-size: 16px;">
                  <strong style="color: ${user.avatarColor}">${user.name}</strong>: ${myPoints} pts · ${myStat?.totalCompletions ?? 0} hábitos completados
                </p>
                ${partner ? `<p style="margin: 0; color: #e5e7eb; font-size: 16px;">
                  <strong style="color: ${partner.avatarColor}">${partner.name}</strong>: ${partnerPoints} pts · ${partnerStat?.totalCompletions ?? 0} hábitos completados
                </p>` : ''}
              </div>
              <a href="https://app-habitos-production-5e3c.up.railway.app/together"
                 style="display: block; text-align: center; background: ${user.avatarColor}; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                Ver el detalle →
              </a>
            </div>
          `,
        });
        recapEmailsSent.push(user.notificationEmail!);
      }
      results.weeklyRecap = { sent: recapEmailsSent.length > 0, to: recapEmailsSent };
    } else {
      results.weeklyRecap = { sent: false };
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
