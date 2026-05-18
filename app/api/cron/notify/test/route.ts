import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import sgMail from '@sendgrid/mail';

// Test endpoint: sends email immediately, no time check, no auth
// DELETE THIS FILE after confirming emails work
export async function POST(req: NextRequest) {
  const { to } = await req.json().catch(() => ({}));

  try {
    const config = await prisma.appConfig.findUnique({ where: { id: 'app' } });

    const emails: string[] = to
      ? [to]
      : [config?.partner1NotificationEmail, config?.partner2NotificationEmail].filter((e): e is string => !!e);

    if (!emails.length) {
      return NextResponse.json({ error: 'No emails. Pass { "to": "email@example.com" } in body or configure emails in settings.' }, { status: 400 });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    await Promise.all(
      emails.map((address) =>
        sgMail.send({
          from: process.env.SENDGRID_FROM_EMAIL!,
          to: address,
          subject: '🧪 Test - Hábitos en Pareja',
          html: `<p>Si recibes esto, SendGrid está funcionando correctamente.</p><p>From: ${process.env.SENDGRID_FROM_EMAIL}</p>`,
        })
      )
    );

    return NextResponse.json({ sent: true, to: emails, from: process.env.SENDGRID_FROM_EMAIL });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: 'Failed to send', detail }, { status: 500 });
  }
}
