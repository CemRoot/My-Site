/**
 * Tech News Scraper
 * 
 * Scrapes tech news from Nuvemmag, translates to English, and stores in Supabase
 * Features:
 * - Firecrawl integration for web scraping
 * - Groq AI for unlimited, high-quality Turkish to English translation
 * - Supabase PostgreSQL for reliable storage
 * - Duplicate detection using source URL
 * - Smart rate limiting
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { htmlToTokens } from './embeds/extractEmbeds.js';
import { replaceTikTokBlockquote, replaceTwitterBlockquote, cleanSocialEmbedRemnants } from './embeds/cleanMarkdownEmbeds.js';
import { extractAllEmbedsFromMarkdown } from './embeds/extractMarkdownEmbeds.js';
import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt, ARTICLE_ENHANCEMENT_SYSTEM_PROMPT, createArticleEnhancementPrompt } from './translate/prompt.js';
import { assertContentQuality, validateArticleContent } from './validation/contentQualityCheck.js';
import { validateArticle, autoFixArticle, validateDate, validateTitle, validateContent, validateDescription } from './validation/smartArticleProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Returns true if the line contains a URL whose hostname is nuvemmag.com (or a subdomain)
function hasNuvemmagDomain(line) {
  const urlRegex = /(https?:\/\/[^\s)>]+)/ig;
  let match;
  while ((match = urlRegex.exec(line)) !== null) {
    try {
      const urlObj = new URL(match[1]);
      // Accept nuvemmag.com and any subdomain, but not similar-looking domains
      // e.g., nuvemmag.com, www.nuvemmag.com, blog.nuvemmag.com
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === "nuvemmag.com" ||
        hostname.endsWith(".nuvemmag.com")
      ) {
        return true;
      }
    } catch (e) {
      // Ignore invalid URL
    }
  }
  return false;
}

// Configuration
const CONFIG = {
  // All categories to scrape (excluding "Çiçek ile Teknoloji")
  // Priority order: AI Applications first (most articles), then other categories
  // NOTE: Site URL changed from /post/category/ to /category/ (December 2025)
  CATEGORIES: [
    { name: 'AI Applications', url: 'https://nuvemmag.com/category/yapay-zeka-uygulamalari', tag: 'AI Applications' },
    { name: 'Latest News', url: 'https://nuvemmag.com/category/en-son-haberler', tag: 'Latest News' },
    { name: 'Artificial Intelligence', url: 'https://nuvemmag.com/category/yapay-zeka', tag: 'AI' },
    { name: 'Technology', url: 'https://nuvemmag.com/category/teknoloji', tag: 'Tech' },
    { name: 'Sustainability', url: 'https://nuvemmag.com/category/surdurulebilirlik', tag: 'Sustainability' },
    { name: 'Science & World', url: 'https://nuvemmag.com/category/bilim-ve-dunya', tag: 'Science' },
    { name: 'Agenda', url: 'https://nuvemmag.com/category/gundem', tag: 'News' },
  ],
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  // Separate API key for AI parsing (to avoid rate limits on translation key)
  GROQ_PARSER_API_KEY: process.env.GROQ_PARSER_API_KEY || process.env.GROQ_API_KEY || '',
  MAX_ARTICLES_PER_CATEGORY: 20,
  TRANSLATION_DELAY: 1000, // ms between translation requests (increased to avoid rate limits)
  RATE_LIMIT_DELAY: 10000, // 10 seconds between requests (Firecrawl free: 10 req/min = 6s min, +buffer)
  MAX_ARTICLES_PER_RUN: 50, // Safety limit per scraping run
  MAX_RETRIES: 2, // Maximum retry attempts for failed requests (conserve API credits)
  MAX_CONSECUTIVE_FAILURES: 3, // Circuit breaker: stop if too many failures in a row
};

// Initialize Groq client
const groq = new Groq({
  apiKey: CONFIG.GROQ_API_KEY,
});

// Groq translation models (updated to active models)
// Model Strategy (Optimized for Groq Free Tier - Dec 2025):
// - 70b has only 100K tokens/day limit (expensive, use sparingly)
// - 8b-instant has much higher limits (use for bulk translation)
// - Use 70b only for enhancement (TL;DR, highlights) where quality matters most
// Model Strategy (Optimized for Groq Free Tier - Dec 2025):
// - 70b has only 100K tokens/day limit (use sparingly for enhancement)
// - 8b-instant has much higher limits (use for bulk translation)
// - mixtral is reliable backup with good multilingual support
// ============================================
// GROQ AI MODELS - ALL PRODUCTION (STABLE)
// ============================================
// Using only Production models for reliability
// Preview models (llama-4-scout, qwen3) may be discontinued without notice
const GROQ_PRIMARY_MODEL = 'llama-3.1-8b-instant';      // 560 T/s, 250K TPM - Fast & cheap for bulk
const GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';       // 1000 T/s, 250K TPM - Fastest fallback!
const GROQ_LAST_RESORT_MODEL = 'llama-3.3-70b-versatile'; // 280 T/s, 300K TPM - Best quality
const GROQ_ENHANCEMENT_MODEL = 'llama-3.1-8b-instant';   // Use fast model for TL;DR to save quota

// Initialize Supabase client (using service role for admin access)
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

/**
 * Generate unique ID from URL
 */
function generateArticleId(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(message) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    console.log('⚠️  Telegram credentials not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CONFIG.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    
    if (!response.ok) {
      console.error('❌ Telegram notification failed:', await response.text());
    }
  } catch (error) {
    console.error('❌ Telegram notification error:', error);
  }
}

/**
 * Smart retry wrapper for Firecrawl API calls
 * Only retries on specific errors to conserve API credits
 */
async function fetchWithRetry(url, options, context = '') {
  const maxRetries = CONFIG.MAX_RETRIES;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Retry ${attempt - 1}/${maxRetries - 1} for ${context}...`);
      }
      
      const response = await fetch(url, options);
      
      // Success - return immediately
      if (response.ok) {
        return { success: true, response };
      }
      
      const status = response.status;
      
      // Only retry on specific transient errors to save API credits
      // 408: Request Timeout (temporary)
      // 502: Bad Gateway (server issue)
      // 503: Service Unavailable (temporary overload)
      const isRetryable = [408, 502, 503].includes(status);
      
      if (!isRetryable || attempt === maxRetries) {
        // Don't retry - return error
        return { success: false, status, response };
      }
      
      // Short exponential backoff: 3s, 6s
      const delay = 3000 * attempt;
      console.log(`  ⚠️  ${status} error on ${context}, retry in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      
      const delay = 3000 * attempt;
      console.log(`  ⚠️  Network error on ${context}, retry in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Generate URL-friendly slug from English title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    .substring(0, 100);            // Limit length
}

/**
 * Check if article is from today (for filtering old articles)
 * Uses Turkey timezone for comparison since Nuvemmag is Turkish
 */
function isFromToday(dateString) {
  try {
    // Parse Turkish date format: "10/10/2025" or "9/10/2025"
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);
    
    // Use Turkey timezone for "today"
    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);
    
    // Allow articles from today and yesterday (in case of timezone differences)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return articleDate >= yesterday && articleDate <= today;
  } catch (error) {
    console.error('Date parsing error:', error);
    return true; // If error, include the article
  }
}

/**
 * Check if article is from last 3 days (focus on current news)
 * Uses Turkey timezone for comparison since Nuvemmag is Turkish
 */
function isRecent(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);
    
    // Use Turkey timezone for date calculations
    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const isRecentArticle = articleDate >= threeDaysAgo;
    
    return isRecentArticle;
  } catch (error) {
    console.log(`    ⚠️ Date parse error for "${dateString}": ${error.message}`);
    return true; // If error, include the article
  }
}

/**
 * Get current date in Turkey timezone (Europe/Istanbul)
 * Nuvemmag uses Turkey timezone for article dates
 * 
 * NOTE: Uses JavaScript Intl API which automatically handles:
 * - DST (Daylight Saving Time) changes
 * - Timezone offset changes
 * - Historical timezone data
 * 
 * No hardcoded offsets - fully automatic!
 */
function getTurkeyDate() {
  const now = new Date();
  // Convert to Turkey timezone string and parse back
  // Using 'en-CA' locale gives us YYYY-MM-DD format which is easy to parse
  // timeZone: 'Europe/Istanbul' automatically handles DST/timezone changes
  const turkeyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
  const [year, month, day] = turkeyDateStr.split('-').map(n => parseInt(n, 10));
  return new Date(year, month - 1, day);
}

/**
 * Turkish month names mapping
 * Used to parse dates like "16 Aralık 2025"
 */
const TURKISH_MONTHS = {
  'ocak': 1,
  'şubat': 2,
  'mart': 3,
  'nisan': 4,
  'mayıs': 5,
  'haziran': 6,
  'temmuz': 7,
  'ağustos': 8,
  'eylül': 9,
  'ekim': 10,
  'kasım': 11,
  'aralık': 12
};

/**
 * Parse Turkish date format to DD/MM/YYYY
 * Handles formats like "16 Aralık 2025" or "5 Ocak 2025"
 * Returns null if parsing fails
 */
function parseTurkishDate(dateStr) {
  if (!dateStr) return null;
  
  const str = dateStr.trim().toLowerCase();
  const now = new Date();
  
  // Already in DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/').map(Number);
    // Validate year (must be between 2020 and 2030)
    if (year < 2020 || year > 2030) {
      console.warn(`⚠️ Invalid year detected: ${year} for date string "${dateStr}"`);
      return null;
    }
    return str;
  }
  
  // Handle relative dates
  // "bugün" = today
  if (str === 'bugün' || str.includes('bugün')) {
    const today = new Date(now);
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  }
  
  // "dün" = yesterday
  if (str === 'dün' || str.includes('dün')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getDate()}/${yesterday.getMonth() + 1}/${yesterday.getFullYear()}`;
  }
  
  // "X dakika önce" = X minutes ago
  const minutesMatch = str.match(/(\d+)\s*dakika\s*önce/i);
  if (minutesMatch) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - parseInt(minutesMatch[1], 10));
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // "X saat önce" = X hours ago
  const hoursMatch = str.match(/(\d+)\s*saat\s*önce/i);
  if (hoursMatch) {
    const date = new Date(now);
    date.setHours(date.getHours() - parseInt(hoursMatch[1], 10));
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // "X gün önce" = X days ago
  const daysMatch = str.match(/(\d+)\s*gün\s*önce/i);
  if (daysMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() - parseInt(daysMatch[1], 10));
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // "X hafta önce" = X weeks ago
  const weeksMatch = str.match(/(\d+)\s*hafta\s*önce/i);
  if (weeksMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() - (parseInt(weeksMatch[1], 10) * 7));
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // "X ay önce" = X months ago
  const monthsMatch = str.match(/(\d+)\s*ay\s*önce/i);
  if (monthsMatch) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - parseInt(monthsMatch[1], 10));
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // Parse absolute "16 Aralık 2025" format
  const absoluteMatch = dateStr.trim().match(/(\d{1,2})\s+([a-zA-ZğüşıöçĞÜŞİÖÇ]+)\s+(\d{4})/i);
  if (absoluteMatch) {
    const day = parseInt(absoluteMatch[1], 10);
    const monthName = absoluteMatch[2].toLowerCase();
    const year = parseInt(absoluteMatch[3], 10);
    
    // Validate year (must be between 2020 and 2030)
    if (year < 2020 || year > 2030) {
      console.warn(`⚠️ Invalid year detected: ${year} for date string "${dateStr}"`);
      return null;
    }
    
    const month = TURKISH_MONTHS[monthName];
    if (month) {
      return `${day}/${month}/${year}`;
    }
  }
  
  return null;
}

/**
 * Initialize separate Groq client for parsing (uses different API key to avoid rate limits)
 */
const groqParser = new Groq({
  apiKey: CONFIG.GROQ_PARSER_API_KEY,
});

/**
 * AI-powered article list parser using Groq
 * Extracts article URLs and dates from markdown content
 * More reliable than regex patterns when site structure changes
 */
async function parseArticlesWithAI(markdown, categoryTag) {
  console.log(`  🤖 Using AI to parse article list for ${categoryTag}...`);
  
  try {
    const completion = await groqParser.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Fast and cost-effective
      messages: [
        {
          role: 'system',
          content: `You are a web scraping assistant. Extract article information from Turkish tech news markdown.

CRITICAL URL PATTERNS (updated December 2025):
- NEW format: https://nuvemmag.com/article-slug-here/
- OLD format: https://nuvemmag.com/post/article-slug/ (still valid)
- Do NOT include category URLs like /category/

DATE FORMATS to recognize:
- Absolute: "16 Aralık 2025", "17 Aralık 2024"
- Relative: "3 gün önce", "11 saat önce", "1 hafta önce", "2 ay önce", "bugün", "dün"

RULES:
1. Extract article URLs (NOT category URLs)
2. Extract publication date (absolute or relative format)
3. Return ONLY valid JSON array
4. If no articles found, return: []

Output JSON:
[{"url": "https://nuvemmag.com/article-slug/", "date": "3 gün önce"}]`
        },
        {
          role: 'user',
          content: `Extract all article URLs and their dates from this Turkish tech news category page. Return ONLY a JSON array.

${markdown.substring(0, 10000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const articles = JSON.parse(jsonStr);
    
    if (!Array.isArray(articles)) {
      throw new Error('AI response is not an array');
    }
    
    console.log(`  ✅ AI extracted ${articles.length} articles`);
    
    // Convert to our format and filter recent articles
    const processedArticles = [];
    
    for (const article of articles) {
      // Validate URL - accept both new and old formats
      // NEW: https://nuvemmag.com/article-slug/
      // OLD: https://nuvemmag.com/post/article-slug/
      if (!article.url || !article.url.includes('nuvemmag.com/')) {
        continue;
      }
      
      // Skip category URLs
      if (article.url.includes('/category/')) {
        continue;
      }
      
      // Parse Turkish date (absolute or relative)
      const parsedDate = parseTurkishDate(article.date);
      if (!parsedDate) {
        console.log(`    ⚠️ Could not parse date: ${article.date}`);
        // Still include article with today's date as fallback
        const today = new Date();
        const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        processedArticles.push({
          url: article.url,
          category: categoryTag,
          scrapedDate: todayStr,
          datePriority: 50 // Lower priority for unknown dates
        });
        continue;
      }
      
      // Check if recent (last 3 days)
      if (!isRecent(parsedDate)) {
        continue;
      }
      
      const priority = getDatePriority(parsedDate);
      
      processedArticles.push({
        url: article.url,
        category: categoryTag,
        scrapedDate: parsedDate,
        datePriority: priority
      });
    }
    
    // Sort by date priority (newest first)
    processedArticles.sort((a, b) => b.datePriority - a.datePriority);
    
    return processedArticles;
    
  } catch (error) {
    console.error(`  ❌ AI parsing failed: ${error.message}`);
    return null; // Return null to trigger fallback
  }
}

/**
 * Calculate date priority for sorting (higher = more recent)
 * Today = 100, Yesterday = 90, 2 days ago = 80, etc.
 * 
 * IMPORTANT: Uses Europe/Istanbul timezone for date comparison since
 * Nuvemmag is a Turkish news site and publishes dates in Turkey timezone.
 * DST (Daylight Saving Time) changes are handled automatically by Intl API.
 */
function getDatePriority(dateString) {
  try {
    const [day, month, year] = dateString.split('/').map(n => parseInt(n, 10));
    const articleDate = new Date(year, month - 1, day);
    articleDate.setHours(0, 0, 0, 0);
    
    // Use Turkey timezone for "today" calculation
    const today = getTurkeyDate();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - articleDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Priority scoring: Today=100, Yesterday=90, 2 days ago=80, etc.
    const priority = Math.max(0, 100 - (diffDays * 10));
    
    // Debug log for timezone verification (only first few)
    if (Math.random() < 0.1) { // Log ~10% of articles to avoid spam
      console.log(`    📅 Date check: article=${dateString} (parsed: ${articleDate.toDateString()}), turkey_today=${today.toDateString()}, diffDays=${diffDays}, priority=${priority}`);
    }
    
    return priority;
  } catch (error) {
    console.error(`    ⚠️ Date priority error for "${dateString}": ${error.message}`);
    return 0; // Lowest priority for unparseable dates
  }
}

/**
 * Extract slug from URL (handles both old and new formats)
 * OLD: https://nuvemmag.com/post/article-slug/
 * NEW: https://nuvemmag.com/article-slug/
 */
function extractSlugFromUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    // Remove trailing slash
    path = path.replace(/\/$/, '');
    // Remove /post/ prefix if present
    path = path.replace(/^\/post/, '');
    // Remove leading slash
    path = path.replace(/^\//, '');
    return path || null;
  } catch (e) {
    return null;
  }
}

/**
 * Check which articles already exist in Supabase (bulk check)
 * Uses slug-based matching to handle URL format changes
 */
async function getExistingArticles(urls) {
  try {
    // Extract slugs from input URLs
    const slugs = urls.map(extractSlugFromUrl).filter(s => s);
    
    // Get ALL existing articles and check locally (more reliable than SQL LIKE)
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('source_url, slug');
    
    if (error) {
      console.error('Error checking existing articles:', error);
      return new Set();
    }
    
    // Build a set of existing slugs from DB
    const existingSlugs = new Set();
    for (const article of data) {
      // From source_url
      const slugFromUrl = extractSlugFromUrl(article.source_url);
      if (slugFromUrl) existingSlugs.add(slugFromUrl);
      // From slug field
      if (article.slug) existingSlugs.add(article.slug);
    }
    
    // Find input URLs whose slugs already exist
    const existingUrls = new Set();
    for (const url of urls) {
      const slug = extractSlugFromUrl(url);
      if (slug && existingSlugs.has(slug)) {
        existingUrls.add(url);
      }
    }
    
    console.log(`  📊 Slug-based duplicate check: ${existingUrls.size}/${urls.length} already exist`);
    
    return existingUrls;
  } catch (error) {
    console.error('Error in bulk check:', error);
    return new Set();
  }
}

/**
 * Save article to Supabase with smart validation
 */
async function saveArticle(article) {
  try {
    // ============================================
    // STEP 1: SMART VALIDATION PIPELINE
    // ============================================
    console.log(`   🔍 Running smart validation pipeline...`);
    
    const validation = validateArticle({
      ...article,
      originalContent: article.originalContent || article.content,
    });

    // Auto-fix common issues
    if (!validation.isValid && validation.fixes.length > 0) {
      console.log(`   🔧 Auto-fixing ${validation.fixes.length} issues...`);
      const { fixed, fixedCount } = autoFixArticle(article, validation.results);
      if (fixedCount > 0) {
        Object.assign(article, fixed);
        console.log(`   ✅ Fixed ${fixedCount} issues`);
        
        // Re-validate after fixes
        const revalidation = validateArticle({
          ...article,
          originalContent: article.originalContent || article.content,
        });
        if (revalidation.isValid) {
          console.log(`   ✅ Article passed validation after fixes`);
        } else {
          console.log(`   ⚠️  Article still has issues after fixes`);
          validation.errors.forEach(err => console.log(`      ❌ ${err}`));
        }
      }
    }

    // CRITICAL: Reject if still invalid after fixes
    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e => 
        e.includes('Turkish') || 
        e.includes('year') || 
        e.includes('instruction leakage') ||
        e.includes('translation error')
      );
      
      if (criticalErrors.length > 0) {
        console.error(`   ❌ CRITICAL ERRORS - Rejecting article:`);
        criticalErrors.forEach(err => console.error(`      ❌ ${err}`));
        return { 
          success: false, 
          error: new Error(`Validation failed: ${criticalErrors.join('; ')}`),
          validation 
        };
      }
    }

    // Show warnings
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      validation.warnings.forEach(warn => console.log(`      ⚠️  ${warn}`));
    }

    console.log(`   ✅ Validation passed (Score: ${validation.score.toFixed(1)}/100)`);

    // ============================================
    // STEP 2: PARSE AND VALIDATE DATE
    // ============================================
    let isoDate;
    try {
      const [day, month, year] = article.date.split('/');
      
      // Double-check year validation
      if (year < 2020 || year > 2030) {
        console.warn(`   ⚠️  Invalid year ${year}, using today's date`);
        const today = new Date();
        isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      } else {
        isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (e) {
      console.warn(`   ⚠️  Date parsing failed, using today's date`);
      isoDate = new Date().toISOString().split('T')[0];
    }

    // ============================================
    // STEP 3: FINAL CLEANUP (LAST DEFENSE)
    // ============================================
    let cleanTitle = article.title;
    let cleanDescription = article.description;
    let cleanContent = article.content;
    
    // Remove "– NuvemMag" from title if still present
    cleanTitle = cleanTitle.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();
    cleanTitle = cleanTitle.replace(/\bNuvemMag\b/gi, '').trim();
    if (cleanTitle !== article.title) {
      console.log(`   🔧 Cleaned title: removed NuvemMag branding`);
    }
    
    // Final cleanup of description
    cleanDescription = cleanDescription.replace(/\bNuvemMag\b/gi, '').trim();
    cleanDescription = cleanDescription.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s]*/gi, '').trim();
    
    // Final cleanup of content
    cleanContent = cleanContent.replace(/\bNuvemMag\b/gi, '');
    cleanContent = cleanContent.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '');
    cleanContent = cleanContent.replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '');
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
    
    // Verify no Nuvemmag branding remains
    if (cleanContent.toLowerCase().includes('nuvemmag') || cleanTitle.toLowerCase().includes('nuvemmag')) {
      console.warn(`   ⚠️  WARNING: NuvemMag branding still detected after cleanup!`);
    }

    // ============================================
    // STEP 4: SAVE TO DATABASE
    // ============================================
    const { data, error } = await supabase
      .from('tech_news_articles')
      .insert([
        {
          title: cleanTitle,
          description: cleanDescription,
          content: cleanContent,
          original_title: article.originalTitle,
          image_url: article.image,
          date: isoDate,
          category: article.category,
          source_url: article.sourceUrl,
          original_source: article.originalSource,
          slug: article.slug,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('   ❌ Error saving article to Supabase:', error);
      return { success: false, error, validation };
    }

    console.log(`   ✅ Article saved successfully (ID: ${data.id})`);
    return { success: true, data, validation };
  } catch (error) {
    console.error('   ❌ Error saving article:', error);
    return { success: false, error };
  }
}

/**
 * Get article count from Supabase
 */
async function getArticleCount() {
  try {
    const { count, error } = await supabase
      .from('tech_news_articles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting article count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting count:', error);
    return 0;
  }
}

/**
 * Scrape article list from a category using Firecrawl REST API
 * Uses AI-powered parsing with regex fallback
 */
async function scrapeArticleListFromCategory(categoryUrl, categoryTag) {
  console.log(`🔍 Scraping ${categoryTag} from: ${categoryUrl}`);
  
  try {
    // Use Firecrawl REST API with retry logic
    // IMPORTANT: Use low maxAge to get fresh data, not cached results
    // This fixes the "today articles = 0" issue on scheduled runs
    const result = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: categoryUrl,
          formats: ['markdown'],
          onlyMainContent: true,
          // Cache settings: max 2 hours old data (7,200,000 ms)
          // This ensures we get fresh article lists on scheduled runs
          maxAge: 7200000,
          storeInCache: true  // Allow caching but with maxAge limit
        })
      },
      `category ${categoryTag}`
    );

    if (!result.success) {
      throw new Error(`Firecrawl API error: ${result.status || result.error}`);
    }
    
    const response = result.response;

    const scrapeResult = await response.json();

    if (!scrapeResult.success || !scrapeResult.data || !scrapeResult.data.markdown) {
      throw new Error('Firecrawl scraping failed - no markdown returned');
    }

    // Parse markdown to extract article URLs and dates
    const markdown = scrapeResult.data.markdown;
    
    // ============================================
    // PRIMARY METHOD: AI-powered parsing with Groq
    // More reliable when site structure changes
    // ============================================
    const aiArticles = await parseArticlesWithAI(markdown, categoryTag);
    
    if (aiArticles && aiArticles.length > 0) {
      console.log(`✅ Found ${aiArticles.length} recent articles in ${categoryTag} (AI parser)`);
      return aiArticles;
    }
    
    // ============================================
    // FALLBACK: Regex-based parsing
    // Used when AI parsing fails or returns no results
    // ============================================
    console.log(`  ⚠️ AI parser returned no results, trying regex fallback...`);
    
    const articles = [];
    
    // Updated regex patterns for new site structure (December 2025):
    // - NEW URL pattern: https://nuvemmag.com/[slug]/ (no /post/)
    // - OLD URL pattern: https://nuvemmag.com/post/[slug]/ (backward compat)
    // - Date patterns: Turkish "16 Aralık 2025", relative "3 gün önce", DD/MM/YYYY
    const patterns = [
      // Pattern 1: NEW URL format (no /post/) with Turkish absolute date
      /(\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4})[\s\S]*?\((https:\/\/nuvemmag\.com\/(?!category\/)[^)]+)\)/gi,
      
      // Pattern 2: NEW URL with relative date "X gün önce"
      /(\d+\s*(?:dakika|saat|gün|hafta|ay)\s*önce|bugün|dün)[\s\S]*?\((https:\/\/nuvemmag\.com\/(?!category\/)[^)]+)\)/gi,
      
      // Pattern 3: URL followed by Turkish date
      /\]\((https:\/\/nuvemmag\.com\/(?!category\/)[^)]+)\)[\s\S]*?(\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4})/gi,
      
      // Pattern 4: OLD /post/ format (backward compatibility)
      /\((https:\/\/nuvemmag\.com\/post\/[^)]+)\)/g,
      
      // Pattern 5: Just extract article URLs (fallback)
      /\((https:\/\/nuvemmag\.com\/(?!category\/|page\/|tag\/)[a-z0-9-]+\/)\)/gi,
    ];
    
    let totalMatches = 0;
    let patternUsed = -1;
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      let match;
      const tempArticles = [];
      
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(markdown)) !== null) {
        totalMatches++;
        
        let date, url;
        
        if (i === 2) {
          // Pattern 3: URL first, then date
          url = match[1];
          date = match[2];
        } else if (i === 3 || i === 4) {
          // Pattern 4 & 5: URL only, try to find date nearby
          url = match[1];
          // Look for date in surrounding context (before and after)
          const startIdx = Math.max(0, match.index - 150);
          const endIdx = Math.min(markdown.length, match.index + url.length + 150);
          const context = markdown.substring(startIdx, endIdx);
          
          // Try relative dates first (more common in new format)
          const relativeDateMatch = context.match(/(\d+\s*(?:dakika|saat|gün|hafta|ay)\s*önce|bugün|dün)/i);
          const turkishDateMatch = context.match(/(\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+\d{4})/i);
          const numericDateMatch = context.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          
          if (relativeDateMatch) {
            date = relativeDateMatch[1];
          } else if (turkishDateMatch) {
            date = turkishDateMatch[1];
          } else if (numericDateMatch) {
            date = numericDateMatch[1];
          } else {
            // Use today's date as fallback for URL-only patterns
            const now = new Date();
            date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
          }
        } else {
          // Pattern 1, 2: date first, then URL
          date = match[1];
          url = match[2];
        }
        
        // Clean URL and skip category URLs
        url = url.replace(/[,;.]$/, '');
        if (url.includes('/category/')) {
          continue;
        }
        
        // Parse date (handles Turkish absolute, relative, and DD/MM/YYYY formats)
        const parsedDate = parseTurkishDate(date);
        if (!parsedDate) {
          continue;
        }
        
        if (!tempArticles.some(a => a.url === url)) {
          const isDateRecent = isRecent(parsedDate);
          if (isDateRecent) {
            const priority = getDatePriority(parsedDate);
            tempArticles.push({ 
              url, 
              category: categoryTag, 
              scrapedDate: parsedDate,
              datePriority: priority
            });
          }
        }
      }
      
      if (tempArticles.length > 0) {
        // Sort by date priority (newest first: Today=100, Yesterday=90, etc.)
        tempArticles.sort((a, b) => b.datePriority - a.datePriority);
        
        console.log(`  📊 Found ${tempArticles.length} articles via regex pattern ${i + 1}`);
        
        articles.push(...tempArticles);
        patternUsed = i;
        break; // Use first pattern that works
      }
    }

    console.log(`✅ Found ${articles.length} recent articles in ${categoryTag} (regex fallback, matches: ${totalMatches}, pattern: ${patternUsed + 1})`);
    return articles;
  } catch (error) {
    console.error(`❌ Failed to scrape ${categoryTag}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape all categories
 */
async function scrapeAllCategories() {
  console.log('🔍 Scraping all categories...\n');
  
  // Log timezone info for debugging
  // Note: Europe/Istanbul timezone automatically handles DST changes
  const turkeyToday = getTurkeyDate();
  const utcNow = new Date();
  const turkeyOffset = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Istanbul',
    timeZoneName: 'shortOffset'
  }).formatToParts(utcNow).find(p => p.type === 'timeZoneName')?.value || 'UTC+?';
  
  console.log(`🌍 Timezone Debug (auto DST handling):`);
  console.log(`   UTC now: ${utcNow.toISOString()}`);
  console.log(`   Turkey now: ${utcNow.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} (${turkeyOffset})`);
  console.log(`   Turkey today (for comparisons): ${turkeyToday.toDateString()}\n`);
  
  const allArticles = [];
  
  for (const category of CONFIG.CATEGORIES) {
    const articles = await scrapeArticleListFromCategory(category.url, category.tag);
    
    // Articles are already sorted by date priority (newest first)
    // Now limit articles per category, preserving the priority order
    const limitedArticles = articles.slice(0, CONFIG.MAX_ARTICLES_PER_CATEGORY);
    
    if (limitedArticles.length > 0) {
      const todayCount = limitedArticles.filter(a => a.datePriority >= 100).length;
      const yesterdayCount = limitedArticles.filter(a => a.datePriority >= 90 && a.datePriority < 100).length;
      const olderCount = limitedArticles.filter(a => a.datePriority < 90).length;
      console.log(`  📊 Selected ${limitedArticles.length} articles: ${todayCount} today, ${yesterdayCount} yesterday, ${olderCount} older`);
    }
    
    allArticles.push(...limitedArticles);
    
    // Rate limiting between categories (Firecrawl free: 10 req/min)
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }
  
  // Sort all articles by date priority across all categories
  // This ensures we process today's articles first, regardless of category
  allArticles.sort((a, b) => b.datePriority - a.datePriority);
  
  console.log(`\n✅ Total articles found across all categories: ${allArticles.length}`);
  console.log(`\n🎯 Final Priority Order (Today → Yesterday → Older):`);
  
  // Group and display by priority
  const todayArticles = allArticles.filter(a => a.datePriority >= 100);
  const yesterdayArticles = allArticles.filter(a => a.datePriority >= 90 && a.datePriority < 100);
  const olderArticles = allArticles.filter(a => a.datePriority < 90);
  
  console.log(`  🔥 TODAY: ${todayArticles.length} articles`);
  console.log(`  🌟 YESTERDAY: ${yesterdayArticles.length} articles`);
  console.log(`  📰 OLDER: ${olderArticles.length} articles`);
  
  console.log(`\n`);
  return allArticles;
}

/**
 * Scrape single article details using Firecrawl REST API
 */
async function scrapeArticleDetails(url) {
  console.log(`📰 Scraping article: ${url}`);
  
  try {
    // Use Firecrawl REST API with retry logic
    const result = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html', 'rawHtml'], // Get markdown, cleaned HTML, and raw HTML for embed extraction
          onlyMainContent: true, // Still filter headers/footers but keep embeds
          waitFor: 2000, // Wait 2 seconds for dynamic content (embeds) to load
          blockAds: true, // Block ads but keep embeds
          removeBase64Images: false // Keep base64 images (might be embed thumbnails)
        })
      },
      `article ${url.split('/').pop()}`
    );

    if (!result.success) {
      throw new Error(`Firecrawl API error: ${result.status || result.error}`);
    }
    
    const response = result.response;

    const scrapeResult = await response.json();
    
    if (!scrapeResult.success || !scrapeResult.data || !scrapeResult.data.markdown) {
      throw new Error('Failed to scrape article - no markdown returned');
    }

    const { markdown, html, rawHtml, metadata } = scrapeResult.data;
    
    // Use rawHtml for embed extraction (more reliable than cleaned html)
    const htmlForEmbeds = rawHtml || html || '';
    
    // Extract title from metadata or markdown
    let title = metadata.title || metadata.ogTitle || '';
    
    // CRITICAL: Remove "– NuvemMag" or " - NuvemMag" from title
    title = title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();
    title = title.replace(/\s*NuvemMag\s*$/i, '').trim();
    
    const description = metadata.description || metadata.ogDescription || '';
    const image = metadata.ogImage || metadata['twitter:image'] || '';
    
    // Extract date from markdown - look for proper date formats
    // Try multiple patterns: "24 Dec 2025", "17 Dec 2025", "24/12/2025", etc.
    let date = null;
    
    // Pattern 1: "24 Dec 2025" format (English)
    const englishDateMatch = markdown.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (englishDateMatch) {
      const monthMap = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      const day = englishDateMatch[1].padStart(2, '0');
      const month = monthMap[englishDateMatch[2].toLowerCase()];
      const year = englishDateMatch[3];
      date = `${day}/${month}/${year}`;
    }
    
    // Pattern 2: DD/MM/YYYY format
    if (!date) {
      const dateMatch = markdown.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        // Validate: year should be reasonable (2020-2030)
        if (parseInt(year) >= 2020 && parseInt(year) <= 2030) {
          date = dateMatch[1];
        }
      }
    }
    
    // Pattern 3: Turkish date format "17 Aralık 2025"
    if (!date) {
      const turkishDateMatch = markdown.match(/(\d{1,2})\s+(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})/i);
      if (turkishDateMatch) {
        date = parseTurkishDate(turkishDateMatch[0]);
      }
    }
    
    // Fallback: use today's date if no valid date found
    if (!date) {
      const now = new Date();
      date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
      console.log(`    ⚠️  No valid date found, using today: ${date}`);
    }
    
    // Extract category from markdown (first line after nav usually contains category)
    const categoryMatch = markdown.match(/^([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)\n\n\d{1,2}\/\d{1,2}\/\d{4}/m);
    const originalCategory = categoryMatch ? categoryMatch[1].trim() : '';
    
    // Extract main content (remove header, footer, related articles, Nuvemmag logo)
    // IMPORTANT: Do NOT filter out lines here - we'll add embed tokens first, then clean
    let content = markdown;

    // ============================================
    // STEP 0: ADVANCED HEADER/NAVIGATION REMOVAL
    // Site structure changed - need smarter detection
    // ============================================
    
    const initialLines = content.split('\n');
    let contentStartIndex = 0;
    let contentEndIndex = initialLines.length;
    
    // Strategy 1: Find the article title (# heading) and start after social share links
    for (let i = 0; i < initialLines.length; i++) {
      const line = initialLines[i];
      
      // Skip until we find the main heading (# Title)
      if (line.startsWith('# ') && !line.includes('NuvemMag')) {
        // Found title, now skip past social share links and author info
        for (let j = i + 1; j < Math.min(i + 30, initialLines.length); j++) {
          const checkLine = initialLines[j];
          // Look for actual content start - a paragraph that doesn't contain share/meta text
          if (checkLine.length > 100 && 
              !checkLine.includes('Paylaş') &&
              !checkLine.includes('nuvemmag.com') &&
              !checkLine.includes('tarafından') &&
              !checkLine.includes('okundu') &&
              !checkLine.includes('Okuma süresi') &&
              !checkLine.includes('Google News')) {
            contentStartIndex = j;
            console.log(`    ✂️  Content starts at line ${contentStartIndex} (after title and meta)`);
            break;
          }
        }
        break;
      }
    }
    
    // Strategy 2: Find content end - before "Kaynak:", "İlginizi Çekebilir", or reaction buttons
    for (let i = contentStartIndex; i < initialLines.length; i++) {
      const line = initialLines[i];
      if (line.includes('Kaynak:') || 
          line.includes('İlginizi Çekebilir') ||
          line.includes('Post Views:') ||
          line.includes('Bu Yazıya Tepkiniz') ||
          line.includes('Benzer Yazılar') ||
          line.includes('Yorumları Göster')) {
        contentEndIndex = i;
        console.log(`    ✂️  Content ends at line ${contentEndIndex} (before footer/related)`);
        break;
      }
    }
    
    // Extract content between start and end
    if (contentStartIndex > 0 || contentEndIndex < initialLines.length) {
      content = initialLines.slice(contentStartIndex, contentEndIndex).join('\n');
    }
    
    // ============================================
    // STEP 0.5: AGGRESSIVE NUVEMMAG URL REMOVAL
    // Remove ALL nuvemmag.com URLs early (before embed processing)
    // These are social share links, not actual content
    // ============================================
    
    // Remove markdown links with nuvemmag.com URLs
    content = content.replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '');
    
    // Remove standalone nuvemmag.com URLs
    content = content.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '');
    
    // Remove social share button lines
    content = content.replace(/^-\s*\[[^\]]*(?:Paylaş|Share)[^\]]*\].*$/gim, '');
    
    // Remove empty markdown link remnants
    content = content.replace(/\[\]\(\)/g, '');
    content = content.replace(/\[]\([^)]*\)/g, '');

    // ============================================
    // TOKEN-BASED EMBED PRESERVATION SYSTEM
    // Extract social media embeds from HTML and convert to protected tokens
    // These tokens will be preserved during translation and rendered as React components
    // ============================================
    
    // Step 1: Extract Tweet IDs from rawHtml (for dynamic Twitter embeds that Firecrawl can't scrape)
    // Use rawHtml instead of html for better embed detection (contains original iframes/blockquotes)
    // Note: htmlForEmbeds is already defined above (line 1064)
    let tweetIdsFromHtml = [];
    if (htmlForEmbeds) {
      const tweetMatches = htmlForEmbeds.matchAll(/(?:twitter|x)\.com\/[^\/]+\/status\/(\d+)/gi);
      for (const match of tweetMatches) {
        const tweetId = match[1];
        if (!tweetIdsFromHtml.includes(tweetId)) {
          tweetIdsFromHtml.push(tweetId);
          console.log(`  🐦 Found tweet ID in rawHtml: ${tweetId}`);
        }
      }
    }
    
    // Step 2: Extract embeds from MARKDOWN links (Firecrawl often converts iframes to markdown links)
    console.log(`  🔍 Checking for social media links in markdown...`);
    content = extractAllEmbedsFromMarkdown(content);
    
    // Step 3: Extract embeds from rawHtml iframes and inject into markdown at correct positions
    // Use rawHtml for better embed detection (contains original iframes/blockquotes)
    let embedCount = { tiktok: 0, twitter: 0, youtube: 0 };
    if (htmlForEmbeds) {
      try {
        const extracted = htmlToTokens(htmlForEmbeds);
        const tokenLines = extracted.contentWithTokens.match(/\[\[EMBED:[^\]]+\]\]/g) || [];
        
        if (tokenLines.length > 0) {
          embedCount = extracted.embedCount;
          console.log(`    🎬 Extracted ${tokenLines.length} embeds: ${JSON.stringify(embedCount)}`);
          
          // Replace markdown blockquotes with tokens (not append!)
          for (const token of tokenLines) {
            const tiktokMatch = /\[\[EMBED:TIKTOK:([^\]]+)\]\]/.exec(token);
            if (tiktokMatch) {
              const url = tiktokMatch[1];
              content = replaceTikTokBlockquote(content, url);
              console.log(`    ✅ Replaced TikTok blockquote with token`);
            }
            
            const tweetMatch = /\[\[EMBED:TWEET:(\d+)\]\]/.exec(token);
            if (tweetMatch) {
              const tweetId = tweetMatch[1];
              content = replaceTwitterBlockquote(content, tweetId);
              console.log(`    ✅ Replaced Twitter blockquote with token`);
            }
            
            // YouTube embeds are usually not in blockquotes in markdown, so we append them
            const youtubeMatch = /\[\[EMBED:YOUTUBE:([^\]]+)\]\]/.exec(token);
            if (youtubeMatch) {
              content = content + '\n\n' + token + '\n\n';
              console.log(`    ✅ Appended YouTube token`);
            }
          }
          
          // Clean up any remaining social media embed text
          content = cleanSocialEmbedRemnants(content);
        }
      } catch (error) {
        console.warn(`    ⚠️ Failed to extract embeds from HTML: ${error.message}`);
      }
    }
    
    // Step 4: Remove ALL markdown images (featured image already stored separately)
    content = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    
    // Step 5: Remove Nuvemmag logo and branding anchors
    content = content
      .replace(/\[!\[[^\]]*\]\([^)]+\)\]\(\s*https?:\/\/(?:www\.)?nuvemmag\.com\/?\s*\)/gi, '')
      .replace(/<a[^>]*href="https?:\/\/(?:www\.)?nuvemmag\.com\/?"[^>]*>\s*<img[\s\S]*?<\/a>/gi, '')
      .replace(/!\[[^\]]*\]\([^)]*NuvemMag-Logo[^)]*\)/gi, '');
    
    // Step 6: Keep "Kaynak:" lines for now (will extract source later, then remove)
    // DO NOT remove "Kaynak:" lines here - they're needed for source extraction!
    
    // Remove any remaining Nuvemmag URLs (that weren't caught in Step 0)
    content = content.replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?nuvemmag\.com[^\)]*\)/gi, '');
    content = content.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]]+/gi, '');
    
    // Step 7: LINE-BY-LINE AGGRESSIVE CLEANING (after tokens are safely added)
    // Remove navigation, footer, social links, related articles section, etc.
    
    // Split into lines for better control
    const lines = content.split('\n');
    const cleanedLines = [];
    let skipSection = false;
    let skipYouTubeUILines = 0; // Skip lines after YouTube embed (UI text)
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip "İlginizi Çekebilir" section and everything after it
      if (line.includes('İlginizi Çekebilir') || line.includes('Kategoriler')) {
        skipSection = true;
        continue;
      }
      
      // Skip if we're in a skip section
      if (skipSection) {
        // Check if we hit an embed token - if so, stop skipping
        if (line.match(/\[\[EMBED:/)) {
          skipSection = false;
        } else {
          continue;
        }
      }
      
      // Skip lines after YouTube embed (contains UI text like "Info", "Share", subscribers, etc.)
      if (skipYouTubeUILines > 0) {
        skipYouTubeUILines--;
        continue;
      }
      
      // Detect YouTube embed token and skip next lines
      if (line.includes('[[EMBED:YOUTUBE:')) {
        cleanedLines.push(line);
        skipYouTubeUILines = 15; // Skip next 15 lines after YouTube embed
        continue;
      }
      
      // SPECIAL: Replace "Twitter Widget Iframe" with actual tweet token
      // This handles dynamic Twitter embeds that Firecrawl can't properly scrape
      if (line.includes('Twitter Widget Iframe') || line.includes('Twitter Embed')) {
        if (tweetIdsFromHtml.length > 0) {
          // Use the first tweet ID found in HTML
          const tweetId = tweetIdsFromHtml[0];
          cleanedLines.push(`\n[[EMBED:TWEET:${tweetId}]]\n`);
          console.log(`  ✅ Replaced Twitter Widget placeholder with tweet token: ${tweetId}`);
          tweetIdsFromHtml.shift(); // Remove used tweet ID
          continue;
        }
      }
      
      // Skip YouTube UI text that wasn't caught by skipYouTubeUILines
      if (
        line.includes('- YouTube') ||
        line.includes('youtube.com/channel') ||
        line.includes('embeds_referring_euri') ||
        line.match(/^\s*(Info|Share|Subscribe|Watch later|Copy link|Report|Playlist)\s*$/i) ||
        line.match(/^\s*\d+\.?\d*[KM]?\s+subscribers?\s*$/i) || // "19.4K subscribers", "1M subscribers"
        line.match(/^\s*\d+\.?\d*[KM]?\s+views?\s*$/i) || // "1.2M views"
        line.match(/^\s*(Photo image of|Video thumbnail|Uploaded by)\s/i) ||
        line.match(/Introducing.*YouTube$/i) || // "Introducing X - YouTube"
        line.includes('youtube.com/watch?v=') && !line.includes('[[EMBED') ||
        line.includes('youtu.be/') && !line.includes('[[EMBED') ||
        // Turkish YouTube UI text (noscript fallback)
        line.includes('İzlemek için:') ||
        line.includes('Daha sonr') ||
        // YouTube noscript/fallback garbage text
        line.includes('More videos') ||
        line.includes('Videos you watch may be added') ||
        line.includes('TV recommendations') ||
        line.includes('retrieving sharing information') ||
        line.includes('Please try again later') ||
        line.match(/^\s*\d+:\d+\s*$/) || // "0:00" standalone
        line.match(/^\s*\d+:\d+\s*\/\s*\d+:\d+\s*$/) // "0:00 / 1:00"
      ) {
        continue;
      }
      
      // Skip Twitter/X noscript fallback and UI text
      if (
        line.includes('Twitter Widget Iframe') ||
        line.includes('Twitter Embed') ||
        line.includes('Log in') && line.length < 20 ||
        line.includes('Sign up') && line.length < 20 ||
        line.match(/^\s*(@\w+)\s*$/) || // Standalone @username
        line.includes('Replying to') ||
        line.includes('Quote Tweet') ||
        line.includes('Show replies') ||
        line.includes('Show this thread') ||
        line.includes('Embedded video') ||
        line.includes('From Twitter') ||
        line.includes('View on Twitter') ||
        line.includes('View on X') ||
        line.includes('twitter.com/intent') ||
        line.includes('x.com/intent') ||
        line.match(/^\s*\d+\s*(Retweets?|Likes?|replies|reposts?)\s*$/i) || // "123 Retweets"
        line.match(/^\s*(Retweet|Like|Reply|Share|Copy link)\s*$/i) ||
        line.includes('This Tweet is from') ||
        line.includes('Read the full conversation') ||
        line.includes('Explore what') ||
        line.includes('who to follow')
      ) {
        continue;
      }
      
      // Skip TikTok noscript fallback and UI text
      if (
        line.includes('TikTok') && line.length < 30 && !line.includes('[[EMBED') ||
        line.includes('tiktok.com/@') && !line.includes('[[EMBED') ||
        line.match(/^\s*(@\w+)\s+·\s+original sound/i) || // "@user · original sound"
        line.includes('original sound -') ||
        line.includes('♬') || // TikTok music note
        line.match(/^\s*\d+\.?\d*[KMB]?\s+(likes?|views?|comments?|shares?)\s*$/i) ||
        line.includes('Discover videos') ||
        line.includes('For You') && line.length < 20 ||
        line.includes('Following') && line.length < 20 ||
        line.includes('Get app') ||
        line.includes('Log in to TikTok') ||
        line.includes('Watch more')
      ) {
        continue;
      }
      
      // Skip Instagram noscript fallback and UI text
      if (
        line.includes('View this post on Instagram') ||
        line.includes('View this photo on Instagram') ||
        line.includes('A post shared by') ||
        line.includes('instagram.com/p/') && !line.includes('[[EMBED') ||
        line.includes('View profile') && line.length < 30 ||
        line.includes('View more on Instagram') ||
        line.match(/^\s*\d+\s+(likes?|comments?)\s*$/i)
      ) {
        continue;
      }
      
      // Skip Facebook embed fallback
      if (
        line.includes('View on Facebook') ||
        line.includes('facebook.com/plugins') ||
        line.includes('Log into Facebook') ||
        line.includes('See more on Facebook')
      ) {
        continue;
      }
      
      // Skip social share and meta lines (new site structure)
      if (
        line.includes('Paylaş') ||
        line.includes('tarafından') ||
        line.includes('okundu') ||
        line.includes('Okuma süresi') ||
        line.includes('Google News') ||
        line.includes('Post Views') ||
        line.includes('Tepkiniz') ||
        line.includes('Beğendim') ||
        line.includes('Alkışlıyorum') ||
        line.includes('Eğlendim') ||
        line.includes('Düşünceliyim') ||
        line.includes('İğrendim') ||
        line.includes('Sevdim') ||
        line.includes('Kızdım') ||
        line.includes('Yazarın Profili') ||
        line.includes('Benzer Yazılar') ||
        line.includes('Yorumları Göster') ||
        line.match(/^\+\-\s*\[\d+\]/) || // "+- [0]" comment count
        line.match(/^\d+\s*$/) || // Just a number (view count, etc.)
        line.match(/^!\[.*\]\(<Base64-Image-Removed>\)/) // Base64 images
      ) {
        continue;
      }
      
      // Skip navigation/footer/category lines (catch any that slipped through Step 0)
      if (
        line.includes('Ana Sayfa') ||
        line.includes('Ana SayfaEn') ||
        line.includes('En Son Haberler') ||
        line.includes('Çiçek ile Teknoloji') ||
        line.includes('Yapay Zeka Uygulamaları') ||
        line.includes('Yapay Zeka') && line.length < 50 || // Short "Yapay Zeka" is category, not content
        line.includes('Teknoloji') && line.length < 20 || // "Teknoloji" category vs content
        line.includes('Sürdürülebilirlik') && line.length < 30 ||
        line.includes('Bilim ve Dünya') ||
        line.includes('Gündem') && line.length < 20 ||
        line.includes('Kurumsal') ||
        line.includes('Hakkımızda') ||
        line.includes('Küny') ||
        line.includes('İletişim') ||
        line.includes('Aydınlatma') ||
        line.includes('Çerez Politikası') ||
        line.includes('Kişisel Verilerin Korunması') ||
        line.includes('Pinetent Digital') ||
        line.includes('Tüm Hakları Saklıdır') ||
        line.includes('©202') || // Copyright notices
        line.includes('instagram.com') && !line.includes('[[EMBED') ||
        line.includes('twitter.com') && !line.includes('[[EMBED') ||
        line.includes('linkedin.com') ||
        line.includes('youtube.com/@') || // YouTube CHANNEL links (not videos!)
        line.includes('x.com/Nuvemmag') || // Nuvemmag's own Twitter
        line.includes('facebook.com') ||
        line.includes('post-category') || // Category URLs
        line.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || // Date lines
        hasNuvemmagDomain(line) && !line.includes('Kaynak:') ||
        line.includes('NuvemMag-Logo') ||
        line.includes('cdn.prod.website-files.com') ||
        line.trim() === '[]()' || line.match(/^\[\]\([^\)]*\)$/) // Empty markdown links
      ) {
        continue;
      }
      
      // Skip lines that are ONLY short names (1-3 words, likely channel/company names)
      const trimmed = line.trim();
      if (trimmed && 
          trimmed.split(/\s+/).length <= 3 && 
          !trimmed.match(/[.,:;!?]/) && 
          !trimmed.match(/\[\[EMBED:/) &&
          !trimmed.startsWith('#') &&
          !trimmed.includes('**')) {
        const prevLine = cleanedLines[cleanedLines.length - 1] || '';
        if (!prevLine.endsWith(',') && !prevLine.endsWith(':') && !prevLine.includes('**')) {
          continue;
        }
      }
      
      cleanedLines.push(line);
    }
    
    content = cleanedLines.join('\n');
    
    // ============================================
    // EXTRACT ORIGINAL SOURCE BEFORE CLEANING
    // Important: Extract from BOTH markdown AND content before removing "Kaynak:"
    // ============================================
    let extractedSource = null;
    
    // Strategy 1: Look for "Kaynak:" in ORIGINAL markdown first
    // This is the most reliable source - catches 90%+ of cases
    const kaynakInMarkdown = markdown.match(/Kaynak:\s*(?:\[([^\]]+)\]\()?([^\s\)<>\]]+)(?:\))?/i);
    if (kaynakInMarkdown) {
      extractedSource = kaynakInMarkdown[2];
      console.log(`    📰 Found source (Strategy 1 - Kaynak in markdown): ${extractedSource}`);
    }
    
    // Strategy 2: Look for "Kaynak:" in cleaned content (if not found in markdown)
    if (!extractedSource) {
      const kaynakInContent = content.match(/Kaynak:\s*(?:\[([^\]]+)\]\()?([^\s\)<>\]]+)(?:\))?/i);
      if (kaynakInContent) {
        extractedSource = kaynakInContent[2];
        console.log(`    📰 Found source (Strategy 2 - Kaynak in content): ${extractedSource}`);
      }
    }
    
    // Strategy 3: Search for any external links in content (excluding social media)
    if (!extractedSource) {
      const allLinksInContent = content.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [];
      for (const linkMatch of allLinksInContent) {
        const urlMatch = linkMatch.match(/\((https?:\/\/[^\)]+)\)/);
        if (urlMatch) {
          const linkUrl = urlMatch[1];
          // Skip social media and nuvemmag links
          if (!linkUrl.includes('nuvemmag.com') && 
              !linkUrl.includes('twitter.com') && 
              !linkUrl.includes('x.com') &&
              !linkUrl.includes('youtube.com') && 
              !linkUrl.includes('youtu.be') &&
              !linkUrl.includes('tiktok.com') &&
              !linkUrl.includes('instagram.com') &&
              !linkUrl.includes('facebook.com') &&
              !linkUrl.includes('linkedin.com')) {
            extractedSource = linkUrl;
            console.log(`    📰 Found source (Strategy 3 - content link): ${extractedSource}`);
            break;
          }
        }
      }
    }
    
    // Strategy 4: Scan ALL URLs in markdown as last resort
    if (!extractedSource) {
      const allUrlsInMarkdown = markdown.match(/https?:\/\/[^\s<>()\[\]]+/gi) || [];
      for (const foundUrl of allUrlsInMarkdown) {
        // Skip social media, nuvemmag, CDN, and image links
        if (!foundUrl.includes('nuvemmag.com') && 
            !foundUrl.includes('twitter.com') && 
            !foundUrl.includes('x.com') &&
            !foundUrl.includes('youtube.com') && 
            !foundUrl.includes('youtu.be') &&
            !foundUrl.includes('tiktok.com') &&
            !foundUrl.includes('instagram.com') &&
            !foundUrl.includes('facebook.com') &&
            !foundUrl.includes('linkedin.com') &&
            !foundUrl.includes('cdn.prod.website-files.com') &&
            !foundUrl.includes('.png') &&
            !foundUrl.includes('.jpg') &&
            !foundUrl.includes('.jpeg') &&
            !foundUrl.includes('.gif') &&
            !foundUrl.includes('.webp')) {
          extractedSource = foundUrl.trim();
          console.log(`    📰 Found source (Strategy 4 - markdown scan): ${extractedSource}`);
          break;
        }
      }
    }
    
    // Log if no source was found (this should be VERY rare now)
    if (!extractedSource) {
      console.log(`    ⚠️  No original source found (article may be original Nuvemmag content)`);
    }
    
    // Step 8: Clean up excessive whitespace
    content = content
      .replace(/(\r?\n){3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/^\s*[\r\n]/gm, '\n')
      .trim();
    
    // Remove source attribution from content (after extracting it)
    content = content.replace(/Kaynak:.*$/s, '').trim();
    
    // Remove "İlginizi Çekebilir" section and everything after
    content = content.split(/İlginizi Çekebilir/)[0].trim();
    
    return {
      title,
      description,
      content,
      image,
      date,
      sourceUrl: url,
      originalSource: extractedSource,
      originalCategory
    };
  } catch (error) {
    console.error(`❌ Failed to scrape article: ${error.message}`);
    return null;
  }
}

/**
 * Widget Preservation System
 * Temporarily replaces widgets with placeholders during translation
 */
function preserveWidgets(content) {
  const widgets = [];
  let processedContent = content;
  
  // 1. Preserve Twitter Widget Iframes
  processedContent = processedContent.replace(/Twitter Widget Iframe/gi, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'twitter_iframe',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 2. Preserve HTML iframe embeds (Twitter, YouTube, etc.)
  processedContent = processedContent.replace(/<iframe[^>]*>.*?<\/iframe>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'iframe_embed',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 3. Preserve Twitter blockquote embeds
  processedContent = processedContent.replace(/<blockquote[^>]*class="twitter-tweet"[^>]*>.*?<\/blockquote>/gis, (match) => {
    const placeholder = `__WIDGET_${widgets.length}__`;
    widgets.push({
      type: 'twitter_blockquote',
      content: match,
      placeholder
    });
    return placeholder;
  });
  
  // 4. Preserve other widget types
  const widgetPatterns = [
    /YouTube Widget/gi,
    /Instagram Widget/gi,
    /Social Media Widget/gi,
    /Widget Iframe/gi
  ];
  
  widgetPatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match) => {
      const placeholder = `__WIDGET_${widgets.length}__`;
      widgets.push({
        type: 'generic_widget',
        content: match,
        placeholder
      });
      return placeholder;
    });
  });
  
  return { content: processedContent, widgets };
}

/**
 * Restore preserved widgets back to content
 */
function restoreWidgets(translatedContent, widgets) {
  let restoredContent = translatedContent;
  
  // Restore each widget from its placeholder
  widgets.forEach(widget => {
    restoredContent = restoredContent.replace(
      new RegExp(widget.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      widget.content
    );
  });
  
  return restoredContent;
}

/**
 * Calculate similarity between two strings (0-1)
 * Simple character-based similarity
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  
  // Count matching characters
  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / longer.length;
}

/**
 * Translate text using Groq AI (Unlimited, High Quality)
 * Handles texts of any length - no chunking needed!
 */
async function translateWithModel(model, text) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: TRANSLATION_SYSTEM_PROMPT // Use the new prompt that preserves tokens
      },
      {
        role: 'user',
        content: createTranslationPrompt(text) // Use template that reminds to preserve tokens
      }
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  let translatedText = completion.choices[0]?.message?.content || '';
  
  // CRITICAL: If no translation returned, throw error
  if (!translatedText || translatedText.trim().length === 0) {
    throw new Error('Translation returned empty result');
  }
  
  // POST-PROCESSING: Remove any leaked instructions from output
  translatedText = translatedText
    .replace(/^REMINDER:.*$/gim, '')
    .replace(/^Note: I have.*$/gim, '')
    .replace(/^Translate the following.*$/gim, '')
    .replace(/^Translation:.*$/gim, '')
    .replace(/Text to translate:.*$/gim, '')
    .trim();
  
  // VALIDATION: Check if translation actually happened
  // Turkish characters: ğ, ü, ş, ı, ö, ç, Ğ, Ü, Ş, İ, Ö, Ç
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  const hasTurkishChars = turkishChars.test(translatedText);
  
  // If output still contains Turkish characters and is similar to input, translation failed
  if (hasTurkishChars && translatedText.length > 50) {
    // Check if it's mostly the same as input (translation didn't happen)
    const similarity = calculateSimilarity(text, translatedText);
    if (similarity > 0.8) {
      throw new Error(`Translation failed - output still contains Turkish: ${translatedText.substring(0, 100)}...`);
    }
  }
  
  return translatedText;
}

/**
 * Enhance article content with TL;DR and key highlights using Groq AI
 * Adds a concise summary and bullet points at the beginning of the article
 */
async function enhanceArticleWithTLDR(content) {
  try {
    console.log(`   📝 Enhancing article with TL;DR and key highlights...`);
    
    // Use the best model for enhancement (TL;DR, highlights) - quality matters here
    const completion = await groq.chat.completions.create({
      model: GROQ_ENHANCEMENT_MODEL,
      messages: [
        {
          role: 'system',
          content: ARTICLE_ENHANCEMENT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: createArticleEnhancementPrompt(content)
        }
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    let enhancedContent = completion.choices[0]?.message?.content || content;
    
    // POST-PROCESSING: Remove any leaked instructions from output
    enhancedContent = enhancedContent
      .replace(/^REMINDER:.*$/gim, '')
      .replace(/^Note: I have.*$/gim, '')
      .replace(/^Analyze this article.*$/gim, '')
      .replace(/^Article content:.*$/gim, '')
      .trim();
    
    // Validate that enhancement actually happened (should contain TL;DR)
    if (!enhancedContent.includes('TL;DR') && !enhancedContent.includes('TLDR')) {
      console.log(`   ⚠️  TL;DR not found in response, using original content`);
      return content;
    }
    
    console.log(`   ✅ Article enhanced with TL;DR and key highlights`);
    return enhancedContent;
  } catch (error) {
    console.error(`   ⚠️  Failed to enhance article: ${error.message}`);
    return content; // Return original content if enhancement fails
  }
}

async function translateText(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Step 1: Preserve widgets by replacing them with placeholders
  const { content: cleanContent, widgets } = preserveWidgets(text);
  
  // Step 2: Translate the clean content (without widgets)
  const models = [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, GROQ_LAST_RESORT_MODEL];
  let translatedContent = null;
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await translateWithModel(model, cleanContent);
      
      // Quality check: Make sure translation is not garbage
      // Check for Turkish characters
      const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
      const hasTurkishChars = turkishChars.test(result);
      
      // Check for Chinese, Japanese, Korean (CJK) characters
      // Chinese: \u4e00-\u9fff, Japanese Hiragana: \u3040-\u309f, Katakana: \u30a0-\u30ff, Korean: \uac00-\ud7af
      const cjkChars = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
      const hasCJKChars = cjkChars.test(result);
      
      // Check for Arabic, Hebrew, Thai, and other non-Latin scripts
      const otherNonLatinChars = /[\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f\u0400-\u04ff]/;
      const hasOtherNonLatin = otherNonLatinChars.test(result);
      
      // Check if content is mostly English (at least 80% ASCII/Latin)
      const latinChars = result.replace(/[\s\d\p{P}]/gu, '').match(/[a-zA-ZÀ-ÿ]/g) || [];
      const totalChars = result.replace(/[\s\d\p{P}]/gu, '').length;
      const latinRatio = totalChars > 0 ? latinChars.length / totalChars : 1;
      const isMostlyEnglish = latinRatio >= 0.8;
      
      // Comprehensive instruction leakage detection
      const instructionLeakagePatterns = [
        '**Translation**',
        '**Reasoning',
        'REMINDER:',
        'Translate the following',
        'text to translate:',
        'Note: The translation',
        'Note: I have',
        'Note: This is',
        'Turkish text provided',
        'summary of the content',
        'Here is the translation',
        'Here\'s the translation',
        'I have translated',
        'Translation:',
        'Translated text:',
        'The above text',
        'as requested',
        'Please note that'
      ];
      
      const hasInstructionLeakage = instructionLeakagePatterns.some(pattern => 
        result.toLowerCase().includes(pattern.toLowerCase())
      );
      
      const isValidTranslation = 
        result && 
        result.trim().length > 0 && 
        !hasInstructionLeakage &&
        !hasTurkishChars &&
        !hasCJKChars && // No Chinese/Japanese/Korean
        !hasOtherNonLatin && // No Arabic/Hebrew/Thai/Cyrillic
        isMostlyEnglish; // At least 80% Latin characters
      
      if (isValidTranslation) {
        translatedContent = result;
        break; // Success, exit loop
      } else {
        let reason = 'unknown issue';
        if (hasTurkishChars) {
          reason = 'still contains Turkish characters';
        } else if (hasCJKChars) {
          reason = 'contains Chinese/Japanese/Korean characters';
        } else if (hasOtherNonLatin) {
          reason = 'contains non-Latin characters (Arabic/Hebrew/Cyrillic)';
        } else if (!isMostlyEnglish) {
          reason = `not mostly English (only ${(latinRatio * 100).toFixed(1)}% Latin chars)`;
        } else if (hasInstructionLeakage) {
          reason = 'contains instruction leakage (LLM added notes/meta-text)';
        }
        throw new Error(`Translation quality check failed - ${reason}`);
      }
    } catch (error) {
      const msg = String(error?.message || error);
      const isRateLimit = msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit');
      
      console.warn(`⚠️ Model ${model} failed: ${msg}`);
      
      // If it's a rate limit error, wait longer
      if (isRateLimit && i < models.length - 1) {
        console.log(`⏳ Rate limit detected, waiting 3 seconds before trying next model...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // If this is the last model, throw error
      if (i === models.length - 1) {
        throw new Error(`All translation models failed. Last error: ${msg}`);
      }
    }
  }
  
  if (!translatedContent) {
    throw new Error('All translation models failed');
  }
  
  // Step 3: Restore widgets back to the translated content
  const finalContent = restoreWidgets(translatedContent, widgets);
  
  // Log widget preservation stats
  if (widgets.length > 0) {
    console.log(`    🔧 Preserved ${widgets.length} widgets during translation`);
  }
  
  return finalContent;
}

/**
 * Translate article to English using Groq AI
 * Can handle full articles without chunking!
 */
/**
 * Post-process translation to ensure quality
 */
function cleanTranslation(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove any instruction leakage patterns
  const instructionPatterns = [
    /^REMINDER:.*$/gim,
    /^Note: I have.*$/gim,
    /^I have preserved.*$/gim,
    /^I have kept.*$/gim,
    /^Translate the following.*$/gim,
    /^Translation:.*$/gim,
    /^Text to translate:.*$/gim,
    /^Here is the translation.*$/gim,
    /^Here's the translation.*$/gim,
    /^The translation is.*$/gim,
  ];
  
  instructionPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // ============================================
  // AGGRESSIVE NUVEMMAG REMOVAL (FINAL PASS)
  // This is the last line of defense before saving
  // ============================================
  
  // Remove ALL Nuvemmag URLs (markdown links)
  cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*nuvemmag\.com[^)]*\)/gi, '');
  
  // Remove ALL standalone Nuvemmag URLs
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?nuvemmag\.com[^\s\)>\]"']*/gi, '');
  
  // Remove Nuvemmag text mentions (but keep context)
  cleaned = cleaned.replace(/\bNuvemMag\b/gi, '');
  
  // Remove lines that are ONLY empty markdown links
  cleaned = cleaned.replace(/^\s*\[\s*\]\([^)]*\)\s*$/gm, '');
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
}

async function translateArticle(article) {
  console.log(`🌐 Translating article with Groq AI...`);
  console.log(`   Title length: ${article.title.length} chars`);
  console.log(`   Content length: ${article.content.length} chars`);
  
  try {
    // Translate title
    console.log(`   🔤 Translating title...`);
    const translatedTitle = cleanTranslation(await translateText(article.title));
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate description
    console.log(`   📝 Translating description...`);
    const translatedDescription = cleanTranslation(await translateText(article.description));
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    
    // Translate full content (no chunking needed!)
    console.log(`   📄 Translating full content...`);
    let translatedContent = cleanTranslation(await translateText(article.content));
    
    // Enhance translated content with TL;DR and key highlights
    await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSLATION_DELAY));
    translatedContent = await enhanceArticleWithTLDR(translatedContent);
    
    // FINAL VALIDATION: Ensure no instruction leakage
    if (translatedTitle.includes('REMINDER:') || 
        translatedTitle.includes('Note: I have') ||
        translatedContent.includes('Text to translate:')) {
      throw new Error('Translation contains instruction leakage - rejecting');
    }
    
    // Create translated article object
    const translatedArticle = {
      ...article,
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
      originalTitle: article.title,
      originalContent: article.content, // Keep original for validation
    };
    
    // ============================================
    // STEP 1: LEGACY QUALITY CHECK (for compatibility)
    // ============================================
    console.log(`   🔍 Running legacy content quality check...`);
    try {
      assertContentQuality(translatedArticle);
      console.log(`   ✅ Legacy quality check PASSED`);
    } catch (error) {
      console.error(`   ❌ Legacy quality check FAILED: ${error.message}`);
      throw new Error(`Content quality validation failed: ${error.message}`);
    }
    
    // ============================================
    // STEP 2: SMART VALIDATION (NEW)
    // ============================================
    console.log(`   🔍 Running smart validation...`);
    const validation = validateArticle(translatedArticle);
    
    if (!validation.isValid) {
      const criticalErrors = validation.errors.filter(e => 
        e.includes('Turkish') || 
        e.includes('year') || 
        e.includes('instruction leakage') ||
        e.includes('translation error')
      );
      
      if (criticalErrors.length > 0) {
        console.error(`   ❌ Smart validation FAILED:`);
        criticalErrors.forEach(err => console.error(`      ❌ ${err}`));
        throw new Error(`Smart validation failed: ${criticalErrors.join('; ')}`);
      }
    }
    
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Validation warnings:`);
      validation.warnings.slice(0, 3).forEach(warn => console.log(`      ⚠️  ${warn}`));
    }
    
    console.log(`   ✅ Smart validation passed (Score: ${validation.score.toFixed(1)}/100)`);
    console.log(`   ✅ Translation complete and validated`);
    
    return translatedArticle;
  } catch (error) {
    console.error(`❌ Translation failed: ${error.message}`);
    return article; // Return original if translation fails
  }
}

/**
 * Main scraping function
 */
async function scrapeNews() {
  console.log('🚀 Starting Multi-Category Tech News Scraper...\n');
  console.log('='.repeat(60));
  console.log(`📂 Categories to scrape: ${CONFIG.CATEGORIES.length}`);
  CONFIG.CATEGORIES.forEach(cat => console.log(`   • ${cat.tag}: ${cat.name}`));
  console.log('='.repeat(60));
  
  // Get current article count from Supabase
  const currentCount = await getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);
  
  // Scrape all categories
  const articlesWithCategories = await scrapeAllCategories();
  
  if (articlesWithCategories.length === 0) {
    console.log('⚠️ No articles found in any category. Exiting.');
    return;
  }
  
  console.log(`📝 Found ${articlesWithCategories.length} articles total...\n`);
  
  // Bulk check: Get all existing articles from Supabase
  const allUrls = articlesWithCategories.map(article => article.url);
  console.log(`🔍 Checking which articles already exist in database...`);
  const existingUrls = await getExistingArticles(allUrls);
  
  // Filter to only new articles
  const newArticles = articlesWithCategories.filter(article => !existingUrls.has(article.url));
  const duplicateCount = articlesWithCategories.length - newArticles.length;
  
  console.log(`✅ Found ${newArticles.length} new articles to process`);
  console.log(`⏭️  Skipping ${duplicateCount} existing articles\n`);
  
  if (newArticles.length === 0) {
    console.log('ℹ️  All articles already exist in database. Nothing to process.');
    return;
  }
  
  let newArticlesCount = 0;
  let failedCount = 0;
  let consecutiveFailures = 0; // Circuit breaker
  let circuitBreakerTriggered = false;
  
  for (const { url, category } of newArticles) {
    // Circuit breaker: Stop if too many consecutive failures
    if (consecutiveFailures >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n🚨 Circuit breaker activated: ${consecutiveFailures} consecutive failures`);
      console.log(`⏸️  Stopping to avoid wasting API credits`);
      console.log(`💡 Remaining articles will be processed in next run\n`);
      
      circuitBreakerTriggered = true;
      const remainingArticles = newArticles.length - (newArticlesCount + failedCount);
      
      // Send Telegram notification for circuit breaker
      await sendTelegramNotification(
        `🚨 <b>Haber Scraper: Circuit Breaker Aktif</b>\n\n` +
        `⚠️  <b>${consecutiveFailures} ardışık hata</b> tespit edildi\n` +
        `⏸️  API credit'lerini korumak için durduruldu\n\n` +
        `📊 <b>Durum:</b>\n` +
        `✅ Başarılı: ${newArticlesCount}\n` +
        `❌ Başarısız: ${failedCount}\n` +
        `⏭️  Kalan: ${remainingArticles}\n\n` +
        `💡 Kalan haberler sonraki çalışmada işlenecek`
      );
      
      break;
    }
    
    console.log(`📰 [${category}] Processing: ${url}`);
    
    // Scrape article details
    const article = await scrapeArticleDetails(url);
    
    if (!article) {
      failedCount++;
      consecutiveFailures++;
      console.log(`❌ Failed (${consecutiveFailures} consecutive failures)\n`);
      continue;
    }
    
    // Reset consecutive failures on success
    consecutiveFailures = 0;
    
    try {
      // Translate article
      const translatedArticle = await translateArticle(article);
      
      // Quality check: Make sure translation actually happened
      if (!translatedArticle || translatedArticle.title === article.title || 
          translatedArticle.title.includes('**Translation**') ||
          translatedArticle.content.includes('**Translation**')) {
        throw new Error('Translation failed or returned original/garbage text');
      }
      
      // Prepare article data
      const articleData = {
        ...translatedArticle,
        category, // Add category tag
        slug: generateSlug(translatedArticle.title), // Generate English slug from translated title
      };
      
      // Save to Supabase
      const result = await saveArticle(articleData);
      
      if (result.success) {
        newArticlesCount++;
        console.log(`✅ [${category}] Article added successfully to Supabase!\n`);
      } else {
        failedCount++;
        console.log(`❌ [${category}] Failed to save article to database\n`);
      }
    } catch (translationError) {
      failedCount++;
      console.log(`❌ [${category}] Translation failed: ${translationError.message}`);
      console.log(`❌ [${category}] Skipping article to avoid saving bad translation\n`);
      continue; // Skip this article, don't save to DB
    }
    
    // Rate limiting between articles (Firecrawl free: 10 req/min, we use 10s for safety)
    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }
  
  // Get final count
  const finalCount = await getArticleCount();
  
  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 New articles added: ${newArticlesCount}`);
  console.log(`⏭️  Skipped (duplicates): ${duplicateCount}`);
  console.log(`❌ Failed to process: ${failedCount}`);
  console.log(`📊 Total articles in database: ${finalCount}`);
  console.log(`⏰ Last updated: ${new Date().toISOString()}`);
  console.log(`💾 Storage: Supabase PostgreSQL`);
  console.log('='.repeat(60));
  
  // Send Telegram summary notification (only if NOT circuit breaker)
  if (!circuitBreakerTriggered) {
    const totalProcessed = newArticlesCount + failedCount;
    const successRate = totalProcessed > 0 ? Math.round((newArticlesCount / totalProcessed) * 100) : 0;
    
    // Determine status emoji and message
    let statusEmoji = '✅';
    let statusText = 'Tamamlandı';
    
    if (failedCount > 0 && newArticlesCount === 0) {
      statusEmoji = '❌';
      statusText = 'Başarısız';
    } else if (failedCount > newArticlesCount) {
      statusEmoji = '⚠️';
      statusText = 'Kısmi Başarı';
    }
    
    await sendTelegramNotification(
      `${statusEmoji} <b>Haber Scraper: ${statusText}</b>\n\n` +
      `📊 <b>İşlem Özeti:</b>\n` +
      `✅ Yeni haber: ${newArticlesCount}\n` +
      `⏭️  Atlanan: ${duplicateCount}\n` +
      `❌ Başarısız: ${failedCount}\n` +
      `📈 Başarı oranı: ${successRate}%\n\n` +
      `💾 <b>Veritabanı:</b> ${finalCount} toplam haber\n` +
      `⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
    );
  }
}

// Run scraper
scrapeNews().catch(async error => {
  console.error('💥 Fatal error:', error);
  
  // Send fatal error notification to Telegram
  await sendTelegramNotification(
    `💥 <b>Haber Scraper: Fatal Hata</b>\n\n` +
    `❌ <b>Kritik hata oluştu ve scraper durdu</b>\n\n` +
    `🔍 <b>Hata detayı:</b>\n` +
    `<code>${error.message || 'Bilinmeyen hata'}</code>\n\n` +
    `⚠️  Lütfen log'ları kontrol edin ve sistemi gözden geçirin`
  );
  
  process.exit(1);
});
