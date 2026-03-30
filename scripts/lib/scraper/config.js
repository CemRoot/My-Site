/**
 * Centralized configuration for the news scraper pipeline.
 */

import { env } from '../config.js';

export const SCRAPER_CONFIG = {
  CATEGORIES: [
    { name: 'AI Applications', slug: 'yapay-zeka-uygulamalari', url: 'https://nuvemmag.com/category/yapay-zeka-uygulamalari', tag: 'AI Applications' },
    { name: 'Artificial Intelligence', slug: 'yapay-zeka', url: 'https://nuvemmag.com/category/yapay-zeka', tag: 'AI' },
    { name: 'Technology', slug: 'teknoloji', url: 'https://nuvemmag.com/category/teknoloji', tag: 'Tech' },
    { name: 'Agenda', slug: 'gundem', url: 'https://nuvemmag.com/category/gundem', tag: 'News' },
    { name: 'Sustainability', slug: 'surdurulebilirlik', url: 'https://nuvemmag.com/category/surdurulebilirlik', tag: 'Sustainability' },
    { name: 'Science & World', slug: 'bilim-ve-dunya', url: 'https://nuvemmag.com/category/bilim-ve-dunya', tag: 'Science' },
  ],
  FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
  GROQ_API_KEY: env.GROQ_API_KEY,
  GROQ_PARSER_API_KEY: env.GROQ_PARSER_API_KEY,
  /**
   * Rows taken from each category list (newest first on NuvemMag). No need to walk old pages
   * when we only care about very recent news.
   */
  MAX_ARTICLES_PER_CATEGORY: 12,
  /** Only first page per category unless you explicitly need older archive pages. */
  CATEGORY_ARCHIVE_MAX_PAGES: 1,
  /**
   * Publish/discovery dates older than this (calendar days) are skipped — aligns with
   * “top of feed only” scraping.
   */
  MAX_RECENT_PUBLISH_DAYS: 3,
  TRANSLATION_DELAY: 1000,
  RATE_LIMIT_DELAY: 10000,
  MAX_ARTICLES_PER_RUN: 50,
  MAX_RETRIES: 2,
  MAX_CONSECUTIVE_FAILURES: 3,
};

export const GROQ_PRIMARY_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';
export const GROQ_LAST_RESORT_MODEL = 'llama-3.1-8b-instant';
export const GROQ_ENHANCEMENT_MODEL = 'llama-3.1-8b-instant';
export const GROQ_FAST_MODEL = 'llama-3.1-8b-instant';

export const OLLAMA_PRIMARY_MODEL = 'gemini-3-flash-preview:cloud';
export const OLLAMA_API_KEY = env.OLLAMA_API_KEY;
