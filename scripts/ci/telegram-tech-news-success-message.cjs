/**
 * GitHub Actions: reads latest tech-news run report JSON and prints HTML for Telegram.
 * Env: REPORT_PATH (required) — path to tech-news-scrape-run-*.json
 */
'use strict';

const fs = require('fs');

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
  saved === 0 &&
  ((metrics.newAfterDbCheck || 0) > 0 ||
    (metrics.todayCandidates || 0) > 0 ||
    (metrics.verifiedUnknown || 0) > 0);

let statusEmoji = saved > 0 ? '✅' : 'ℹ️';
if (failed > 0 && saved === 0) statusEmoji = '❌';
else if (hasUnsavedActionable) statusEmoji = '⚠️';

const headline =
  saved > 0
    ? 'TECH NEWS SCRAPER - KAYITLAR TAMAMLANDI'
    : hasUnsavedActionable
      ? 'TECH NEWS SCRAPER - YENI ADAYLAR KAYDEDILMEDI'
      : 'TECH NEWS SCRAPER - TAMAMLANDI';

const lines = [
  `${statusEmoji} <b>${headline}</b>`,
  '',
  `📰 Kaydedildi: ${saved}`,
  `🆕 DB sonrasi yeni aday: ${metrics.newAfterDbCheck || 0}`,
  `📅 Bugun aday: ${metrics.todayCandidates || 0} | Bilinmeyen: ${metrics.unknownCandidates || 0}`,
  `🗂️ DB'de vardi: ${metrics.alreadyInDb || 0} | Bayat: ${metrics.staleSkipped || 0} | Ertelendi: ${metrics.deferred || 0}`,
  `❌ Basarisiz: ${failed}`,
  `🔧 Scraper: ${report.scraper || 'unknown'}${report.runLabel ? ` | 🏷️ ${report.runLabel}` : ''}`,
];

process.stdout.write(lines.join('\n'));
