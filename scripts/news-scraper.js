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

// ─── URL & Content Blocklists ───

const BLOCKED_URL_SLUGS = [
  'hesabim', 'my-account', 'giris', 'login', 'kayit', 'register',
  'sepet', 'cart', 'checkout', 'odeme', 'wp-admin', 'wp-login',
  'wp-register', 'feed', 'rss', 'sitemap', 'robots', 'favicon',
  'iletisim', 'contact', 'hakkimizda', 'about', 'gizlilik',
  'privacy', 'terms', 'kvkk', 'cerez', 'cookie', 'yazarlar',
  'author', 'profil', 'profile', 'ayarlar', 'settings',
  'abone', 'subscribe', 'newsletter', 'search', 'ara',
];

const GARBAGE_CONTENT_PATTERNS = [
  /we use cookies/i,
  /cookie\s*(policy|settings|preferences|consent)/i,
  /çerez\s*(politika|ayar)/i,
  /by clicking .{0,20}accept/i,
  /personalized ads/i,
  /sign\s*in|log\s*in|create\s*account/i,
  /forgot\s*(your\s*)?password/i,
  /şifre(mi)?\s*unuttum/i,
  /giriş\s*yap|kayıt\s*ol|hesap\s*oluştur/i,
  /your\s*cart\s*is\s*empty/i,
  /add\s*to\s*cart/i,
];

const GARBAGE_TITLE_PATTERNS = [
  /^my\s*account$/i,
  /^hesab[ıi]m$/i,
  /^(giriş|kayıt|login|register|sign\s*up|sign\s*in)$/i,
  /^(cart|sepet|checkout|ödeme)$/i,
  /^(contact|iletişim|hakkımızda|about)$/i,
  /^(search|ara|arama)$/i,
  /^(cookie|çerez|privacy|gizlilik)$/i,
  /^(404|page not found|sayfa bulunamadı)$/i,
];

function isBlockedUrl(url) {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, '').toLowerCase();
    const slug = pathname.split('/').pop();
    return BLOCKED_URL_SLUGS.some(blocked => slug === blocked || pathname.includes(`/${blocked}/`) || pathname.includes(`/${blocked}`));
  } catch {
    return false;
  }
}

function isGarbageContent(title, content) {
  for (const pattern of GARBAGE_TITLE_PATTERNS) {
    if (pattern.test(title?.trim())) return `Blocked title: "${title}"`;
  }
  const sample = (content || '').substring(0, 1500);
  let hits = 0;
  for (const pattern of GARBAGE_CONTENT_PATTERNS) {
    if (pattern.test(sample)) hits++;
  }
  if (hits >= 2) return `Content matched ${hits} garbage patterns (cookie/login/form)`;
  return null;
}

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
- Do NOT include utility pages: /hesabim/, /giris/, /kayit/, /iletisim/, /hakkimizda/, /gizlilik/, /cerez/, /my-account/, /login/, /register/, /contact/, /about/, /privacy/, /cookie/
- ONLY include actual news article URLs

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
      if (isBlockedUrl(article.url)) {
        console.log(`  🚫 Blocked non-article URL: ${article.url}`);
        continue;
      }

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
  const filtered = matches.filter(url => !url.includes('/category/') && !isBlockedUrl(url));

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

  const firecrawlHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CONFIG.FIRECRAWL_API_KEY}`,
  };
  const slug = url.split('/').pop();

  const [markdownResult, htmlResult] = await Promise.all([
    fetchWithRetry(
      'https://api.firecrawl.dev/v2/scrape',
      {
        method: 'POST',
        headers: firecrawlHeaders,
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          includeTags: [
            '.content__post--article',
            '.geoit_entry-content',
          ],
          excludeTags: [
            '.cky-consent-container',
            '.cky-modal',
            '.cky-overlay',
            '.geo-reaction-wrapper',
            '.geo-reaction-bar',
            '.geo-reaction-title',
            '.content__related-posts',
            '.comments-area',
            '.comment-respond',
            '.post-views',
            '.geo-notification',
            '.content__post--meta-social',
            '.content__post--article_tags',
            '.geo-lazy',
            'footer',
            'header',
            'nav',
          ],
          waitFor: 3000,
        }),
      },
      `article-markdown ${slug}`
    ),
    fetchWithRetry(
      'https://api.firecrawl.dev/v2/scrape',
      {
        method: 'POST',
        headers: firecrawlHeaders,
        body: JSON.stringify({
          url,
          formats: ['html'],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      },
      `article-html ${slug}`
    ),
  ]);

  if (!markdownResult.success) {
    console.error(`   ❌ Failed to scrape article: ${markdownResult.status || markdownResult.error}`);
    return null;
  }

  const markdownData = (await markdownResult.response.json())?.data;
  const htmlData = htmlResult.success ? (await htmlResult.response.json())?.data : null;

  if (!markdownData) {
    console.error(`   ❌ No article data in response`);
    return null;
  }

  let markdownContent = markdownData?.markdown || '';
  let htmlContent = htmlData?.html || '';
  const metadata = markdownData?.metadata || htmlData?.metadata || {};
  if (markdownData) markdownData.markdown = null;
  if (htmlData) htmlData.html = null;

  if (!markdownContent && !htmlContent) {
    console.error(`   ❌ No content found for article`);
    return null;
  }

  let embedTokens = [];
  if (htmlContent) {
    try {
      const { contentWithTokens, embedCount } = htmlToTokens(htmlContent);
      embedTokens = contentWithTokens.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/g) || [];
      const total = embedCount.youtube + embedCount.twitter + embedCount.tiktok;
      if (total > 0) {
        console.log(`  ✅ Extracted ${total} embed(s) from raw HTML (YT:${embedCount.youtube} TW:${embedCount.twitter} TT:${embedCount.tiktok})`);
      }
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
    if (/^\s*Share\s*$/i.test(trimmed)) return false;
    if (/^\s*\d+\s+min\s+read\s*$/i.test(trimmed)) return false;
    if (/^\s*\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*$/i.test(trimmed)) return false;
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

  // Extract original source before trimming (source refs are often near the end)
  let originalSource = '';
  const sourcePatterns = [
    /(?:kaynak|source)[:\s]+(https?:\/\/[^\s\)\]>\n"']+)/i,
    /(?:kaynak|source)[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
    /via[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
  ];
  for (const pattern of sourcePatterns) {
    const match = markdownContent.match(pattern);
    if (match) {
      const url = match[2] || match[1];
      originalSource = url.trim().replace(/[.,;:!?\s]+$/, '');
      break;
    }
  }

  // Trim trailing non-article content (cookie banners, comment sections, etc.)
  const CONTENT_END_MARKERS = [
    /\n+Post Views\s*:\s*\d+/i,
    /\n+What (?:is|do) (?:your|you think about)/i,
    /\n+(?:We value your privacy|We use cookies)/i,
    /\n+Notifications?\s*\n/i,
    /\n+Related Topics\s*\n/i,
    /\n+Similar Articles\s*\n/i,
    /\n+Show Comments/i,
    /\n+No more articles/i,
    /\n+(?:Log\s*in|Sign\s*in|Login)\s*\n/i,
    /\n+\d+\s+(?:I liked it|I am applauding)/i,
    /\n+CustomizeDeclineAccept/i,
    /\n+NecessaryAlways Active/i,
  ];

  let earliestTrimIndex = -1;
  for (const marker of CONTENT_END_MARKERS) {
    const match = marker.exec(markdownContent);
    if (match && (earliestTrimIndex === -1 || match.index < earliestTrimIndex)) {
      earliestTrimIndex = match.index;
    }
  }
  if (earliestTrimIndex > 0) {
    const trimmedChars = markdownContent.length - earliestTrimIndex;
    markdownContent = markdownContent.slice(0, earliestTrimIndex).trim();
    console.log(`   ✂️  Trimmed ${trimmedChars} trailing chars (non-article content)`);
  }

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

  await notifyTelegram(`🚀 <b>Scraper Başladı</b>\n📂 ${CONFIG.CATEGORIES.length} kategori | 🕐 ${new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})}`);

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
  let garbageNotifyCount = 0;

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

    if (isBlockedUrl(url)) {
      console.log(`🚫 [${category}] Blocked non-article URL: ${url}\n`);
      continue;
    }

    console.log(`📰 [${category}] Processing: ${url}`);
    processedInThisRun.add(url);

    const article = await scrapeArticleDetails(url);

    if (!article) {
      failedCount++;
      consecutiveFailures++;
      console.log(`❌ Failed (${consecutiveFailures} consecutive failures)\n`);
      if (consecutiveFailures >= 2) {
        notifyTelegram(`❌ <b>Makale scrape başarısız</b> (${consecutiveFailures} ardışık)\n${url}`);
      }
      continue;
    }

    const garbageReason = isGarbageContent(article.title, article.content);
    if (garbageReason) {
      console.log(`🚫 [${category}] Rejected garbage page: ${garbageReason}\n`);
      if (garbageNotifyCount < 3) {
        garbageNotifyCount++;
        notifyTelegram(`🚫 <b>Garbage reddedildi</b>\n${garbageReason.substring(0,100)}`);
      }
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
      notifyTelegram(`❌ <b>Çeviri hatası</b> [${category}]\n<code>${translationError.message.substring(0,120)}</code>`);
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
