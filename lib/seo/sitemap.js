/**
 * sitemap.xml builder. Pure, so tests can feed it rows directly; the Supabase
 * fetch lives in api/seo-page.js (kind=sitemap).
 */

import { isIndexableArticle } from './indexability.js';
import { absoluteUrl } from './siteMeta.js';

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function day(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * @param {object} input
 * @param {Array<{path:string, robots?:string, changefreq?:string, priority?:string}>} input.staticRoutes
 * @param {object[]} input.articles - raw tech_news_articles rows
 * @param {string} input.today - YYYY-MM-DD for static routes
 */
export function buildSitemapXml({ staticRoutes, articles, today }) {
  const entries = staticRoutes
    .filter((route) => !/noindex/i.test(route.robots || ''))
    .map((route) =>
      urlEntry({
        loc: absoluteUrl(route.path),
        lastmod: today,
        changefreq: route.changefreq,
        priority: route.priority,
      }),
    );

  for (const article of articles) {
    if (!article?.slug || !isIndexableArticle(article)) continue;
    entries.push(
      urlEntry({
        loc: absoluteUrl(`/tech-news/${article.slug}`),
        lastmod: day(article.updated_at) || day(article.created_at) || day(article.date) || today,
        changefreq: 'monthly',
        priority: '0.7',
      }),
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}
