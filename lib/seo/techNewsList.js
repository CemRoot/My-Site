/**
 * Crawler-visible /tech-news index: the latest articles as plain links, so new
 * article URLs are discoverable without JavaScript. Rendered per request by
 * api/seo-page.js (CDN-cached), not at build time, so it never goes stale.
 */

import { escapeHtml } from './renderHead.js';

export const LIST_LIMIT = 30;
export const LIST_COLUMNS = 'title,description,category,slug,date,created_at';

export function techNewsListHtml(articles) {
  const items = articles
    .filter((article) => article?.slug)
    .map((article) => {
      const href = `/tech-news/${encodeURIComponent(article.slug)}`;
      return `<li style="margin:0 0 1.25rem;list-style:none">
  <a href="${escapeHtml(href)}" style="color:inherit;text-decoration:none">
    <span style="display:inline-block;font-size:0.75rem;opacity:0.7;margin-bottom:0.25rem">${escapeHtml(article.category || 'Tech')}</span>
    <strong style="display:block;font-size:1.1rem;line-height:1.3;margin-bottom:0.35rem">${escapeHtml(article.title)}</strong>
    <span style="display:block;opacity:0.75;font-size:0.9rem">${escapeHtml(String(article.description || '').slice(0, 140))}</span>
  </a>
</li>`;
    })
    .join('\n');

  return `<div id="prerender-shell" style="min-height:100vh;background:#0a0a0b;color:#f4f4f5;font-family:system-ui,sans-serif;padding:6rem 1.25rem 2rem;max-width:48rem;margin:0 auto">
  <nav aria-label="Breadcrumb" style="font-size:0.75rem;opacity:0.6;margin:0 0 0.5rem"><a href="/" style="color:inherit">Home</a> / Tech News</nav>
  <h1 style="font-size:clamp(1.5rem,4vw,2.25rem);margin:0 0 1.5rem">Latest Tech News</h1>
  <ul style="margin:0;padding:0">${items || '<li style="list-style:none;opacity:0.8">Loading curated technology articles…</li>'}</ul>
</div>`;
}
