/**
 * Shared Telegram utilities for API routes (Vercel serverless functions).
 * Token/chat_id are read at call time and trimmed — secret line breaks in Vercel otherwise cause 401.
 */

const TELEGRAM_BOT_TOKEN = () => (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_CHAT_ID = () => (process.env.TELEGRAM_CHAT_ID || '').trim();

function telegramHint(status, bodyText) {
  if (status === 401) {
    return (
      ' (Vercel’deki TELEGRAM_BOT_TOKEN geçersiz veya iptal edilmiş olabilir; BotFather’daki token ile ' +
      'Settings → Environment Variables değerini eşleştir, Production için Redeploy yap. Webhook’u lokal ' +
      'token ile kurduysan Vercel’deki token da aynı olmalı.)'
    );
  }
  if (status === 400 && /chat not found|chat_id is empty/i.test(bodyText || '')) {
    return ' (TELEGRAM_CHAT_ID yanlış olabilir; özel sohbet / grup id’sini kontrol et.)';
  }
  return '';
}

/**
 * Send a Telegram message. Throws on failure.
 * @param {string} text - HTML-formatted message.
 * @param {Record<string, unknown>} options - Extra payload fields.
 * @returns {Promise<object>} Telegram API `result` (e.g. message with message_id).
 */
export async function sendTelegramMessage(text, options = {}) {
  const token = TELEGRAM_BOT_TOKEN();
  const chatId = TELEGRAM_CHAT_ID();

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing (set in Vercel / .env)');
  }
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID is missing (set in Vercel / .env)');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options,
    }),
  });

  const bodyText = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    data = null;
  }

  if (!response.ok || !data || !data.ok) {
    const desc = data?.description || bodyText;
    throw new Error(
      `Telegram API ${response.status}: ${desc}${telegramHint(response.status, bodyText)}`,
    );
  }

  return data.result;
}

/**
 * Fire-and-forget notification. Never throws.
 * @param {string} text - HTML-formatted message.
 */
export async function notifyTelegram(text) {
  const token = TELEGRAM_BOT_TOKEN();
  const chatId = TELEGRAM_CHAT_ID();

  if (!token || !chatId) {
    console.log('⚠️ Telegram credentials not configured, skipping notification');
    return;
  }

  try {
    await sendTelegramMessage(text);
  } catch (error) {
    console.error('⚠️ Telegram notification failed:', error.message);
  }
}

/**
 * Call an arbitrary Telegram Bot API method.
 * @param {string} method - e.g. "answerCallbackQuery", "editMessageText"
 * @param {Record<string, unknown>} payload - JSON body.
 */
export async function callTelegramApi(method, payload = {}) {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing (set in Vercel / .env)');
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text().catch(() => '');
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    data = null;
  }

  if (!response.ok || !data || !data.ok) {
    const desc = data?.description || bodyText;
    throw new Error(
      `Telegram ${method} ${response.status}: ${desc}${telegramHint(response.status, bodyText)}`,
    );
  }

  return data;
}
