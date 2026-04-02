/**
 * Tech News Scraper — CLI Entry Point
 *
 * Single active pipeline delegates to ScrapeOrchestrator.
 */

import { notifyTelegram } from './lib/telegram.js';
import { runScraperCli } from './lib/scraper/ScrapeOrchestrator.js';

runScraperCli(process.argv).catch(async error => {
  console.error('💥 Fatal error:', error);
  await notifyTelegram(
    `💥 <b>Haber Scraper: Fatal Hata</b>\n\n` +
    `<code>${error.message || 'Bilinmeyen hata'}</code>`
  );
  process.exit(1);
});
