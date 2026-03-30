/**
 * Cheap CI gate before Firecrawl + Groq: fetch category HTML only (no AI, no Firecrawl).
 * If every sampled headline URL already exists in tech_news_articles, skip full scrape.
 *
 * Category URLs must stay in sync with scripts/lib/scraper/config.js (SCRAPER_CONFIG.CATEGORIES).
 * Sample size is intentionally small (newest-first listings; full scrape uses same idea).
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { extractArticleUrlsFromHtml, normalizeArticleUrl } from './preflight-url-utils.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** @type {readonly string[]} */
const CATEGORY_PAGE_URLS = [
  'https://nuvemmag.com/category/yapay-zeka-uygulamalari/',
  'https://nuvemmag.com/category/yapay-zeka/',
  'https://nuvemmag.com/category/teknoloji/',
  'https://nuvemmag.com/category/gundem/',
  'https://nuvemmag.com/category/surdurulebilirlik/',
  'https://nuvemmag.com/category/bilim-ve-dunya/',
];

function urlVariants(url) {
  const base = normalizeArticleUrl(url);
  const out = new Set([url, base]);
  try {
    const u = new URL(base);
    const withSlash = `${u.origin}${u.pathname.replace(/\/$/, '')}/`;
    out.add(withSlash);
  } catch { /* */ }
  return [...out];
}

function writeOutput(key, value) {
  const path = process.env.GITHUB_OUTPUT;
  if (!path) return;
  const v = String(value).replace(/\r?\n/g, ' ');
  appendFileSync(path, `${key}=${v}\n`);
}

/** Local parity with CI: `npm run scrape:news:parity` reads this file. */
function writePreflightResultFile(payload) {
  try {
    const dir = join(process.cwd(), 'artifacts');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'preflight-result.json'), `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (e) {
    console.warn(`Preflight: could not write preflight-result.json (${e.message})`);
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.text();
}

async function rowExistsForUrl(supabaseUrl, headers, url) {
  const base = supabaseUrl.replace(/\/$/, '');
  for (const variant of urlVariants(url)) {
    const enc = encodeURIComponent(variant);
    const apiUrl = `${base}/rest/v1/tech_news_articles?select=id&source_url=eq.${enc}&limit=1`;
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
    }
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) return true;
  }
  return false;
}

async function main() {
  if (process.env.TECH_NEWS_SKIP_PREFLIGHT === '1') {
    console.log('Preflight: TECH_NEWS_SKIP_PREFLIGHT=1 → bypass headline gate (full scrape).');
    writeOutput('proceed', 'true');
    writeOutput('reason', 'skip_preflight_input');
    writePreflightResultFile({ proceed: true, reason: 'skip_preflight_input' });
    return;
  }

  if (process.env.TECH_NEWS_PREFLIGHT_FORCE_PROCEED === '1') {
    console.log('Preflight: TECH_NEWS_PREFLIGHT_FORCE_PROCEED=1 → proceed (manual / forced run).');
    writeOutput('proceed', 'true');
    writeOutput('reason', 'forced');
    writePreflightResultFile({ proceed: true, reason: 'forced' });
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    console.warn('Preflight: missing Supabase env → fail-open (proceed).');
    writeOutput('proceed', 'true');
    writeOutput('reason', 'missing_supabase_env');
    writePreflightResultFile({ proceed: true, reason: 'missing_supabase_env' });
    return;
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const perCategoryCap = Number(process.env.TECH_NEWS_PREFLIGHT_LINKS_PER_CATEGORY || 10) || 10;
  const globalCap = Number(process.env.TECH_NEWS_PREFLIGHT_MAX_URLS || 60) || 60;

  const candidates = [];
  const seen = new Set();

  for (const catUrl of CATEGORY_PAGE_URLS) {
    let html;
    try {
      html = await fetchHtml(catUrl);
    } catch (e) {
      console.warn(`Preflight: fetch failed ${catUrl}: ${e.message} → fail-open.`);
      writeOutput('proceed', 'true');
      writeOutput('reason', 'fetch_error_fail_open');
      writePreflightResultFile({ proceed: true, reason: 'fetch_error_fail_open' });
      return;
    }

    const urls = extractArticleUrlsFromHtml(html);
    let n = 0;
    for (const u of urls) {
      if (n >= perCategoryCap) break;
      if (seen.has(u)) continue;
      seen.add(u);
      candidates.push(u);
      n++;
    }
  }

  const limited = candidates.slice(0, globalCap);
  if (limited.length === 0) {
    console.log('Preflight: no article URLs parsed → fail-open (proceed).');
    writeOutput('proceed', 'true');
    writeOutput('reason', 'no_candidates_fail_open');
    writePreflightResultFile({ proceed: true, reason: 'no_candidates_fail_open' });
    return;
  }

  let missing = 0;
  for (const url of limited) {
    try {
      const exists = await rowExistsForUrl(supabaseUrl, headers, url);
      if (!exists) missing++;
    } catch (e) {
      console.warn(`Preflight: DB check error (${e.message}) → fail-open.`);
      writeOutput('proceed', 'true');
      writeOutput('reason', 'db_error_fail_open');
      writePreflightResultFile({ proceed: true, reason: 'db_error_fail_open' });
      return;
    }
  }

  const proceed = missing > 0;
  writeOutput('proceed', proceed ? 'true' : 'false');
  writeOutput('reason', proceed ? 'headline_gap' : 'all_headlines_in_db');
  writeOutput('sampled', String(limited.length));
  writeOutput('missing', String(missing));
  writePreflightResultFile({
    proceed,
    reason: proceed ? 'headline_gap' : 'all_headlines_in_db',
    sampled: limited.length,
    missing,
  });

  if (proceed) {
    console.log(`Preflight: ${missing}/${limited.length} sampled headline URL(s) missing in DB → run full scrape.`);
  } else {
    console.log(`Preflight: all ${limited.length} sampled headline URL(s) already in DB → skip full scrape.`);
  }
}

main().catch(err => {
  console.error('Preflight fatal:', err);
  writeOutput('proceed', 'true');
  writeOutput('reason', 'script_error_fail_open');
  writePreflightResultFile({ proceed: true, reason: 'script_error_fail_open' });
  process.exitCode = 0;
});
