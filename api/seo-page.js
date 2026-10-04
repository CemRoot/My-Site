/**
 * Server-rendered, crawler-ready responses for routes whose content lives in
 * Supabase (vercel.json rewrites them here):
 *
 *   /tech-news/:slug → ?kind=article&slug=…  article page (real 404 for unknown slugs)
 *   /tech-news       → ?kind=list            index with the latest article links
 *   /sitemap.xml     → ?kind=sitemap         static routes + indexable articles
 *
 * HTML responses are the built SPA shell with a page-specific <head> and
 * crawler-visible markup in #root; React mounts over it as usual. Everything is
 * CDN-cached, so new articles show up without a redeploy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from '../lib/seo/renderHead.js';
import { articlePage } from '../lib/seo/articleHtml.js';
import { findArticleBySlug, isValidSlug } from '../lib/seo/findArticleBySlug.js';
import { LIST_COLUMNS, LIST_LIMIT, techNewsListHtml } from '../lib/seo/techNewsList.js';
import { STATIC_ROUTES, sitemapRoutes } from '../lib/seo/staticRoutes.js';
import { SOURCE_KIND_ORIGINAL } from '../lib/seo/indexability.js';
import { buildSitemapXml } from '../lib/seo/sitemap.js';
import { ROBOTS_NOINDEX } from '../lib/seo/siteMeta.js';

const SHELL_FILE = 'build/app-shell.html';
const SHELL_HOSTS = /^(?:www\.)?cemkoyluoglu\.codes$|\.vercel\.app$/i;

const CACHE_OK = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400';
const CACHE_SHORT = 'public, max-age=0, s-maxage=60';
const CACHE_SITEMAP = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

/** Last-resort shell: crawler content still renders, the SPA just does not boot. */
const MINIMAL_SHELL = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title></title><link rel="canonical" href="/" /><style>html,body{background:#0a0a0b;color:#ededea}</style></head><body><div id="root"></div></body></html>`;

let cachedShell = null;

/**
 * The pristine built index.html, written by scripts/prerender-static-shells.js.
 * Bundled with the function via vercel.json includeFiles; fetched from the
 * deployment as a fallback.
 */
async function loadShell(req) {
  if (cachedShell) return cachedShell;

  try {
    cachedShell = fs.readFileSync(path.join(process.cwd(), SHELL_FILE), 'utf8');
    return cachedShell;
  } catch {
    // not bundled — try the deployment itself
  }

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (SHELL_HOSTS.test(host)) {
    try {
      const response = await fetch(`https://${host}/app-shell.html`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const html = await response.text();
        if (html.includes('id="root"')) {
          cachedShell = html;
          return cachedShell;
        }
      }
    } catch (error) {
      console.error('app-shell fetch failed:', error?.message || error);
    }
  }

  return MINIMAL_SHELL;
}

function notFoundPage(slug) {
  return {
    path: slug ? `/tech-news/${slug}` : '/tech-news',
    title: 'Article not found | Tech News',
    description: 'The article you are looking for does not exist or has been removed.',
    robots: ROBOTS_NOINDEX,
    canonical: false,
    bodyHtml: `<main id="prerender-shell" style="max-width:46rem;margin:0 auto;padding:6rem 1.25rem;font-family:system-ui,sans-serif;color:#ededea">
<h1>Article not found</h1>
<p>The article you are looking for does not exist or has been removed.</p>
<p><a href="/tech-news" style="color:inherit">← All tech news</a></p>
</main>`,
  };
}

function send(res, status, body, cacheControl, contentType = 'text/html; charset=utf-8') {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', cacheControl);
  res.status(status).send(body);
}

async function renderArticle(req, res, { supabase, shell }) {
  const slug = typeof req.query?.slug === 'string' ? req.query.slug : '';

  if (!isValidSlug(slug)) {
    return send(res, 404, renderPage(shell, notFoundPage('')), CACHE_SHORT);
  }

  let article;
  try {
    article = await findArticleBySlug(await supabase(), slug);
  } catch (error) {
    // Serve the untouched SPA shell: visitors still get the page (the client
    // fetches the article itself) and crawlers see a retryable 503, not a 404.
    console.error('seo-page article lookup failed:', error?.message || error);
    res.setHeader('Retry-After', '120');
    return send(res, 503, shell, 'no-store');
  }

  if (!article) {
    return send(res, 404, renderPage(shell, notFoundPage(slug)), CACHE_SHORT);
  }

  // Matched through a prefix/legacy fallback: send the old URL to the real one.
  if (article.slug && article.slug !== slug) {
    res.setHeader('Cache-Control', CACHE_OK);
    return res.redirect(301, `/tech-news/${encodeURIComponent(article.slug)}`);
  }

  return send(res, 200, renderPage(shell, articlePage(article)), CACHE_OK);
}

async function renderList(req, res, { supabase, shell }) {
  const route = STATIC_ROUTES.find((r) => r.path === '/tech-news');
  try {
    const { data, error } = await (await supabase())
      .from('tech_news_articles')
      .select(LIST_COLUMNS)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT);
    if (error) throw error;
    return send(res, 200, renderPage(shell, { ...route, bodyHtml: techNewsListHtml(data || []) }), CACHE_OK);
  } catch (error) {
    // The list page must stay up: right head, empty body, React fills it in.
    console.error('seo-page list lookup failed:', error?.message || error);
    return send(res, 200, renderPage(shell, { ...route, bodyHtml: '' }), CACHE_SHORT);
  }
}

async function renderSitemap(_req, res, { supabase }) {
  const today = new Date().toISOString().slice(0, 10);
  const staticRoutes = await sitemapRoutes();
  const articles = [];
  try {
    const client = await supabase();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client
        .from('tech_news_articles')
        .select('slug,created_at,updated_at,date,source_kind')
        .eq('source_kind', SOURCE_KIND_ORIGINAL)
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (error) throw error;
      articles.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
  } catch (error) {
    // Static routes are still a valid sitemap; keep it short-lived so the
    // article URLs come back as soon as the database does.
    console.error('seo-page sitemap lookup failed:', error?.message || error);
    return send(res, 200, buildSitemapXml({ staticRoutes, articles: [], today }), CACHE_SHORT, 'application/xml; charset=utf-8');
  }
  return send(res, 200, buildSitemapXml({ staticRoutes, articles, today }), CACHE_SITEMAP, 'application/xml; charset=utf-8');
}

const RENDERERS = { article: renderArticle, list: renderList, sitemap: renderSitemap };

/**
 * @param {object} deps
 * @param {() => Promise<object>} deps.getSupabase
 * @param {(req: object) => Promise<string>} deps.loadShell
 */
export function createHandler({ getSupabase, loadShell: getShell }) {
  return async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return res.status(405).end();
    }

    const render = RENDERERS[req.query?.kind || 'article'];
    if (!render) {
      return res.status(404).end();
    }

    const shell = render === renderSitemap ? null : await getShell(req);
    return render(req, res, { supabase: getSupabase, shell });
  };
}

export default createHandler({
  getSupabase: async () => (await import('../lib/supabasePublic.js')).supabasePublic,
  loadShell,
});
