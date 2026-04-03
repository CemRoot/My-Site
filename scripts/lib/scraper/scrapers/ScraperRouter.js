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
        const cheerioResult = await this.cheerio.scrapeArticleDetails(url);
        if (cheerioResult == null) {
          return await this._retryWithCanonicalUrl(url);
        }
        return cheerioResult;
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

  /**
   * When a /post/ URL fails with both scrapers, strip the /post/ prefix and
   * retry with the canonical slug-only URL. Many nuvemmag.com articles migrated
   * from /post/<slug>/ to /<slug>/ and the old paths return 404.
   */
  async _retryWithCanonicalUrl(url) {
    try {
      const parsed = new URL(url);
      if (!parsed.pathname.startsWith('/post/')) return null;
      const canonicalPath = parsed.pathname.replace(/^\/post\//, '/');
      const canonicalUrl = `${parsed.origin}${canonicalPath}`;
      console.log(`  🔄 /post/ URL returned null — retrying with canonical: ${canonicalUrl}`);
      const scraper = this.getActiveScraper();
      const result = await scraper.scrapeArticleDetails(canonicalUrl);
      if (result != null) {
        console.log(`  ✅ Recovered article via canonical URL: ${canonicalUrl}`);
      }
      return result;
    } catch (err) {
      // URL construction or scraper error — not a hard failure; just skip canonical retry
      console.warn(`  ⚠️ Canonical URL retry failed for ${url}: ${err?.message || err}`);
      return null;
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
