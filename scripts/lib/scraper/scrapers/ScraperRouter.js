/**
 * ScraperRouter — Routes scraping requests to the best available scraper.
 * Primary: FirecrawlScraper. Fallback: CheerioScraper (auto-switches on credit exhaustion).
 */

import { FirecrawlScraper } from './FirecrawlScraper.js';
import { CheerioScraper } from './CheerioScraper.js';
import { notifyTelegram } from '../../telegram.js';

export class ScraperRouter {
  constructor(firecrawlApiKey) {
    this.firecrawl = new FirecrawlScraper(firecrawlApiKey);
    this.cheerio = new CheerioScraper();
    this.activeScraperName = this.firecrawl.isAvailable() ? 'firecrawl' : 'cheerio';
    this.firecrawlExhausted = false;
  }

  getActiveScraper() {
    if (this.firecrawlExhausted || !this.firecrawl.isAvailable()) {
      return this.cheerio;
    }
    return this.firecrawl;
  }

  async scrapeArticleList(categoryUrl, categoryTag) {
    const scraper = this.getActiveScraper();
    try {
      return await scraper.scrapeArticleList(categoryUrl, categoryTag);
    } catch (error) {
      if (!this.firecrawlExhausted && scraper === this.firecrawl &&
          this.firecrawl.isFirecrawlExhausted(error, error.statusCode)) {
        await this._handleFirecrawlExhaustion();
        return await this.cheerio.scrapeArticleList(categoryUrl, categoryTag);
      }
      throw error;
    }
  }

  async scrapeArticleDetails(url) {
    const scraper = this.getActiveScraper();
    try {
      return await scraper.scrapeArticleDetails(url);
    } catch (error) {
      if (!this.firecrawlExhausted && scraper === this.firecrawl &&
          this.firecrawl.isFirecrawlExhausted(error, error.statusCode)) {
        await this._handleFirecrawlExhaustion();
        return await this.cheerio.scrapeArticleDetails(url);
      }
      throw error;
    }
  }

  async _handleFirecrawlExhaustion() {
    if (this.firecrawlExhausted) return;
    this.firecrawlExhausted = true;
    this.activeScraperName = 'cheerio';
    console.warn('⚠️  Firecrawl credits exhausted — switching to fetch+cheerio');
    await notifyTelegram(
      `⚠️ <b>Firecrawl Kredisi Bitti</b>\n\n` +
      `🔄 Otomatik olarak <b>fetch+cheerio</b> moduna geçildi\n` +
      `💡 Firecrawl hesabını kontrol et ve kredi ekle\n` +
      `⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
    );
  }

  getActiveScraperName() {
    return this.activeScraperName;
  }
}
