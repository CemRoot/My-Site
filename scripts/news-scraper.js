/**
 * Tech News Scraper — Entry Point (Orchestration Only)
 *
 * Scrapes tech news from Nuvemmag, translates to English, and stores in Supabase.
 * All scraping logic is delegated to ScraperRouter (Firecrawl → Cheerio fallback).
 * Business logic lives in sub-modules under scripts/lib/scraper/.
 */

import { notifyTelegram } from './lib/telegram.js';
import { SCRAPER_CONFIG } from './lib/scraper/config.js';
import { getExistingArticles, saveArticle, getArticleCount, isContentHashDuplicate } from './lib/scraper/database.js';
import { translateArticle } from './lib/scraper/translator.js';
import { ScraperRouter } from './lib/scraper/scrapers/ScraperRouter.js';

const CONFIG = SCRAPER_CONFIG;

// ─── Content validation helpers ───

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

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// ─── Category aggregation ───

async function scrapeAllCategories(router) {
  const allArticles = [];

  for (const category of CONFIG.CATEGORIES) {
    try {
      const articles = await router.scrapeArticleList(category.url, category.tag);
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

// ─── Main orchestrator ───

async function scrapeNews() {
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);

  console.log('🚀 Starting Multi-Category Tech News Scraper...\n');
  console.log('='.repeat(60));
  console.log(`📂 Categories to scrape: ${CONFIG.CATEGORIES.length}`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  CONFIG.CATEGORIES.forEach(cat => console.log(`   • ${cat.tag}: ${cat.name}`));
  console.log('='.repeat(60));

  await notifyTelegram(
    `🚀 <b>Scraper Başladı</b>\n` +
    `📂 ${CONFIG.CATEGORIES.length} kategori | 🔧 ${scraperRouter.getActiveScraperName()}\n` +
    `🕐 ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
  );

  const currentCount = await getArticleCount();
  console.log(`\n📊 Current database: ${currentCount} articles\n`);

  const articlesWithCategories = await scrapeAllCategories(scraperRouter);

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

    console.log(`📰 [${category}] Processing: ${url}`);
    processedInThisRun.add(url);

    const article = await scraperRouter.scrapeArticleDetails(url);

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
        notifyTelegram(`🚫 <b>Garbage reddedildi</b>\n${garbageReason.substring(0, 100)}`);
      }
      continue;
    }

    // Layer 3: content_hash duplicate check — catches same article with different URL
    const isHashDup = await isContentHashDuplicate(article.title);
    if (isHashDup) {
      console.log(`⏭️  [${category}] Skipping — same article already in DB (hash match): ${url.split('/').pop()}\n`);
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
      notifyTelegram(`❌ <b>Çeviri hatası</b> [${category}]\n<code>${translationError.message.substring(0, 120)}</code>`);
      continue;
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
  }

  const finalCount = await getArticleCount();

  console.log('='.repeat(60));
  console.log(`🎉 Multi-Category Scraping Completed!`);
  console.log(`📊 New: ${newArticlesCount} | Skipped: ${duplicateCount} | Failed: ${failedCount} | Total: ${finalCount}`);
  console.log(`🔧 Scraper used: ${scraperRouter.getActiveScraperName()}`);
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
      `🔧 Scraper: ${scraperRouter.getActiveScraperName()}\n` +
      `⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
    );
  }
}

// ─── Single-article test mode ───

async function testSingleUrl(url) {
  const scraperRouter = new ScraperRouter(CONFIG.FIRECRAWL_API_KEY);

  console.log(`\n🧪 TEST MODE — Single article pipeline`);
  console.log(`📰 URL: ${url}`);
  console.log(`🔧 Scraper: ${scraperRouter.getActiveScraperName()}`);
  console.log('='.repeat(60));

  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('🔍 DRY RUN — will not save to database\n');

  console.log('\n1️⃣  scrapeArticleDetails()...');
  const article = await scraperRouter.scrapeArticleDetails(url);

  if (!article) {
    console.error('❌ scrapeArticleDetails returned null — scraping failed');
    process.exit(1);
  }

  console.log(`   ✅ Title: "${article.title.substring(0, 70)}"`);
  console.log(`   ✅ Content: ${article.content.length} chars`);
  console.log(`   ✅ Source: ${article.originalSource}`);
  console.log(`   ✅ Slug: ${article.slug}`);

  console.log('\n2️⃣  isGarbageContent()...');
  const garbageReason = isGarbageContent(article.title, article.content);
  if (garbageReason) {
    console.error(`   ❌ GARBAGE REJECTED: ${garbageReason}`);
    process.exit(1);
  }
  console.log('   ✅ Passed — no garbage detected');

  console.log('\n3️⃣  translateArticle()...');
  const translatedArticle = await translateArticle(article);

  if (!translatedArticle || translatedArticle.title === article.title) {
    console.error('   ❌ Translation failed or returned original text');
    process.exit(1);
  }

  console.log(`   ✅ Title: "${translatedArticle.title}"`);
  console.log(`   ✅ Description: "${translatedArticle.description.substring(0, 100)}..."`);
  console.log(`   ✅ Content: ${translatedArticle.content.length} chars`);

  console.log('\n── Translated content (first 500 chars) ──');
  console.log(translatedArticle.content.substring(0, 500));
  console.log('── end preview ──\n');

  const category = process.argv.find((a, i) => process.argv[i - 1] === '--category') || 'News';
  const articleData = {
    ...translatedArticle,
    category,
    slug: generateSlug(translatedArticle.title),
  };

  if (dryRun) {
    console.log('4️⃣  saveArticle() — SKIPPED (dry run)');
    console.log(`   Slug would be: ${articleData.slug}`);
    console.log('\n✅ DRY RUN COMPLETE — pipeline works!\n');
    return;
  }

  console.log('4️⃣  saveArticle()...');
  const result = await saveArticle(articleData);

  if (result.success) {
    console.log(`   ✅ Saved! (ID: ${result.data?.id})`);
    console.log(`\n🎉 TEST COMPLETE — article live at:`);
    console.log(`   https://cemkoyluoglu.codes/tech-news/${articleData.slug}\n`);
  } else {
    console.error(`   ❌ Save failed: ${result.error?.message || result.reason}`);
    process.exit(1);
  }
}

// ─── Entry point ───

const testUrlIndex = process.argv.indexOf('--test-url');
if (testUrlIndex !== -1 && process.argv[testUrlIndex + 1]) {
  testSingleUrl(process.argv[testUrlIndex + 1]).catch(async error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
} else {
  scrapeNews().catch(async error => {
    console.error('💥 Fatal error:', error);
    await notifyTelegram(
      `💥 <b>Haber Scraper: Fatal Hata</b>\n\n` +
      `<code>${error.message || 'Bilinmeyen hata'}</code>`
    );
    process.exit(1);
  });
}
