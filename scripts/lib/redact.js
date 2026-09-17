/**
 * Strip credentials out of text before it is logged or sent somewhere.
 *
 * Several integrations carry the credential in the request path or query
 * (Telegram puts the bot token in the URL), so an error string produced deep
 * inside fetch/undici can contain a live secret. Scripts run in public GitHub
 * Actions logs and push error text into Telegram messages, so scrub on the way
 * out rather than trusting every upstream error to be clean.
 */

import { env } from './config.js';

/** Secrets to scrub verbatim wherever they appear. */
const SECRET_VALUES = () =>
  [
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHAT_ID,
    env.GROQ_API_KEY,
    env.GROQ_PARSER_API_KEY,
    env.FIRECRAWL_API_KEY,
    env.SUPABASE_SERVICE_KEY,
    env.OLLAMA_API_KEY,
    env.VERCEL_TOKEN,
  ].filter((value) => typeof value === 'string' && value.length >= 8);

/** Shapes worth catching even when the value did not come from our own env. */
const SECRET_PATTERNS = [
  [/bot\d{5,}:[A-Za-z0-9_-]{20,}/g, 'bot***'], // Telegram token in a URL path
  [/\b\d{6,12}:AA[A-Za-z0-9_-]{30,}\b/g, '***'], // bare Telegram bot token
  [/\bgsk_[A-Za-z0-9]{20,}\b/g, 'gsk_***'], // Groq API key
  [/\bfc-[A-Za-z0-9]{20,}\b/g, 'fc-***'], // Firecrawl API key
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '***jwt***'], // Supabase/JWT
];

/**
 * @param {unknown} value - Error, string, or anything stringifiable.
 * @returns {string} The text with known secrets replaced by `***`.
 */
export function redactSecrets(value) {
  if (value === null || value === undefined) return String(value);

  let text =
    typeof value === 'string'
      ? value
      : String(value?.stack || value?.message || value);

  for (const secret of SECRET_VALUES()) {
    text = text.split(secret).join('***');
  }

  for (const [pattern, replacement] of SECRET_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  return text;
}
