/**
 * Cleanup script for tech_news_articles.
 *
 * Scans all articles in Supabase and deletes any whose content matches
 * known garbage patterns (cookie banners, reaction widgets, login prompts, etc.).
 *
 * Usage:
 *   node scripts/cleanup-bad-articles.js --dry-run   # preview only
 *   node scripts/cleanup-bad-articles.js              # delete flagged articles
 */

import { supabase } from './lib/supabaseAdmin.js';
import { notifyTelegram } from './lib/telegram.js';

const BAD_CONTENT_MARKERS = [
  'Post Views',
  'What is your reaction',
  'You have no notifications',
  'We value your privacy',
  'No more articles',
  "I'm sorry, I don't understand",
  'CustomizeDeclineAccept',
  'NecessaryAlways Active',
];

const isDryRun = process.argv.includes('--dry-run');

async function fetchAllArticles() {
  const PAGE_SIZE = 1000;
  const allArticles = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('tech_news_articles')
      .select('id, title, content, source_url')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);
    if (!data || data.length === 0) break;

    allArticles.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allArticles;
}

function findBadArticles(articles) {
  const flagged = [];

  for (const article of articles) {
    const content = article.content || '';
    const matchedMarkers = BAD_CONTENT_MARKERS.filter(marker =>
      content.includes(marker)
    );

    if (matchedMarkers.length > 0) {
      flagged.push({
        id: article.id,
        title: article.title,
        source_url: article.source_url,
        markers: matchedMarkers,
      });
    }
  }

  return flagged;
}

async function deleteFlaggedArticles(flagged) {
  const ids = flagged.map(a => a.id);
  const BATCH_SIZE = 100;
  let deletedCount = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('tech_news_articles')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`❌ Batch delete error (offset ${i}): ${error.message}`);
    } else {
      deletedCount += batch.length;
    }
  }

  return deletedCount;
}

async function main() {
  console.log(`🧹 Tech News Article Cleanup${isDryRun ? ' (DRY RUN)' : ''}`);
  console.log('='.repeat(60));

  const articles = await fetchAllArticles();
  console.log(`📊 Total articles in database: ${articles.length}`);

  const flagged = findBadArticles(articles);
  console.log(`🚩 Flagged articles: ${flagged.length}\n`);

  if (flagged.length === 0) {
    console.log('✅ No bad articles found. Database is clean.');
    return;
  }

  for (const article of flagged) {
    console.log(`  ❌ [${article.id}] ${article.title?.substring(0, 60) || 'No title'}`);
    console.log(`     URL: ${article.source_url || 'N/A'}`);
    console.log(`     Matched: ${article.markers.join(', ')}\n`);
  }

  if (isDryRun) {
    console.log(`\n🔍 DRY RUN — ${flagged.length} article(s) would be deleted. No changes made.`);
    return;
  }

  console.log(`🗑️  Deleting ${flagged.length} article(s)...`);
  const deletedCount = await deleteFlaggedArticles(flagged);
  console.log(`✅ Deleted ${deletedCount} article(s).`);

  await notifyTelegram(
    `🧹 <b>DB Cleanup Complete</b>\n\n` +
    `🗑️ Deleted: <b>${deletedCount}</b> bad article(s)\n` +
    `📊 Remaining: <b>${articles.length - deletedCount}</b>\n` +
    `⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
  );
}

main().catch(async (error) => {
  console.error('💥 Cleanup failed:', error.message);
  await notifyTelegram(
    `💥 <b>DB Cleanup Failed</b>\n\n` +
    `<code>${error.message}</code>`
  );
  process.exit(1);
});
