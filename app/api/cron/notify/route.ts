import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  // Protect with a secret header so only cron-job.org can trigger this
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const config = await prisma.appConfig.findUnique({ where: { id: 'app' } });
    if (!config || !config.notificationEmail) {
      return NextResponse.json({ sent: false, reason: 'No email configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Hábitos en Pareja <onboarding@resend.dev>',
      to: config.notificationEmail,
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
    });

    return NextResponse.json({ sent: true, to: config.notificationEmail });
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
