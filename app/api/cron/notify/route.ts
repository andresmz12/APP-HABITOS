import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledNotification } from '@/lib/sendNotification';

// Manual trigger endpoint (kept for debugging)
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendScheduledNotification();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Failed to send', detail }, { status: 500 });
  }
}
