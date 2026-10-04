/**
 * Runs after a successful tech-news scrape (scrape-tech-news.yml) and submits
 * newly saved *indexable* article URLs to IndexNow. Article pages, the
 * /tech-news index and sitemap.xml are server-rendered (api/seo-page.js), so
 * they are already live — no redeploy needed.
 *
 * Best-effort: a failure is logged and never fails the run.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      POST_SCRAPE_WINDOW_MINUTES (default 240)
 */

import { supabase } from '../lib/supabaseAdmin.js';
import { isIndexableArticle } from '../../lib/seo/indexability.js';
import { INDEXNOW_ENDPOINT, buildIndexNowPayload } from '../../lib/seo/indexNow.js';

const windowMinutes = Number(process.env.POST_SCRAPE_WINDOW_MINUTES) || 240;

async function fetchRecentArticles() {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  // select('*') so this still works before the source_kind migration lands.
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('*')
    .gte('created_at', since);
  if (error) throw error;
  return data || [];
}

async function submitIndexNow(paths) {
  if (paths.length === 0) {
    console.log('ℹ️  No new indexable articles — skipping IndexNow');
    return;
  }
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(buildIndexNowPayload(paths)),
    signal: AbortSignal.timeout(15_000),
  });
  console.log(`📡 IndexNow (${paths.length} URLs) → HTTP ${response.status}`);
}

async function main() {
  const articles = await fetchRecentArticles();
  console.log(`📰 ${articles.length} article(s) saved in the last ${windowMinutes} min`);
  if (articles.length === 0) return;

  await submitIndexNow(
    articles.filter((a) => a.slug && isIndexableArticle(a)).map((a) => `/tech-news/${a.slug}`),
  );
}

main().catch((error) => {
  console.error('⚠️  post-scrape SEO step failed:', error?.message || error);
});
