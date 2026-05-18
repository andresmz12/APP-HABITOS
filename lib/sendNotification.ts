import { prisma } from '@/lib/db';
import sgMail from '@sendgrid/mail';

// Tracks "YYYY-MM-DD|HH:mm" keys already sent in this process to avoid duplicates
const sentKeys = new Set<string>();

export async function sendScheduledNotification(): Promise<{ sent: boolean; reason?: string; to?: string[] }> {
  const config = await prisma.appConfig.findUnique({ where: { id: 'app' } });
  if (!config) return { sent: false, reason: 'No config found' };

  const now = new Date();
  const colombiaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const currentMinutes = colombiaNow.getUTCHours() * 60 + colombiaNow.getUTCMinutes();
  const dateKey = colombiaNow.toISOString().slice(0, 10);

  const times = config.notificationTimes.split(',').map((t) => t.trim()).filter(Boolean);
  const matchedTime = times.find((t) => {
    const [h, m] = t.split(':').map(Number);
    return Math.abs(h * 60 + m - currentMinutes) <= 1;
  });

  if (!matchedTime) {
    const currentTime = `${String(colombiaNow.getUTCHours()).padStart(2, '0')}:${String(colombiaNow.getUTCMinutes()).padStart(2, '0')}`;
    return { sent: false, reason: `Not a notification time (${currentTime})` };
  }

  const dedupeKey = `${dateKey}|${matchedTime}`;
  if (sentKeys.has(dedupeKey)) {
    return { sent: false, reason: `Already sent for ${dedupeKey}` };
  }
  sentKeys.add(dedupeKey);

  const emails = [config.partner1NotificationEmail, config.partner2NotificationEmail].filter((e): e is string => !!e);
  if (!emails.length) return { sent: false, reason: 'No emails configured' };

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  await Promise.all(
    emails.map((to) =>
      sgMail.send({
        from: process.env.SENDGRID_FROM_EMAIL!,
        to,
        subject: '🌟 ¡Recuerda tus hábitos de hoy!',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; color: #fff; border-radius: 16px;">
            <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">💑 Hábitos en Pareja</h1>
            <p style="color: #9ca3af; margin: 0 0 24px;">¡Hola! Es hora de revisar los hábitos del día.</p>
            <div style="background: #1A1A24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 16px; color: #e5e7eb;">
                <strong style="color: ${config.partner1AvatarColor}">${config.partner1Name}</strong> y
                <strong style="color: ${config.partner2AvatarColor}"> ${config.partner2Name}</strong>,
                ¿ya completaron sus hábitos de hoy?
              </p>
            </div>
            <a href="https://app-habitos-production-5e3c.up.railway.app/home"
               style="display: block; text-align: center; background: linear-gradient(135deg, ${config.partner1AvatarColor}, ${config.partner2AvatarColor}); color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Abrir la app →
            </a>
            <p style="color: #4b5563; font-size: 12px; text-align: center; margin-top: 24px;">
              Hábitos en Pareja · Construyan rutinas juntos
            </p>
          </div>
        `,
      })
    )
  );

  return { sent: true, to: emails };
}
