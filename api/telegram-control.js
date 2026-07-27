/**
 * Telegram Bot Control API
 *
 * Thin Vercel entry with bearer auth. Actions delegate to TelegramOpsBot.
 * - /api/telegram-control?action=setup-menu
 * - /api/telegram-control?action=send-status
 * - /api/telegram-control?action=trigger-scrape
 * - /api/telegram-control?action=health-check
 */

import crypto from 'crypto';
import { createTelegramOpsBot } from '../scripts/lib/telegram-ops/TelegramOpsBot.js';

const API_SECRET = process.env.TELEGRAM_CONTROL_API_SECRET || '';

function authorize(req) {
  if (!API_SECRET) {
    return { ok: false, status: 500, body: { error: 'Configuration error' } };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      body: {
        success: false,
        error: 'Unauthorized',
        message: 'Bearer token required in Authorization header',
      },
    };
  }

  const providedSecret = authHeader.split(' ')[1];
  let isAuthorized = false;
  try {
    const providedBuffer = Buffer.from(providedSecret || '');
    const expectedBuffer = Buffer.from(API_SECRET);
    if (providedBuffer.length === expectedBuffer.length) {
      isAuthorized = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    }
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return {
      ok: false,
      status: 403,
      body: {
        success: false,
        error: 'Forbidden',
        message: 'Invalid API secret',
      },
    };
  }

  return { ok: true };
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!API_SECRET) {
      console.error('Security violation: TELEGRAM_CONTROL_API_SECRET not set');
    }

    const auth = authorize(req);
    if (!auth.ok) {
      if (auth.status === 401) {
        console.warn('Unauthorized access attempt to telegram-control API');
      } else if (auth.status === 403) {
        console.warn('Invalid API secret provided to telegram-control API');
      }
      return res.status(auth.status).json(auth.body);
    }

    const action = req.query.action || req.body?.action;
    const available = ['setup-menu', 'send-status', 'trigger-scrape', 'health-check'];

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Missing action parameter',
        available_actions: available,
      });
    }

    console.log(`🤖 Telegram Control API: ${action}`);

    const bot = createTelegramOpsBot();
    let result;

    switch (action) {
      case 'setup-menu':
        await bot.setBotCommands();
        await bot.handleStartCommand();
        result = { success: true, message: 'Bot menu setup completed' };
        break;

      case 'send-status':
        await bot.handleStatusAction();
        result = { success: true, message: 'Status report sent' };
        break;

      case 'trigger-scrape':
        await bot.handleScrapeAction();
        result = { success: true, message: 'Scraping workflow triggered' };
        break;

      case 'health-check':
        await bot.handleHealthAction();
        result = { success: true, message: 'Health check completed' };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown action: ${action}`,
          available_actions: available,
        });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Telegram Control API error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
