import { supabase } from '../supabaseAdmin.js';
import { env } from '../config.js';
import { sendTelegramMessage, callTelegramApi } from '../../../lib/telegram.js';

export function createTelegramOpsDeps() {
  return {
    sendTelegramMessage,
    callTelegramApi,
    supabase,
    env,
    config: {
      GROQ_API_KEY: env.GROQ_API_KEY,
      FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_REPO: process.env.GITHUB_REPOSITORY || 'username/My-Site',
    },
  };
}
