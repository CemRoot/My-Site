/**
 * Shared environment configuration for all scripts.
 *
 * Usage:
 *   import { env } from './lib/config.js';
 *   console.log(env.SUPABASE_URL);
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_PARSER_API_KEY: process.env.GROQ_PARSER_API_KEY || process.env.GROQ_API_KEY || '',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  OLLAMA_API_KEY: process.env.OLLAMA_API_KEY || '',
  VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  VERCEL_URL: process.env.VERCEL_URL || '',
  VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || '',
  SITE_URL: process.env.SITE_URL || process.env.VERCEL_URL || 'https://cemkoyluoglu.codes',
};

export const paths = {
  PROJECT_ROOT,
  TECH_NEWS_ARTIFACTS_DIR: path.join(PROJECT_ROOT, 'artifacts', 'tech-news-runs'),
};

export function resolveProjectPath(...segments) {
  return path.join(PROJECT_ROOT, ...segments);
}

export function resolveArtifactPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : resolveProjectPath(filePath);
}

export async function writeJsonArtifact(prefix, payload, directory = paths.TECH_NEWS_ARTIFACTS_DIR) {
  await fs.mkdir(directory, { recursive: true });

  const safePrefix = String(prefix || 'artifact')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(directory, `${safePrefix}-${timestamp}.json`);

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  return outputPath;
}
