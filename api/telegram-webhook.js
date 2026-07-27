/**
 * Telegram Webhook Handler
 *
 * Thin Vercel entry: auth + CORS + UpdateRouter.
 * Domain logic lives in scripts/lib/telegram-ops/ — see README there.
 *
 * Optional: TELEGRAM_WEBHOOK_SECRET must match setWebhook(secret_token).
 */

import { createTelegramOpsBot } from '../scripts/lib/telegram-ops/TelegramOpsBot.js';
import { UpdateRouter } from '../scripts/lib/telegram-ops/routers/UpdateRouter.js';

const bot = createTelegramOpsBot();
const router = new UpdateRouter(bot);

export default async function handler(req, res) {
  const ALLOWED_ORIGINS = [
    'https://cemkoyluoglu.codes',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  if (!router.webhookSecretOk(req)) {
    console.warn('Telegram webhook: rejected (missing or invalid X-Telegram-Bot-Api-Secret-Token)');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const update = req.body;

    console.log('📱 Telegram webhook received:', {
      updateId: update?.update_id,
      type: update?.callback_query
        ? 'callback_query'
        : update?.message
          ? 'message'
          : 'unknown',
    });

    const result = await router.handle(update);
    const status = result.httpStatus || 200;
    return res.status(status).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('❌ Telegram webhook error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
