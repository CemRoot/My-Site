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
   * Rows taken from each category list (newest first on NuvemMag). Increased to
   * 25 to reduce the chance of missing recent articles when a category has many
   * same-day posts.
   */
  MAX_ARTICLES_PER_CATEGORY: 25,
  /**
   * Number of archive pages to check per category. Set to 2 so articles that
   * appear below the first ~17 posts on the category listing are still discovered.
   * Keep low to control Firecrawl credit usage.
   */
  CATEGORY_ARCHIVE_MAX_PAGES: 2,
  /**
   * Publish/discovery dates older than this (calendar days) are skipped — aligns
   * with "top of feed" scraping. Widened to 5 days so articles missed in a
   * previous run (due to the discovery cap) are still picked up on the next pass.
   */
  MAX_RECENT_PUBLISH_DAYS: 5,
  TRANSLATION_DELAY: 1000,
  RATE_LIMIT_DELAY: 10000,
  MAX_ARTICLES_PER_RUN: 50,
  MAX_RETRIES: 2,
  MAX_CONSECUTIVE_FAILURES: 3,
};

// Model tiering intentionally starts with the lightweight, high-throughput
// openai/gpt-oss-20b so a full run does not exhaust the daily token budget
// (TPD) on the heavy 70B model. The 70B model is kept only as a last resort for
// quality. This matches the tiering documented in scrape-tech-news.yml.
// NOTE: llama-3.1-8b-instant was decommissioned by Groq on 2026-08-16; every
// tier that used it now points at openai/gpt-oss-20b, Groq's recommended
// replacement. The cascade in translator.js de-duplicates repeated entries.
export const GROQ_PRIMARY_MODEL = 'openai/gpt-oss-20b';
export const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_LAST_RESORT_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_ENHANCEMENT_MODEL = 'openai/gpt-oss-20b';
export const GROQ_FAST_MODEL = 'openai/gpt-oss-20b';
export const GROQ_PARSER_MODEL = 'openai/gpt-oss-20b';

export const OLLAMA_PRIMARY_MODEL = 'deepseek-v4-pro:cloud';
export const OLLAMA_API_KEY = env.OLLAMA_API_KEY;
