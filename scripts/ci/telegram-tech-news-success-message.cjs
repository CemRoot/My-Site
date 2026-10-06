/**
 * GitHub Actions: reads latest tech-news run report JSON and prints HTML for Telegram.
 * Env: REPORT_PATH (required) — path to tech-news-scrape-run-*.json
 */
'use strict';

const fs = require('fs');
const { escapeTelegramHtml } = require('./telegram-html-escape.cjs');

const reportPath = process.env.REPORT_PATH;
if (!reportPath) {
  console.error('REPORT_PATH is required');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const metrics = report.metrics || {};
const saved = metrics.saved || 0;
const failed =
  metrics.failed ||
  (metrics.scrapeFailed || 0) +
    (metrics.translationFailed || 0) +
    (metrics.saveFailed || 0);
const hasUnsavedActionable =
  saved === 0 && (metrics.newAfterDbCheck || 0) > 0;

let statusEmoji = saved > 0 ? '✅' : 'ℹ️';
if (failed > 0 && saved === 0) statusEmoji = '❌';
else if (failed > 0 || hasUnsavedActionable) statusEmoji = '⚠️';

const allInDb =
  saved === 0 &&
  (metrics.newAfterDbCheck || 0) === 0 &&
  (metrics.alreadyInDb || 0) > 0;

const headline =
  saved > 0
    ? failed > 0
      ? 'News Scraper — Saved, Some Articles Failed'
      : 'News Scraper — Saved Successfully'
    : hasUnsavedActionable
      ? 'News Scraper — No New Articles Saved'
      : allInDb
        ? 'News Scraper — All Found Articles Are In DB'
        : 'News Scraper — Run Completed';

const scraper = escapeTelegramHtml(report.scraper || 'unknown');
// Free-plan Firecrawl runs dry before its monthly refresh; cheerio takes over.
const scraperNote = report.firecrawlExhausted ? ' (Firecrawl credits exhausted)' : '';
const runLabel = report.runLabel ? escapeTelegramHtml(report.runLabel) : '';

const line = (label, value) =>
  `• ${escapeTelegramHtml(label)}: <b>${escapeTelegramHtml(String(value))}</b>`;

/**
 * Summarize batch reasons as "REASON (count)" strings.
 * Uses reasonCode first, then stage, then reason text; sorts by count desc then reason asc.
 */
function summarizeBatchReasons(items, limit = 3) {
  const counts = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    // Run artifacts may have reasonCode (preferred), stage, or free-text reason depending on pipeline stage.
    const key = item?.reasonCode || item?.stage || item?.reason || 'UNSPECIFIED';
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    // Show the most frequent causes first; tie-break alphabetically for stable output.
    .sort((a, b) => {
      const countDiff = b[1] - a[1];
      return countDiff !== 0 ? countDiff : a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([reason, count]) => `${reason} (${count})`);
}

const blocks = [
  `${statusEmoji} <b>${escapeTelegramHtml(headline)}</b>\n`,
  '📊 <b>Processing Summary</b>',
  line('Saved', saved),
  line('Found Today', metrics.todayCandidates || 0),
  line('Found Recent (Stale)', metrics.recentStaleCandidates || 0),
  line('New after DB Check', metrics.newAfterDbCheck || 0),
  '',
  '📉 <b>Rejected / Skipped</b>',
  line('Already in DB', metrics.alreadyInDb || 0),
  line('Skipped (Too Old)', metrics.staleSkipped || 0),
  line('Rejected (Date Mismatch)', metrics.rejectedDateMismatch || 0),
  line('Rejected (Future Date)', metrics.futureRejected || 0),
  line('Deferred', metrics.deferred || 0),
  line('Failed', failed),
  '',
  '⚙️ <b>System Info</b>',
  `• Scraper: <code>${scraper}</code>${scraperNote}`,
];

if (runLabel) {
  blocks.push(`• Run Label: <code>${runLabel}</code>`);
}

// Name each failed article so a failure is traceable without opening the
// Actions log (failures used to arrive as separate, anonymous Telegram pings).
const failedItems = Array.isArray(report.batches?.failed) ? report.batches.failed : [];
if (failedItems.length) {
  const shown = failedItems.slice(0, 5).map((item) => {
    const label = escapeTelegramHtml(item.title || item.url || 'unknown article');
    const link = item.url ? `<a href="${escapeTelegramHtml(item.url)}">${label}</a>` : label;
    const reason = escapeTelegramHtml(String(item.reason || item.reasonCode || '').slice(0, 160));
    return `• ${link}\n  <code>${escapeTelegramHtml(item.reasonCode || item.stage || 'FAILED')}</code> ${reason}`;
  });
  if (failedItems.length > shown.length) {
    shown.push(`• …and ${failedItems.length - shown.length} more`);
  }
  blocks.push('', '❌ <b>Failed Articles</b>', ...shown);
}

if (saved === 0) {
  const batches = report.batches || {};
  const failedReasons = summarizeBatchReasons(batches.failed);
  const rejectedReasons = summarizeBatchReasons(batches.rejected);
  const deferredReasons = summarizeBatchReasons(batches.deferred);
  const skippedReasons = summarizeBatchReasons(batches.skipped);

  const reasonLines = [];
  if (failedReasons.length) reasonLines.push(`• Failed: ${failedReasons.join(', ')}`);
  if (rejectedReasons.length) reasonLines.push(`• Rejected: ${rejectedReasons.join(', ')}`);
  if (deferredReasons.length) reasonLines.push(`• Deferred: ${deferredReasons.join(', ')}`);
  if (skippedReasons.length) reasonLines.push(`• Skipped: ${skippedReasons.join(', ')}`);

  if (reasonLines.length) {
    blocks.push('', '📝 <b>Reasons for 0 Saves</b>', ...reasonLines);
  }
}

const message = blocks.join('\n');
process.stdout.write(message);
