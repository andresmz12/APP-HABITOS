export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { default: cron } = await import('node-cron');
  const { sendScheduledNotification } = await import('@/lib/sendNotification');

  // Run every minute and check if it matches a configured notification time
  cron.schedule('* * * * *', async () => {
    try {
      await sendScheduledNotification();
    } catch (err) {
      console.error('[cron] Error sending notification:', err);
    }
  });

  console.log('[cron] Notification scheduler started');
}
