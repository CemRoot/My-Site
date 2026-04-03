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
else if (hasUnsavedActionable) statusEmoji = '⚠️';

const allInDb =
  saved === 0 &&
  (metrics.newAfterDbCheck || 0) === 0 &&
  (metrics.alreadyInDb || 0) > 0;

const headline =
  saved > 0
    ? 'Tech news scraper — saves complete'
    : hasUnsavedActionable
      ? 'Tech news scraper — new candidates not saved'
      : allInDb
        ? 'Tech news scraper — all candidates already in DB'
        : 'Tech news scraper — run complete';

const scraper = escapeTelegramHtml(report.scraper || 'unknown');
const runLabel = report.runLabel ? escapeTelegramHtml(report.runLabel) : '';

const line = (label, value) =>
  `${escapeTelegramHtml(label)} <code>${escapeTelegramHtml(String(value))}</code>`;

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
  `${statusEmoji} <b>${escapeTelegramHtml(headline)}</b>`,
  '———————————————',
  line('Saved', saved),
  line('New after DB check', metrics.newAfterDbCheck || 0),
  line('Today candidates', metrics.todayCandidates || 0),
  line('Recent stale', metrics.recentStaleCandidates || 0),
  line('Unknown candidates', metrics.unknownCandidates || 0),
];

blocks.push(
  line('Already in DB', metrics.alreadyInDb || 0),
  line('Future rejected', metrics.futureRejected || 0),
  line('Date mismatch rejected', metrics.rejectedDateMismatch || 0),
  line('Stale skipped', metrics.staleSkipped || 0),
  line('Deferred', metrics.deferred || 0),
  line('Failed', failed),
  '———————————————',
  `<b>Scraper</b> ${scraper}`,
);

if (runLabel) {
  blocks.push(`<b>Run label</b> <code>${runLabel}</code>`);
}

if (saved === 0) {
  const batches = report.batches || {};
  const failedReasons = summarizeBatchReasons(batches.failed);
  const rejectedReasons = summarizeBatchReasons(batches.rejected);
  const deferredReasons = summarizeBatchReasons(batches.deferred);
  const skippedReasons = summarizeBatchReasons(batches.skipped);

  const reasonLines = [];
  if (failedReasons.length) reasonLines.push(line('Failed reasons', failedReasons.join(', ')));
  if (rejectedReasons.length) reasonLines.push(line('Rejected reasons', rejectedReasons.join(', ')));
  if (deferredReasons.length) reasonLines.push(line('Deferred reasons', deferredReasons.join(', ')));
  if (skippedReasons.length) reasonLines.push(line('Skipped reasons', skippedReasons.join(', ')));

  if (reasonLines.length) {
    blocks.push('———————————————', '<b>Unsaved reasons</b>', ...reasonLines);
  }
}

const message = blocks.join('\n');
process.stdout.write(message);
