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
      const result = await scraper.scrapeArticleList(categoryUrl, categoryTag);
      if (result.length === 0 && scraper === this.firecrawl) {
        console.log(`  🔄 Firecrawl returned 0 articles for ${categoryTag}, trying cheerio fallback...`);
        return await this.cheerio.scrapeArticleList(categoryUrl, categoryTag);
      }
      return result;
    } catch (error) {
      if (!this.firecrawlExhausted && scraper === this.firecrawl &&
          this.firecrawl.isFirecrawlExhausted(error, error.statusCode)) {
        await this._handleFirecrawlExhaustion();
        return await this.cheerio.scrapeArticleList(categoryUrl, categoryTag);
      }
      if (scraper === this.firecrawl) {
        console.warn(`  ⚠️ Firecrawl error for ${categoryTag}, trying cheerio fallback: ${error.message}`);
        try {
          return await this.cheerio.scrapeArticleList(categoryUrl, categoryTag);
        } catch (fallbackError) {
          console.error(`  ❌ Cheerio fallback also failed for ${categoryTag}: ${fallbackError.message}`);
          error.message = `Firecrawl: ${error.message} | Cheerio fallback: ${fallbackError.message}`;
        }
      }
      throw error;
    }
  }

  async scrapeArticleDetails(url) {
    const scraper = this.getActiveScraper();
    try {
      const result = await scraper.scrapeArticleDetails(url);
      if (result == null && scraper === this.firecrawl) {
        console.log(`  🔄 Firecrawl returned null for article details, trying cheerio fallback...`);
        return await this.cheerio.scrapeArticleDetails(url);
      }
      return result;
    } catch (error) {
      if (!this.firecrawlExhausted && scraper === this.firecrawl &&
          this.firecrawl.isFirecrawlExhausted(error, error.statusCode)) {
        await this._handleFirecrawlExhaustion();
        return await this.cheerio.scrapeArticleDetails(url);
      }
      if (scraper === this.firecrawl) {
        console.warn(`  ⚠️ Firecrawl error for article details, trying cheerio fallback: ${error.message}`);
        try {
          return await this.cheerio.scrapeArticleDetails(url);
        } catch (fallbackError) {
          console.error(`  ❌ Cheerio fallback also failed: ${fallbackError.message}`);
          error.message = `Firecrawl: ${error.message} | Cheerio fallback: ${fallbackError.message}`;
        }
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
