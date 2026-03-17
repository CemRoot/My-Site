/**
 * Shared environment configuration for all scripts.
 *
 * Usage:
 *   import { env } from './lib/config.js';
 *   console.log(env.SUPABASE_URL);
 */

import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_PARSER_API_KEY: process.env.GROQ_PARSER_API_KEY || process.env.GROQ_API_KEY || '',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  VERCEL_URL: process.env.VERCEL_URL || '',
  VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || '',
  SITE_URL: process.env.SITE_URL || process.env.VERCEL_URL || 'https://cemkoyluoglu.codes',
};
