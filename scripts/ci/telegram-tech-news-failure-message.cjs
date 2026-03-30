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
  '🚨 <b>Tech news scraper — failed</b>',
  '———————————————',
  `<b>Time</b> <code>${safeTime}</code>`,
  `<b>Workflow</b> Scrape Tech News`,
  '',
  '<b>Likely causes</b>',
  '• API keys or quotas (scraping / LLM)',
  '• Database connectivity',
  '• Upstream site or rate limits',
  '• Date or quality checks',
  '',
  logUrl ? `<a href="${safeUrl}">Open run logs</a>` : '',
  '',
  '<i>Check the workflow run for details.</i>',
];

process.stdout.write(lines.filter(Boolean).join('\n'));
