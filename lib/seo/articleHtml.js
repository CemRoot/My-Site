/**
 * Server-rendered tech-news article: crawler-visible body markup, head fields
 * and NewsArticle / BreadcrumbList JSON-LD.
 *
 * Markdown goes through the same react-markdown + remark-gfm stack the client
 * uses (SmartMarkdown), with raw HTML skipped and unsafe URLs neutralised by
 * react-markdown's default urlTransform.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { escapeHtml } from './renderHead.js';
import { articleRobots } from './indexability.js';
import { AUTHOR_NAME, DEFAULT_OG_IMAGE, PERSON_ID, SITE_URL, absoluteUrl } from './siteMeta.js';

const EMBED_TOKEN = /`?\[\[EMBED:([A-Z]+):([^\]]+)\]\]`?/gi;

/**
 * Strip scraper artefacts the client also hides (see sanitizeArticleContent in
 * src/lib/utils/articleHelpers.ts). Embeds become plain links when their payload
 * is a URL; there is nothing useful to show a crawler otherwise.
 */
export function prepareArticleMarkdown(content) {
  if (!content) return '';
  return String(content)
    .replace(EMBED_TOKEN, (_match, _type, payload) => {
      const value = String(payload).trim();
      return /^https?:\/\//i.test(value) ? `\n\n<${value}>\n\n` : '';
    })
    .replace(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/__WIDGET_\d+__|\bWIDGET_\d+\b/g, '')
    .replace(
      /^\s*(?:Twitter|TikTok)\s+Embed\s*$|^\s*(?:YouTube Widget|Twitter Widget Iframe|Widget Iframe|Instagram Widget|Social Media Widget)\s*$/gim,
      '',
    )
    .replace(/[ \t]+$/gm, '')
    .replace(/(\r?\n){3,}/g, '\n\n')
    .trim();
}

export function renderMarkdownToHtml(markdown) {
  return renderToStaticMarkup(
    createElement(Markdown, { remarkPlugins: [remarkGfm], skipHtml: true }, markdown),
  );
}

export function articlePath(article) {
  return `/tech-news/${article.slug}`;
}

function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function publishedIso(article) {
  return isoDate(article.date) || isoDate(article.created_at);
}

function modifiedIso(article) {
  return isoDate(article.updated_at) || isoDate(article.created_at) || publishedIso(article);
}

function httpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : undefined;
}

export function articleJsonLdNodes(article) {
  const url = absoluteUrl(articlePath(article));
  const image = httpUrl(article.image_url);
  const basedOn = httpUrl(article.original_source) || httpUrl(article.source_url);

  const newsArticle = {
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: String(article.title || '').slice(0, 110),
    description: article.description || undefined,
    url,
    mainEntityOfPage: url,
    datePublished: publishedIso(article),
    dateModified: modifiedIso(article),
    image: [image || DEFAULT_OG_IMAGE],
    articleSection: article.category || undefined,
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isBasedOn: basedOn,
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Tech News', item: absoluteUrl('/tech-news') },
      { '@type': 'ListItem', position: 3, name: String(article.title || ''), item: url },
    ],
  };

  return [newsArticle, breadcrumb];
}

const S = {
  page: "max-width:46rem;margin:0 auto;padding:6rem 1.25rem 4rem;font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;color:#ededea;line-height:1.7",
  crumb: "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(237,237,234,0.45)",
  link: 'color:inherit',
  meta: "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:rgba(237,237,234,0.62);margin:0 0 1.5rem",
  h1: 'font-size:clamp(1.75rem,4vw,2.75rem);line-height:1.15;margin:1rem 0',
  lede: 'font-size:1.15rem;color:rgba(237,237,234,0.8);margin:0 0 2rem',
};

function displayDate(article) {
  const iso = publishedIso(article);
  return iso ? iso.slice(0, 10) : '';
}

export function articleBodyHtml(article) {
  const body = renderMarkdownToHtml(prepareArticleMarkdown(article.content));
  const source = httpUrl(article.original_source);
  const date = displayDate(article);

  return `<main id="prerender-shell" style="${S.page}">
<nav aria-label="Breadcrumb" style="${S.crumb}"><a href="/" style="${S.link}">Home</a> / <a href="/tech-news" style="${S.link}">Tech News</a></nav>
<article>
<h1 style="${S.h1}">${escapeHtml(article.title)}</h1>
<p style="${S.meta}">${date ? `<time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>` : ''}${article.category ? ` · ${escapeHtml(article.category)}` : ''} · ${escapeHtml(AUTHOR_NAME)}</p>
${article.description ? `<p style="${S.lede}">${escapeHtml(article.description)}</p>` : ''}
${body}
${source ? `<p>Source: <a href="${escapeHtml(source)}" rel="nofollow noopener" style="${S.link}">${escapeHtml(source)}</a></p>` : ''}
</article>
<p><a href="/tech-news" style="${S.link}">← All tech news</a></p>
</main>`;
}

/** Everything renderPage() needs for one article. Takes a raw Supabase row. */
export function articlePage(article) {
  return {
    path: articlePath(article),
    title: `${article.title} | Tech News`,
    ogTitle: article.title,
    description: article.description || article.title,
    robots: articleRobots(article),
    ogType: 'article',
    ogImage: httpUrl(article.image_url),
    ogImageAlt: article.title,
    publishedTime: publishedIso(article),
    modifiedTime: modifiedIso(article),
    section: article.category || undefined,
    jsonLdNodes: articleJsonLdNodes(article),
    bodyHtml: articleBodyHtml(article),
  };
}
