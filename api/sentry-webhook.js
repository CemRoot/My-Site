/**
 * Sentry → Telegram bridge
 *
 * Sentry has no native Telegram integration, so a Sentry Internal Integration
 * posts its webhooks here and they are forwarded to the Telegram bot.
 *
 * Setup in Sentry:
 * 1. Settings → Developer Settings → Custom Integrations → Create New → Internal Integration
 * 2. Webhook URL: https://cemkoyluoglu.tech/api/sentry-webhook?secret=<SENTRY_WEBHOOK_SECRET>
 * 3. Enable "Alert Rule Action", give Issue & Event "Read", tick the "issue" webhook
 * 4. Set SENTRY_WEBHOOK_SECRET in Vercel to the same value
 */

import crypto from 'crypto';
import { sendTelegramMessage } from '../lib/telegram.js';
import { formatSentryTelegramMessage } from '../lib/sentryTelegram.js';

function isAuthorized(provided, expected) {
  const providedBuf = Buffer.from(String(provided || ''));
  const expectedBuf = Buffer.from(expected);
  return providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/*
  Not wrapped in withSentry: a failure here would be reported to Sentry, which
  would call this webhook again — a loop when Telegram itself is the problem.
*/
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = (process.env.SENTRY_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    console.error('⚠️ SENTRY_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!isAuthorized(req.query.secret, secret)) {
    console.warn('⚠️ Invalid Sentry webhook secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resource = req.headers['sentry-hook-resource'];
  const message = formatSentryTelegramMessage(resource, req.body);

  if (!message) {
    return res.status(200).json({ success: true, skipped: true, resource: resource || null });
  }

  try {
    await sendTelegramMessage(message);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Sentry → Telegram forwarding failed:', error.message);
    // 502 so the failure is visible in Sentry's webhook request log.
    return res.status(502).json({ error: 'Telegram delivery failed' });
  }
}
