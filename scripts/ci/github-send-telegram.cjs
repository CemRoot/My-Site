#!/usr/bin/env node
/**
 * GitHub Actions helper: send one HTML message via Telegram Bot API.
 * Exits non-zero on missing env, HTTP error, or Telegram { ok: false }.
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   TELEGRAM_MESSAGE_BODY — full message text (HTML parse_mode)
 *   TELEGRAM_WEB_PAGE_PREVIEW — optional "true" to allow link previews (default: false)
 */

'use strict';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const chatId = process.env.TELEGRAM_CHAT_ID || '';
const text = process.env.TELEGRAM_MESSAGE_BODY || '';
const allowPreview = process.env.TELEGRAM_WEB_PAGE_PREVIEW === 'true';

if (!token || !chatId) {
  console.error('github-send-telegram: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}
if (!text) {
  console.error('github-send-telegram: missing TELEGRAM_MESSAGE_BODY');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: !allowPreview,
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.ok) {
    console.error('github-send-telegram: Telegram API failed', {
      httpStatus: res.status,
      description: data.description,
      error_code: data.error_code,
      body: data,
    });
    process.exit(1);
  }

  console.log('github-send-telegram: ok, message_id=', data.result?.message_id);
}

main().catch((err) => {
  console.error('github-send-telegram:', err);
  process.exit(1);
});
