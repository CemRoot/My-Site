/**
 * Cheerio-based fallback scraper.
 * Uses native fetch + cheerio for scraping when Firecrawl credits are exhausted.
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from './BaseScraper.js';
import { SCRAPER_CONFIG } from '../config.js';
import { htmlToTokens } from '../../../embeds/extractEmbeds.js';
import { extractAllEmbedsFromMarkdown } from '../../../embeds/extractMarkdownEmbeds.js';
import { replaceTikTokBlockquote, replaceTwitterBlockquote, cleanSocialEmbedRemnants } from '../../../embeds/cleanMarkdownEmbeds.js';
import { extractSlugFromUrl, generateSlug } from '../database.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const BLOCKED_SLUGS = new Set([
  'hesabim', 'my-account', 'giris', 'login', 'kayit', 'register',
  'sepet', 'cart', 'checkout', 'odeme', 'wp-admin', 'wp-login',
  'wp-register', 'feed', 'rss', 'sitemap', 'robots', 'favicon',
  'iletisim', 'contact', 'hakkimizda', 'about', 'gizlilik',
  'privacy', 'terms', 'kvkk', 'cerez', 'cookie', 'yazarlar',
  'author', 'profil', 'profile', 'ayarlar', 'settings',
  'abone', 'subscribe', 'newsletter', 'search', 'ara',
  'category',
]);

function isArticleUrl(href) {
  if (!href || !href.includes('nuvemmag.com/')) return false;
  try {
    const { pathname } = new URL(href);
    const clean = pathname.replace(/\/$/, '');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 0) return false;
    if (parts.some(p => BLOCKED_SLUGS.has(p))) return false;
    if (/\.(jpg|jpeg|png|gif|svg|css|js|xml|json|pdf)$/i.test(clean)) return false;
    if (/^\/wp-content/i.test(clean)) return false;
    return /^\/[a-z0-9][a-z0-9%-]*\/?$/i.test(clean) || /^\/post\/[a-z0-9-]+\/?$/i.test(clean);
  } catch {
    return false;
  }
}

export class CheerioScraper extends BaseScraper {
  constructor() {
    super('CheerioScraper');
  }

  // ─── Category list scraping ───

  async scrapeArticleList(categoryUrl, categoryTag) {
    console.log(`\n📂 [Cheerio] Scraping category: ${categoryTag} from ${categoryUrl}`);

    let html;
    try {
      const res = await fetch(categoryUrl, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (error) {
      console.error(`  ❌ Failed to fetch category page: ${error.message}`);
      return [];
    }

    const $ = cheerio.load(html);
    const seen = new Set();
    const articles = [];

    $('a[href*="nuvemmag.com/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || seen.has(href) || !isArticleUrl(href)) return;
      seen.add(href);

      let dateStr = '';
      const $parent = $(el).closest('article, .post, .entry, li, div');
      const $time = $parent.find('time').first();
      if ($time.length) {
        dateStr = $time.attr('datetime') || $time.text().trim();
      }

      let date = '';
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } catch { /* skip */ }
      }
      if (!date) {
        const today = new Date();
        date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      }

      articles.push({
        url: href,
        category: categoryTag,
        scrapedDate: date,
        datePriority: 50,
      });
    });

    const limited = articles.slice(0, SCRAPER_CONFIG.MAX_ARTICLES_PER_CATEGORY);
    console.log(`  📊 [Cheerio] Found ${limited.length} articles (from ${articles.length} total links)`);
    return limited;
  }

  // ─── Article detail scraping ───

  async scrapeArticleDetails(url) {
    console.log(`   🔍 [Cheerio] Scraping article: ${url}`);

    let html;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (error) {
      console.error(`   ❌ Failed to fetch article: ${error.message}`);
      return null;
    }

    const $ = cheerio.load(html, { decodeEntities: false });

    let title = ($('meta[property="og:title"]').attr('content') || $('title').text() || '')
      .replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();

    if (title.length > 100) {
      const h1 = $('h1').first().text().trim();
      if (h1 && h1.length < 100) {
        title = h1;
      } else {
        const slugTitle = url.split('/').filter(Boolean).pop()
          ?.replace(/-/g, ' ')
          ?.replace(/\b\w/g, c => c.toUpperCase()) || '';
        if (slugTitle.length < 100) title = slugTitle;
      }
      console.log(`   ✂️  Title was too long, using fallback: "${title.substring(0, 60)}"`);
    }

    let description = ($('meta[property="og:description"]').attr('content') || '')
      .replace(/\bNuvemMag\b/gi, '').trim();

    const image = $('meta[property="og:image"]').attr('content') || '';

    let date = '';
    const publishedTime = $('meta[property="article:published_time"]').attr('content') || '';
    if (publishedTime) {
      try {
        const d = new Date(publishedTime);
        if (!isNaN(d.getTime())) date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      } catch { /* skip */ }
    }
    if (!date) {
      const today = new Date();
      date = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    }

    let embedTokens = [];
    try {
      const { contentWithTokens, embedCount } = htmlToTokens(html);
      embedTokens = contentWithTokens.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/g) || [];
      const total = embedCount.youtube + embedCount.twitter + embedCount.tiktok;
      if (total > 0) {
        console.log(`  ✅ Extracted ${total} embed(s) from HTML (YT:${embedCount.youtube} TW:${embedCount.twitter} TT:${embedCount.tiktok})`);
      }
    } catch { /* skip */ }

    const $article = $('.content__post--article, .geoit_entry-content, article .entry-content').first();
    if (!$article.length) {
      console.error(`   ❌ No article content container found`);
      return null;
    }

    $article.find('.cky-consent-container, .cky-modal, .geo-reaction-wrapper, .geo-reaction-bar, .content__related-posts, .comments-area, .comment-respond, .post-views, .geo-notification, .content__post--meta-social, .content__post--article_tags, footer, header, nav').remove();

    let markdownContent = this._htmlToMarkdown($article, $);

    markdownContent = replaceTikTokBlockquote(markdownContent);
    markdownContent = replaceTwitterBlockquote(markdownContent);
    markdownContent = cleanSocialEmbedRemnants(markdownContent);
    markdownContent = extractAllEmbedsFromMarkdown(markdownContent);

    const mdTokens = markdownContent.match(/\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\]/gi) || [];
    for (const t of mdTokens) {
      if (!embedTokens.includes(t)) embedTokens.push(t);
    }

    if (embedTokens.length > 0) {
      const existing = new Set(mdTokens);
      const newTokens = embedTokens.filter(t => !existing.has(t));
      if (newTokens.length > 0) {
        markdownContent = markdownContent.trimEnd() + '\n\n' + newTokens.join('\n\n') + '\n\n';
      }
    }

    let originalSource = '';
    const sourcePatterns = [
      /(?:kaynak|source)[:\s]+(https?:\/\/[^\s\)\]>\n"']+)/i,
      /(?:kaynak|source)[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
      /via[:\s]+\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/i,
    ];
    for (const pattern of sourcePatterns) {
      const match = markdownContent.match(pattern);
      if (match) {
        const u = match[2] || match[1];
        originalSource = u.trim().replace(/[.,;:!?\s]+$/, '');
        markdownContent = markdownContent
          .replace(/^[>\s]*(?:kaynak|source)\s*:\s*https?:\/\/[^\n]*$/gim, '')
          .replace(/^[>\s]*via\s*:\s*\[[^\]]*\]\([^\)]+\)\s*$/gim, '');
        break;
      }
    }

    markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n').trim();

    if (!title || !markdownContent) {
      console.error(`   ❌ Missing required fields (title or content)`);
      return null;
    }

    if (!description) {
      const firstP = markdownContent.split('\n\n').find(p => p.trim().length > 50 && !p.startsWith('#'));
      if (firstP) description = firstP.trim().substring(0, 300);
    }

    console.log(`   ✅ Scraped: "${title.substring(0, 60)}..." (${markdownContent.length} chars)`);

    return {
      title,
      description: description || title,
      content: markdownContent,
      image,
      date,
      sourceUrl: url,
      originalSource: originalSource || url,
      slug: extractSlugFromUrl(url) || generateSlug(title),
    };
  }

  _htmlToMarkdown($el, $) {
    const blocks = [];

    $el.children().each((_, child) => {
      const $child = $(child);
      const tag = child.tagName?.toLowerCase();

      if (['script', 'style', 'noscript'].includes(tag)) return;

      if (tag === 'p') {
        const text = this._inlineToMarkdown($child, $);
        if (text.trim()) blocks.push(text.trim());
        return;
      }

      if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const text = $child.text().trim();
        if (text) blocks.push(`**${text}**`);
        return;
      }

      if (tag === 'h1') {
        const text = $child.text().trim();
        if (text) blocks.push(`**${text}**`);
        return;
      }

      if (tag === 'ul' || tag === 'ol') {
        $child.find('li').each((i, li) => {
          const text = $(li).text().trim();
          if (text) blocks.push(tag === 'ol' ? `${i + 1}. ${text}` : `• ${text}`);
        });
        return;
      }

      if (tag === 'blockquote') {
        const text = $child.text().trim();
        if (text) blocks.push(`> ${text.replace(/\n/g, '\n> ')}`);
        return;
      }

      if (tag === 'figure') {
        const caption = $child.find('figcaption').text().trim();
        const img = $child.find('img');
        if (img.length) {
          const src = img.attr('src') || img.attr('data-src') || '';
          const alt = img.attr('alt') || caption || '';
          if (src && !src.includes('nuvemmag.com')) blocks.push(`![${alt}](${src})`);
        }
        return;
      }

      if (tag === 'img') {
        const src = $child.attr('src') || $child.attr('data-src') || '';
        const alt = $child.attr('alt') || '';
        if (src && !src.includes('nuvemmag.com')) blocks.push(`![${alt}](${src})`);
        return;
      }

      if (tag === 'div' || tag === 'section' || tag === 'article') {
        const inner = this._htmlToMarkdown($child, $);
        if (inner.trim()) blocks.push(inner.trim());
        return;
      }

      const text = $child.text().trim();
      if (text) blocks.push(text);
    });

    return blocks.join('\n\n');
  }

  _inlineToMarkdown($el, $) {
    let result = '';

    $el.contents().each((_, node) => {
      if (node.type === 'text') {
        result += $(node).text();
        return;
      }

      const $node = $(node);
      const tag = node.tagName?.toLowerCase();

      if (tag === 'strong' || tag === 'b') {
        const text = $node.text();
        if (text.trim()) result += `**${text}**`;
        return;
      }

      if (tag === 'em' || tag === 'i') {
        const text = $node.text();
        if (text.trim()) result += `*${text}*`;
        return;
      }

      if (tag === 'a') {
        const href = $node.attr('href') || '';
        const text = $node.text().trim();
        if (href.includes('nuvemmag.com') || !text) {
          result += text;
        } else {
          result += `[${text}](${href})`;
        }
        return;
      }

      if (tag === 'br') {
        result += '\n';
        return;
      }

      result += $node.text();
    });

    return result;
  }
}
