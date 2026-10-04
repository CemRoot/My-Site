/**
 * Weekly SEO report → Telegram.
 *
 *   node scripts/seo/weekly-seo-report.mjs [--dry-run]
 *
 * 1. Crawl health: every URL in the live sitemap must answer 200 with a
 *    matching canonical and an indexable robots tag.
 * 2. Content: Engineer's Notes published in the last 7 days (target 4-7).
 * 3. Search Console (when GSC_SERVICE_ACCOUNT_JSON is set): clicks,
 *    impressions, top queries, and high-impression / low-CTR pages to rewrite.
 */

import { load } from 'cheerio/slim';
import { supabase } from '../lib/supabaseAdmin.js';
import { notifyTelegram } from '../lib/telegram.js';
import { SITE_URL } from '../../lib/seo/siteMeta.js';
import { SOURCE_KIND_ORIGINAL } from '../../lib/seo/indexability.js';
import { getAccessToken, lowCtrPages, querySearchAnalytics } from '../../lib/seo/searchConsole.js';

const DRY_RUN = process.argv.includes('--dry-run');
const UA = 'Mozilla/5.0 (compatible; CemKoyluogluSEOCheck/1.0; +https://cemkoyluoglu.codes)';
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (offset) => new Date(Date.now() - offset * 86400_000).toISOString().slice(0, 10);

async function crawlHealth() {
  const xml = await (await fetch(`${SITE_URL}/sitemap.xml`, { headers: { 'user-agent': UA } })).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const problems = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
      if (response.status !== 200) {
        problems.push(`${url} → HTTP ${response.status}`);
        continue;
      }
      const $ = load(await response.text());
      const canonical = $('link[rel="canonical"]').attr('href');
      const robots = $('meta[name="robots"]').attr('content') || '';
      if (canonical !== url) problems.push(`${url} → canonical ${canonical || 'missing'}`);
      if (/noindex/i.test(robots)) problems.push(`${url} → robots "${robots}"`);
    } catch (error) {
      problems.push(`${url} → ${error.message}`);
    }
  }
  return { total: urls.length, problems };
}

async function contentStats() {
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('slug, title, created_at')
    .eq('source_kind', SOURCE_KIND_ORIGINAL)
    .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString())
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function searchConsole() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  const token = await getAccessToken(JSON.parse(raw));
  const siteUrl = process.env.GSC_SITE_URL || `${SITE_URL}/`;
  const range = { token, siteUrl, startDate: day(10), endDate: day(3) }; // GSC data lags ~2-3 days
  const [totals, queries, pages] = await Promise.all([
    querySearchAnalytics({ ...range, dimensions: [] }),
    querySearchAnalytics({ ...range, dimensions: ['query'], rowLimit: 10 }),
    querySearchAnalytics({ ...range, dimensions: ['page'], rowLimit: 100 }),
  ]);
  return { range, totals: totals[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 }, queries, lowCtr: lowCtrPages(pages).slice(0, 5) };
}

async function main() {
  const lines = ['📈 <b>Weekly SEO report</b>', ''];

  const health = await crawlHealth();
  lines.push(`<b>Crawl health:</b> ${health.total - health.problems.length}/${health.total} sitemap URLs OK`);
  for (const p of health.problems.slice(0, 8)) lines.push(`  ⚠️ ${esc(p)}`);

  const notes = await contentStats();
  lines.push('', `<b>Engineer's Notes this week:</b> ${notes.length} (target 4–7)`);
  for (const n of notes.slice(0, 7)) lines.push(`  • <a href="${SITE_URL}/tech-news/${n.slug}">${esc(n.title)}</a>`);

  try {
    const gsc = await searchConsole();
    if (!gsc) {
      lines.push('', '<i>Search Console: not connected (set GSC_SERVICE_ACCOUNT_JSON).</i>');
    } else {
      const t = gsc.totals;
      lines.push(
        '',
        `<b>Google Search</b> (${gsc.range.startDate} → ${gsc.range.endDate})`,
        `  ${t.clicks} clicks · ${t.impressions} impressions · CTR ${(t.ctr * 100).toFixed(1)}% · avg pos ${t.position.toFixed(1)}`,
        '<b>Top queries:</b>',
        ...gsc.queries.slice(0, 8).map((q) => `  • ${esc(q.keys[0])} — ${q.impressions} impr, pos ${q.position.toFixed(1)}`),
      );
      if (gsc.lowCtr.length) {
        lines.push('<b>Rewrite candidates (high impressions, low CTR):</b>');
        for (const p of gsc.lowCtr) lines.push(`  • ${esc(p.keys[0])} — ${p.impressions} impr, CTR ${(p.ctr * 100).toFixed(1)}%`);
      }
    }
  } catch (error) {
    lines.push('', `⚠️ Search Console query failed: ${esc(error.message)}`);
  }

  const message = lines.join('\n');
  if (DRY_RUN) console.log(message);
  else await notifyTelegram(message);
}

main().catch(async (error) => {
  console.error(error);
  if (!DRY_RUN) await notifyTelegram(`❌ <b>Weekly SEO report failed</b>\n${esc(error.message)}`);
  process.exit(1);
});
