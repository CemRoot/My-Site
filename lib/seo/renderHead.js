/**
 * Rewrites the built SPA shell (build/index.html) into a page-specific document:
 * per-page <head> (title, description, canonical, robots, Open Graph, Twitter,
 * JSON-LD) plus crawler-visible markup inside #root.
 *
 * React mounts with createRoot, which replaces #root's children, so the injected
 * markup is only what crawlers and the first paint see.
 */

import { load } from 'cheerio/slim';
import {
  AUTHOR_NAME,
  DEFAULT_OG_IMAGE,
  ROBOTS_INDEX,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
  siteGraph,
} from './siteMeta.js';

/** JSON for an inline <script>: `<` escaped so content can never close the tag. */
export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c');
}

function setMeta($, attr, key, content) {
  const selector = `meta[${attr}="${key}"]`;
  if (content === undefined || content === null || content === '') {
    $(selector).remove();
    return;
  }
  const existing = $(selector);
  if (existing.length) {
    existing.first().attr('content', String(content));
    existing.slice(1).remove();
  } else {
    $('head').append(`<meta ${attr}="${key}">`);
    $(selector).attr('content', String(content));
  }
}

/**
 * @param {string} shellHtml - the built index.html
 * @param {object} page
 * @param {string} page.path - site path, used for canonical and og:url
 * @param {string} page.title
 * @param {string} page.description
 * @param {string} [page.robots]
 * @param {'website'|'article'} [page.ogType]
 * @param {string} [page.ogTitle]
 * @param {string} [page.ogImage]
 * @param {string} [page.ogImageAlt]
 * @param {string} [page.publishedTime]
 * @param {string} [page.modifiedTime]
 * @param {string} [page.section]
 * @param {object[]} [page.jsonLdNodes] - extra @graph nodes beside WebSite + Person
 * @param {string} [page.bodyHtml] - markup placed inside #root
 * @param {boolean} [page.canonical=true] - false for error pages that must not claim a URL
 */
export function renderPage(shellHtml, page) {
  const $ = load(shellHtml, { encodeEntities: 'utf8' });
  const url = absoluteUrl(page.path);
  const ogType = page.ogType || 'website';
  const ogTitle = page.ogTitle || page.title;
  const ogImage = page.ogImage || DEFAULT_OG_IMAGE;

  if (!$('#root').length) {
    throw new Error('shell HTML is missing #root');
  }

  $('title').first().text(page.title);
  setMeta($, 'name', 'title', page.title);
  setMeta($, 'name', 'description', page.description);
  setMeta($, 'name', 'robots', page.robots || ROBOTS_INDEX);
  setMeta($, 'name', 'author', AUTHOR_NAME);

  setMeta($, 'property', 'og:type', ogType);
  setMeta($, 'property', 'og:url', url);
  setMeta($, 'property', 'og:title', ogTitle);
  setMeta($, 'property', 'og:description', page.description);
  setMeta($, 'property', 'og:image', ogImage);
  setMeta($, 'property', 'og:image:secure_url', ogImage);
  setMeta($, 'property', 'og:image:alt', page.ogImageAlt || ogTitle);
  setMeta($, 'property', 'og:site_name', SITE_NAME);
  if (ogImage !== DEFAULT_OG_IMAGE) {
    // Dimensions and type in the shell describe the default PNG only.
    setMeta($, 'property', 'og:image:type', null);
    setMeta($, 'property', 'og:image:width', null);
    setMeta($, 'property', 'og:image:height', null);
  }
  setMeta($, 'property', 'article:published_time', ogType === 'article' ? page.publishedTime : null);
  setMeta($, 'property', 'article:modified_time', ogType === 'article' ? page.modifiedTime : null);
  setMeta($, 'property', 'article:section', ogType === 'article' ? page.section : null);
  setMeta($, 'property', 'article:author', ogType === 'article' ? AUTHOR_NAME : null);

  // Twitter reads name="twitter:*"; the shell historically used property=.
  $('meta[property^="twitter:"]').remove();
  setMeta($, 'name', 'twitter:card', 'summary_large_image');
  setMeta($, 'name', 'twitter:url', url);
  setMeta($, 'name', 'twitter:title', ogTitle);
  setMeta($, 'name', 'twitter:description', page.description);
  setMeta($, 'name', 'twitter:image', ogImage);
  setMeta($, 'name', 'twitter:creator', TWITTER_HANDLE);

  const canonical = $('link[rel="canonical"]');
  if (page.canonical === false) {
    canonical.remove();
  } else if (canonical.length) {
    canonical.first().attr('href', url);
  } else {
    $('head').append(`<link rel="canonical">`);
    $('link[rel="canonical"]').attr('href', url);
  }

  const jsonLd = serializeJsonLd(siteGraph(page.jsonLdNodes || []));
  const ldScript = $('script#bootstrap-json-ld');
  if (ldScript.length) {
    ldScript.text(jsonLd);
  } else {
    $('head').append(`<script type="application/ld+json" id="bootstrap-json-ld"></script>`);
    $('script#bootstrap-json-ld').text(jsonLd);
  }

  if (page.bodyHtml !== undefined) {
    $('#root').html(page.bodyHtml);
  }

  return $.html();
}

/** HTML-escape text for interpolation into shell markup. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
