/**
 * GitHub Actions: build Telegram HTML for scraper failure notification.
 * Env: FAILURE_LOG_URL (full URL to the workflow run)
 */
'use strict';

const { escapeTelegramHtml } = require('./telegram-html-escape.cjs');

const logUrl = process.env.FAILURE_LOG_URL || '';
const currentTime = process.env.FAILURE_TIME_UTC || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

const safeUrl = escapeTelegramHtml(logUrl);
const safeTime = escapeTelegramHtml(currentTime);

const lines = [
  '🚨 <b>News Scraper Failed</b>',
  '',
  '❌ The GitHub Actions scraper workflow encountered a critical error.',
  '',
  `• <b>Time:</b> <code>${safeTime}</code>`,
  `• <b>Workflow:</b> Scrape Tech News`,
  '',
  '🔍 <b>Likely Causes:</b>',
  '• API limits reached (Firecrawl / Groq)',
  '• Database connection issues',
  '• Upstream site blocked the scraper',
  '• Translation quality checks failed',
  '',
  logUrl ? `🔗 <a href="${safeUrl}">View GitHub Actions Logs</a>` : '',
  '',
  '<i>Check the logs to find the exact issue.</i>',
];

process.stdout.write(lines.filter(Boolean).join('\n'));
