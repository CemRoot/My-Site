/**
 * Abstract base class for all scrapers.
 * Defines the interface that FirecrawlScraper and CheerioScraper must implement.
 */
export class BaseScraper {
  constructor(name) {
    this.name = name;
  }

  async scrapeArticleList(categoryUrl, categoryTag) {
    throw new Error(`${this.name}.scrapeArticleList() not implemented`);
  }

  async scrapeArticleDetails(url) {
    throw new Error(`${this.name}.scrapeArticleDetails() not implemented`);
  }

  isAvailable() {
    return true;
  }
}
