export interface DlqAlertPayload {
  jobId: string;
  userId: string;
  queueTier: string;
  attemptsMade: number;
  errorMessage: string;
  stackTrace?: string;
  failedAt: string;
  context?: Record<string, any>;
}

/**
 * Automated DLQ Incident Alert Dispatcher
 * Sends structured JSON payloads to webhook endpoints (Slack, Discord, Sentry, PagerDuty).
 */
export async function dispatchDlqAlert(payload: DlqAlertPayload): Promise<boolean> {
  const webhookUrl = process.env.DLQ_ALERT_WEBHOOK_URL || process.env.SENTRY_DSN;

  console.error('====================================================');
  console.error(`[DLQ Incident Alert] Job Failed Exhausting Retries: ${payload.jobId}`);
  console.error(`[DLQ Incident Alert] User ID: ${payload.userId} | Queue: ${payload.queueTier}`);
  console.error(`[DLQ Incident Alert] Error: ${payload.errorMessage}`);
  if (payload.stackTrace) {
    console.error(`[DLQ Incident Alert] Stack:\n${payload.stackTrace}`);
  }
  console.error('====================================================');

  if (!webhookUrl) {
    console.log('[DLQ Incident Alert] No DLQ_ALERT_WEBHOOK_URL configured; alert logged to stdout.');
    return false;
  }

  try {
    const slackFormattedBody = {
      text: `🚨 *DLQ Render Job Failure Alert* - \`${payload.jobId}\``,
      attachments: [
        {
          color: '#FF0000',
          fields: [
            { title: 'Job ID', value: payload.jobId, short: true },
            { title: 'User ID', value: payload.userId, short: true },
            { title: 'Queue Tier', value: payload.queueTier, short: true },
            { title: 'Attempts Made', value: `${payload.attemptsMade}`, short: true },
            { title: 'Error Message', value: payload.errorMessage, short: false },
          ],
          ts: Math.floor(new Date(payload.failedAt).getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackFormattedBody),
    });

    return response.ok;
  } catch (err: any) {
    console.warn('[DLQ Incident Alert] Dispatch failed:', err?.message || err);
    return false;
  }
}
