/**
 * Shared Telegram utilities for API routes (Vercel serverless functions).
 */

const TELEGRAM_BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = () => process.env.TELEGRAM_CHAT_ID || '';

/**
 * Send a Telegram message. Throws on failure.
 * @param {string} text - HTML-formatted message.
 * @param {Record<string, unknown>} options - Extra payload fields.
 */
export async function sendTelegramMessage(text, options = {}) {
  const token = TELEGRAM_BOT_TOKEN();
  const chatId = TELEGRAM_CHAT_ID();

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

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram API ${response.status}: ${body}`);
  }

  return response.json();
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
  const url = `https://api.telegram.org/bot${token}/${method}`;

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
