/**
 * Centralized configuration for the news scraper pipeline.
 */

import { env } from '../config.js';

export const SCRAPER_CONFIG = {
  CATEGORIES: [
    { name: 'AI Applications', url: 'https://nuvemmag.com/category/yapay-zeka-uygulamalari', tag: 'AI Applications' },
    { name: 'Latest News', url: 'https://nuvemmag.com/category/en-son-haberler', tag: 'Latest News' },
    { name: 'Artificial Intelligence', url: 'https://nuvemmag.com/category/yapay-zeka', tag: 'AI' },
    { name: 'Technology', url: 'https://nuvemmag.com/category/teknoloji', tag: 'Tech' },
    { name: 'Sustainability', url: 'https://nuvemmag.com/category/surdurulebilirlik', tag: 'Sustainability' },
    { name: 'Science & World', url: 'https://nuvemmag.com/category/bilim-ve-dunya', tag: 'Science' },
    { name: 'Agenda', url: 'https://nuvemmag.com/category/gundem', tag: 'News' },
  ],
  FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
  GROQ_API_KEY: env.GROQ_API_KEY,
  GROQ_PARSER_API_KEY: env.GROQ_PARSER_API_KEY,
  MAX_ARTICLES_PER_CATEGORY: 20,
  TRANSLATION_DELAY: 1000,
  RATE_LIMIT_DELAY: 10000,
  MAX_ARTICLES_PER_RUN: 50,
  MAX_RETRIES: 2,
  MAX_CONSECUTIVE_FAILURES: 3,
};

export const GROQ_PRIMARY_MODEL = 'llama-3.1-8b-instant';
export const GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';
export const GROQ_LAST_RESORT_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_ENHANCEMENT_MODEL = 'llama-3.1-8b-instant';
