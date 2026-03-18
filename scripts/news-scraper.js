/**
 * Tech News Scraper — Entry Point
 *
 * Scrapes tech news from Nuvemmag, translates to English, and stores in Supabase.
 * Business logic is split into sub-modules under scripts/lib/scraper/.
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { supabase } from './lib/supabaseAdmin.js';
import { env } from './lib/config.js';
import { notifyTelegram } from './lib/telegram.js';
import { htmlToTokens } from './embeds/extractEmbeds.js';
import { replaceTikTokBlockquote, replaceTwitterBlockquote, cleanSocialEmbedRemnants } from './embeds/cleanMarkdownEmbeds.js';
import { extractAllEmbedsFromMarkdown } from './embeds/extractMarkdownEmbeds.js';

import { SCRAPER_CONFIG, GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL, GROQ_LAST_RESORT_MODEL } from './lib/scraper/config.js';
import { getTurkeyDate, isFromToday, isRecent, getDatePriority, parseTurkishDate } from './lib/scraper/dateUtils.js';
import { getExistingArticles, saveArticle, getArticleCount, extractSlugFromUrl } from './lib/scraper/database.js';
import { translateArticle } from './lib/scraper/translator.js';

import { TRANSLATION_SYSTEM_PROMPT, createTranslationPrompt, ARTICLE_ENHANCEMENT_SYSTEM_PROMPT, createArticleEnhancementPrompt, validateTokenPreservation } from './translate/prompt.js';
import { assertContentQuality, validateArticleContent } from './validation/contentQualityCheck.js';
import { validateArticle, autoFixArticle, validateDate, validateTitle, validateContent, validateDescription } from './validation/smartArticleProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = SCRAPER_CONFIG;

const groq = new Groq({ apiKey: CONFIG.GROQ_API_KEY });

const groqParser = new Groq({ apiKey: CONFIG.GROQ_PARSER_API_KEY });

function hasNuvemmagDomain(line) {
  const urlRegex = /(https?:\/\/[^\s)>]+)/ig;
  let match;
  while ((match = urlRegex.exec(line)) !== null) {
    try {
      const hostname = new URL(match[1]).hostname.toLowerCase();
      if (hostname === 'nuvemmag.com' || hostname.endsWith('.nuvemmag.com')) {
        return true;
      }
    } catch { /* ignore invalid URL */ }
  }
  return false;
}

function generateArticleId(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function fetchWithRetry(url, options, context = '') {
  const maxRetries = CONFIG.MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) console.log(`  🔄 Retry ${attempt - 1}/${maxRetries - 1} for ${context}...`);

      const response = await fetch(url, options);
      if (response.ok) return { success: true, response };

      const status = response.status;
      const isRetryable = [408, 502, 503].includes(status);

      if (!isRetryable || attempt === maxRetries) {
        return { success: false, status, response };
      }

      const delay = 3000 * attempt;
      console.log(`  ⚠️  ${status} error on ${context}, retry in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      if (attempt === maxRetries) return { success: false, error: error.message };
      const delay = 3000 * attempt;
      console.log(`  ⚠️  Network error on ${context}, retry in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

async function parseArticlesWithAI(markdown, categoryTag) {
  console.log(`  🤖 Using AI to parse article list for ${categoryTag}...`);

  try {
    const completion = await groqParser.chat.completions.create({
      model: 'llama-3.1-8b-instant',
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
[{"url": "https://nuvemmag.com/article-slug/", "date": "3 gün önce"}]`,
        },
        {
          role: 'user',
          content: `Extract all article URLs and their dates from this Turkish tech news category page. Return ONLY a JSON array.\n\n${markdown.substring(0, 10000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    let jsonStr = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const articles = JSON.parse(jsonStr);
    if (!Array.isArray(articles)) throw new Error('AI response is not an array');

    console.log(`  ✅ AI extracted ${articles.length} articles`);

    const processedArticles = [];

    for (const article of articles) {
      if (!article.url || !article.url.includes('nuvemmag.com/')) continue;
      if (article.url.includes('/category/')) continue;

      const parsedDate = parseTurkishDate(article.date);
      if (!parsedDate) {
        const today = new Date();
        processedArticles.push({
          url: article.url,
          category: categoryTag,
          scrapedDate: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
          datePriority: 50,
        });
        continue;
      }

      if (!isRecent(parsedDate)) continue;

      processedArticles.push({
        url: article.url,
        category: categoryTag,
        scrapedDate: parsedDate,
        datePriority: getDatePriority(parsedDate),
      });
    }

    processedArticles.sort((a, b) => b.datePriority - a.datePriority);
    return processedArticles;
  } catch (error) {
    console.error(`  ❌ AI parsing failed: ${error.message}`);
    return null;
  }
}

// ─── Scraping functions (website-specific, kept in entry point) ───

async function scrapeArticleListFromCategory(categoryUrl, categoryTag) {
  console.log(`\n📂 Scraping category: ${categoryTag} from ${categoryUrl}`);

  const firecrawlResult = await fetchWithRetry(
    'https://api.firecrawl.dev/v1/scrape',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: categoryUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    },
    `category ${categoryTag}`
  );

  if (!firecrawlResult.success) {
    console.error(`  ❌ Failed to scrape category: ${firecrawlResult.status || firecrawlResult.error}`);
    return [];
  }

  const data = await firecrawlResult.response.json();
  const markdown = data?.data?.markdown;

  if (!markdown) {
    console.error(`  ❌ No markdown content in response for ${categoryTag}`);
    return [];
  }

  console.log(`  📄 Got ${markdown.length} chars of markdown`);

  const aiArticles = await parseArticlesWithAI(markdown, categoryTag);

  if (aiArticles && aiArticles.length > 0) {
    const limited = aiArticles.slice(0, CONFIG.MAX_ARTICLES_PER_CATEGORY);
    console.log(`  📊 Using ${limited.length} articles from AI parsing (limited from ${aiArticles.length})`);
    return limited;
  }

  console.log(`  ⚠️ AI parsing returned no results, trying regex fallback...`);
  const urlRegex = /https:\/\/nuvemmag\.com\/(?:post\/)?[a-z0-9-]+\/?/gi;
  const matches = [...new Set(markdown.match(urlRegex) || [])];
  const filtered = matches.filter(url => !url.includes('/category/'));

  const today = new Date();
  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const fallbackArticles = filtered.slice(0, CONFIG.MAX_ARTICLES_PER_CATEGORY).map(url => ({
    url,
    category: categoryTag,
    scrapedDate: todayStr,
    datePriority: 50,
  }));

  console.log(`  📊 Regex fallback found ${fallbackArticles.length} articles`);
  return fallbackArticles;
}

async function scrapeAllCategories() {
  const allArticles = [];

  for (const category of CONFIG.CATEGORIES) {
    try {
      const articles = await scrapeArticleListFromCategory(category.url, category.tag);
      allArticles.push(...articles);

      if (allArticles.length >= CONFIG.MAX_ARTICLES_PER_RUN) {
        console.log(`\n⚡ Reached max articles limit (${CONFIG.MAX_ARTICLES_PER_RUN}). Stopping category scraping.`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error scraping category ${category.tag}: ${error.message}`);
    }
  }

  allArticles.sort((a, b) => b.datePriority - a.datePriority);
  return allArticles;
}

// scrapeArticleDetails is kept inline because it contains website-specific parsing logic
// that changes frequently and is tightly coupled to Nuvemmag's HTML structure
async function scrapeArticleDetails(url) {
  console.log(`   🔍 Scraping article details: ${url}`);

  const firecrawlResult = await fetchWithRetry(
    'https://api.firecrawl.dev/v1/scrape',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    },
    `article ${url.split('/').pop()}`
  );

  if (!firecrawlResult.success) {
    console.error(`   ❌ Failed to scrape article: ${firecrawlResult.status || firecrawlResult.error}`);
    return null;
  }

  const data = await firecrawlResult.response.json();
  const articleData = data?.data;

  if (!articleData) {
    console.error(`   ❌ No article data in response`);
    return null;
  }

  let markdownContent = articleData.markdown || '';
  let htmlContent = articleData.html || '';
  const metadata = articleData.metadata || {};
  articleData.markdown = null;
  articleData.html = null;

  if (!markdownContent && !htmlContent) {
    console.error(`   ❌ No content found for article`);
    return null;
  }

  // Extract embeds from HTML before processing markdown
  let embedTokens = [];
  if (htmlContent) {
    try {
      const { contentWithTokens } = htmlToTokens(htmlContent);
      embedTokens = contentWithTokens.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/g) || [];
    } catch { /* ignore embed extraction errors */ }
  }

  htmlContent = null;

  // Clean markdown: remove Nuvemmag branding and URLs
  const lines = markdownContent.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (hasNuvemmagDomain(trimmed)) return false;
    if (/^\[?\s*!\[[^\]]*\]\([^)]*nuvemmag[^)]*\)/i.test(trimmed)) return false;
    if (/^\[?\s*!\[[^\]]*nuvemmag[^\]]*\]/i.test(trimmed)) return false;
    return true;
  });
  markdownContent = cleanedLines.join('\n');

  // Process social embeds in markdown
  markdownContent = replaceTikTokBlockquote(markdownContent);
  markdownContent = replaceTwitterBlockquote(markdownContent);
  markdownContent = cleanSocialEmbedRemnants(markdownContent);

  // Extract and inject embed tokens from markdown
  const markdownEmbeds = extractAllEmbedsFromMarkdown(markdownContent);
  if (markdownEmbeds.length > 0) {
    for (const embed of markdownEmbeds) {
      if (!embedTokens.some(t => t === embed.token)) {
        embedTokens.push(embed.token);
      }
      markdownContent = markdownContent.replace(embed.originalText, embed.token);
    }
  }

  // Inject HTML embed tokens that weren't found in markdown
  if (embedTokens.length > 0) {
    const existingTokens = markdownContent.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/gi) || [];
    const newTokens = embedTokens.filter(t => !existingTokens.includes(t));
    if (newTokens.length > 0) {
      markdownContent = markdownContent.trimEnd() + '\n\n' + newTokens.join('\n\n') + '\n\n';
    }
  }

  // Clean up excessive whitespace
  markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim();

  // Extract title from metadata or markdown
  let title = metadata.title || metadata['og:title'] || '';
  title = title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();

  if (!title) {
    const h1Match = markdownContent.match(/^#\s+(.+)$/m);
    if (h1Match) title = h1Match[1].trim();
  }

  // Extract description
  let description = metadata.description || metadata['og:description'] || '';
  description = description.replace(/\bNuvemMag\b/gi, '').trim();

  if (!description && markdownContent) {
    const firstParagraph = markdownContent.split('\n\n').find(p => p.trim().length > 50 && !p.startsWith('#'));
    if (firstParagraph) description = firstParagraph.trim().substring(0, 300);
  }

  // Extract image
  let image = metadata['og:image'] || metadata.image || '';

  // Extract date
  let date = '';
  if (metadata.date || metadata.publishDate || metadata['article:published_time']) {
    const rawDate = metadata.date || metadata.publishDate || metadata['article:published_time'];
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      }
    } catch { /* ignore */ }
  }
  if (!date) {
    const today = new Date();
    date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  }

  // Extract original source from article content
  let originalSource = '';
  const sourcePatterns = [
    /kaynak[:\s]*([^\n]+)/i,
    /source[:\s]*([^\n]+)/i,
    /via[:\s]*\[([^\]]+)\]/i,
  ];
  for (const pattern of sourcePatterns) {
    const match = markdownContent.match(pattern);
    if (match) {
      originalSource = match[1].trim();
      break;
    }
  }

  if (!title || !markdownContent) {
    console.error(`   ❌ Missing required fields (title or content)`);
    return null;
  }

  console.log(`   ✅ Scraped: "${title.substring(0, 60)}..." (${markdownContent.length} chars)`);

  return {
    title,
    description: description || title,
    content: markdownContent,
    image,
    date,
    sourceUrl: url,
    originalSource: originalSource || url,
    slug: extractSlugFromUrl(url) || generateSlug(title),
  };
}

// ─── Main orchestrator ───

async function scrapeNews() {
  console.log('🚀 Starting Multi-Category Tech News Scraper...\n');
  console.log('='.repeat(60));
  console.log(`📂 Categories to scrape: ${CONFIG.CATEGORIES.length}`);
  CONFIG.CATEGORIES.forEach(cat => console.log(`   • ${cat.tag}: ${cat.name}`));
  console.log('='.repeat(60));

  const currentCount = await getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);

  const articlesWithCategories = await scrapeAllCategories();

  if (articlesWithCategories.length === 0) {
    console.log('⚠️ No articles found in any category. Exiting.');
    return;
  }

  console.log(`📝 Found ${articlesWithCategories.length} articles total...\n`);

  const allUrls = articlesWithCategories.map(a => a.url);
  console.log(`🔍 Checking which articles already exist in database...`);
  const existingUrls = await getExistingArticles(allUrls);

  const newArticles = articlesWithCategories.filter(a => !existingUrls.has(a.url));
  const duplicateCount = articlesWithCategories.length - newArticles.length;

  console.log(`✅ Found ${newArticles.length} new articles to process`);
  console.log(`⏭️  Skipping ${duplicateCount} existing articles\n`);

  if (newArticles.length === 0) {
    console.log('ℹ️  All articles already exist in database. Nothing to process.');
    return;
  }

  let newArticlesCount = 0;
  let failedCount = 0;
  let consecutiveFailures = 0;
  let circuitBreakerTriggered = false;
  const processedInThisRun = new Set();

  for (const { url, category } of newArticles) {
    if (processedInThisRun.has(url)) {
      console.log(`⏭️  [${category}] Skipping (already processed in this run): ${url.split('/').pop()}`);
      continue;
    }

    if (consecutiveFailures >= CONFIG.MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n🚨 Circuit breaker activated: ${consecutiveFailures} consecutive failures`);
      circuitBreakerTriggered = true;
      const remaining = newArticles.length - (newArticlesCount + failedCount);

      await notifyTelegram(
        `🚨 <b>Haber Scraper: Circuit Breaker Aktif</b>\n\n` +
        `⚠️  <b>${consecutiveFailures} ardışık hata</b> tespit edildi\n` +
        `📊 ✅ Başarılı: ${newArticlesCount} | ❌ Başarısız: ${failedCount} | ⏭️ Kalan: ${remaining}`
      );
      break;
    }

    console.log(`📰 [${category}] Processing: ${url}`);
    processedInThisRun.add(url);

    const article = await scrapeArticleDetails(url);

    if (!article) {
      failedCount++;
      consecutiveFailures++;
      console.log(`❌ Failed (${consecutiveFailures} consecutive failures)\n`);
      continue;
    }

    consecutiveFailures = 0;

    try {
      const translatedArticle = await translateArticle(article);

      if (!translatedArticle || translatedArticle.title === article.title ||
          translatedArticle.title.includes('**Translation**') ||
          translatedArticle.content.includes('**Translation**')) {
        throw new Error('Translation failed or returned original/garbage text');
      }

      const articleData = {
        ...translatedArticle,
        category,
        slug: generateSlug(translatedArticle.title),
      };

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
      console.log(`❌ [${category}] Translation failed: ${translationError.message}\n`);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }

  const finalCount = await getArticleCount();

  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 New: ${newArticlesCount} | Skipped: ${duplicateCount} | Failed: ${failedCount} | Total: ${finalCount}`);
  console.log('='.repeat(60));

  if (!circuitBreakerTriggered) {
    const totalProcessed = newArticlesCount + failedCount;
    const successRate = totalProcessed > 0 ? Math.round((newArticlesCount / totalProcessed) * 100) : 0;

    let statusEmoji = '✅';
    if (failedCount > 0 && newArticlesCount === 0) statusEmoji = '❌';
    else if (failedCount > newArticlesCount) statusEmoji = '⚠️';

    await notifyTelegram(
      `${statusEmoji} <b>Haber Scraper</b>\n\n` +
      `✅ Yeni: ${newArticlesCount} | ⏭️ Atlanan: ${duplicateCount} | ❌ Başarısız: ${failedCount}\n` +
      `📈 Başarı: ${successRate}% | 💾 Toplam: ${finalCount}\n` +
      `⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
    );
  }
}

scrapeNews().catch(async error => {
  console.error('💥 Fatal error:', error);
  await notifyTelegram(
    `💥 <b>Haber Scraper: Fatal Hata</b>\n\n` +
    `<code>${error.message || 'Bilinmeyen hata'}</code>`
  );
  process.exit(1);
});
