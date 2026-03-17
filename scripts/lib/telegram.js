/**
 * Shared Telegram messaging utilities for all scripts.
 *
 * sendTelegramMessage  – full-control: returns the API result, throws on error.
 * notifyTelegram       – fire-and-forget: logs but never throws.
 *
 * Usage:
 *   import { sendTelegramMessage, notifyTelegram } from './lib/telegram.js';
 *
 *   // When you need the API response or inline-keyboard options:
 *   const result = await sendTelegramMessage('Hello', { reply_markup: keyboard });
 *
 *   // Simple notification (won't crash the calling script):
 *   await notifyTelegram('Build done ✅');
 */

import { env } from './config.js';

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

/**
 * Send a message via the Telegram Bot API.
 * @param {string} text - Message text (HTML parse_mode).
 * @param {Record<string, unknown>} options - Extra payload fields (reply_markup, etc.).
 * @returns {Promise<object>} The `result` field from the Telegram response.
 */
export async function sendTelegramMessage(text, options = {}) {
  const url = `${TELEGRAM_API_BASE}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram API ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Fire-and-forget notification – never throws, only logs failures.
 * @param {string} text - Message text (HTML parse_mode).
 */
export async function notifyTelegram(text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.log('⚠️  Telegram credentials not configured, skipping notification');
    return;
  }

  try {
    await sendTelegramMessage(text);
  } catch (error) {
    console.error('⚠️  Telegram notification failed:', error.message);
  }
}

/**
 * Call an arbitrary Telegram Bot API method.
 * Useful for answerCallbackQuery, setMyCommands, etc.
 * @param {string} method - API method name (e.g. "answerCallbackQuery").
 * @param {Record<string, unknown>} payload - JSON body.
 * @returns {Promise<object>} Full JSON response from Telegram.
 */
export async function callTelegramApi(method, payload = {}) {
  const url = `${TELEGRAM_API_BASE}/${method}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram ${method} ${response.status}: ${body}`);
  }

  return response.json();
}
