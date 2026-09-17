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
 *
 * Transient failures (network errors, 5xx, 429) are retried with exponential
 * backoff: api.telegram.org occasionally times out from GitHub runners and a
 * single ETIMEDOUT used to mark an otherwise successful workflow as failed.
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

const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendOnce() {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: !allowPreview,
    }),
    signal: AbortSignal.timeout(20000),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.ok) {
    const err = new Error(
      `Telegram API failed (HTTP ${res.status}): ${data.description || 'no description'}`
    );
    // 429 and 5xx are worth another attempt; 4xx (bad token, bad HTML) is not.
    err.retryable = res.status === 429 || res.status >= 500;
    err.retryAfterMs = data.parameters?.retry_after
      ? data.parameters.retry_after * 1000
      : null;
    throw err;
  }

  return data;
}

async function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const data = await sendOnce();
      console.log('github-send-telegram: ok, message_id=', data.result?.message_id);
      return;
    } catch (err) {
      // fetch/undici network errors have no `retryable` flag — treat them as transient.
      const retryable = err.retryable !== false;
      const isLast = attempt === MAX_ATTEMPTS;

      console.error(
        `github-send-telegram: attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
        err.message || err
      );

      if (!retryable || isLast) {
        if (err.cause) console.error('github-send-telegram: cause:', err.cause);
        process.exit(1);
      }

      const waitMs = err.retryAfterMs ?? RETRY_BASE_MS * 2 ** (attempt - 1);
      console.error(`github-send-telegram: retrying in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
}

main().catch((err) => {
  console.error('github-send-telegram:', err);
  process.exit(1);
});
