/**
 * Shared helpers for the Tech News feature.
 *
 * Extracted from TechNews.tsx & TechNewsDetail.tsx to eliminate
 * duplication and keep components focused on rendering.
 */

import type { Article } from '../types';
import { stripSourceSocialLeaks } from '../../../scripts/embeds/cleanMarkdownEmbeds.js';

const TITLE_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'her',
  'was',
  'one',
  'our',
  'out',
  'has',
  'his',
  'how',
  'its',
  'new',
  'who',
  'way',
  'may',
  'now',
  'use',
  'with',
  'from',
  'this',
  'that',
  'than',
  'into',
  'over',
  'after',
  'about',
  'your',
  'their',
  'what',
  'when',
  'where',
  'which',
  'while',
  'will',
  'just',
  'more',
  'most',
  'some',
  'such',
  'took',
  'step',
  'back',
  'worse',
]);

function articleTimestamp(a: Pick<Article, 'date' | 'createdAt'>): number {
  const fromDate = Date.parse(a.date || '');
  if (!Number.isNaN(fromDate)) return fromDate;
  const fromCreated = Date.parse(a.createdAt || '');
  return Number.isNaN(fromCreated) ? 0 : fromCreated;
}

function topicKeywordOverlap(textA: string, textB: string): number {
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !TITLE_STOP_WORDS.has(w)),
    );
  const A = tokenize(textA);
  const B = tokenize(textB);
  if (A.size === 0 || B.size === 0) return 0;
  let n = 0;
  for (const w of A) {
    if (B.has(w)) n += 1;
  }
  return n;
}

/**
 * Pick related articles from a pool: topic keyword overlap first (title +
 * description), then same category, then newer publish date — so RELATED
 * surfaces subject neighbours rather than chronological neighbours.
 */
export function pickRelatedArticles(
  current: Article,
  pool: Article[],
  take: number,
): Article[] {
  const filtered = pool.filter(
    (a) => a.slug !== current.slug && a.id !== current.id,
  );
  if (filtered.length === 0) return [];

  const currentText = `${current.title || ''} ${current.description || ''}`;

  return [...filtered]
    .sort((a, b) => {
      const oa = topicKeywordOverlap(
        currentText,
        `${a.title || ''} ${a.description || ''}`,
      );
      const ob = topicKeywordOverlap(
        currentText,
        `${b.title || ''} ${b.description || ''}`,
      );
      if (oa !== ob) return ob - oa;

      const catA =
        current.category && a.category === current.category ? 1 : 0;
      const catB =
        current.category && b.category === current.category ? 1 : 0;
      if (catA !== catB) return catB - catA;

      return articleTimestamp(b) - articleTimestamp(a);
    })
    .slice(0, take);
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI': '#FF6B6B',
  'AI Applications': '#4ECDC4',
  'Tech': '#45B7D1',
  'Science': '#96CEB4',
  'Sustainability': '#95E1D3',
  'News': '#FFB6C1',
  'Latest News': '#DDA15E',
};

const DEFAULT_CATEGORY_COLOR = '#A8DADC';

export function getCategoryColor(category?: string): string {
  return CATEGORY_COLORS[category || ''] || DEFAULT_CATEGORY_COLOR;
}

export function getSourceDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Original Source';
  }
}

const WORDS_PER_MINUTE = 200;

export function estimateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

export function sanitizeArticleContent(content: string): string {
  if (!content) {
    return content;
  }

  let sanitized = stripSourceSocialLeaks(content);

  // Remove remaining markdown images (backend already handles most)
  sanitized = sanitized.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // Remove Nuvemmag logo / branding
  sanitized = sanitized.replace(
    /\[!\[[^\]]*\]\([^)]+\)\]\(\s*https?:\/\/(?:www\.)?nuvemmag\.com\/?\s*\)/gi,
    '',
  );
  sanitized = sanitized.replace(
    /<a[^>]*href="https?:\/\/(?:www\.)?nuvemmag\.com\/?"[^>]*>\s*<img[\s\S]*?<\/a>/gi,
    '',
  );
  sanitized = sanitized.replace(
    /!\[[^\]]*\]\([^)]*NuvemMag-Logo[^)]*\)/gi,
    '',
  );

  // Clean broken widget text (legacy content only)
  sanitized = sanitized
    .replace(/>\s*TikTok Embed\s*/gi, '')
    .replace(/>\s*Twitter Widget Iframe\s*/gi, '')
    .replace(/>\s*YouTube Widget\s*/gi, '')
    .replace(/>\s*Watch more exciting videos on TikTok[\\]*\s*/gi, '')
    .replace(/>\s*\[[\d.MK]+\]\([^)]+\)/gi, '')
    .replace(/>\s*Watch now\s*/gi, '')
    .replace(/>\s*\\?\s*/gi, '')
    .replace(/>\s*$/gm, '');

  // Collapse excessive whitespace
  sanitized = sanitized.replace(/(\r?\n){3,}/g, '\n\n');
  sanitized = sanitized.replace(/[ \t]+$/gm, '');

  return sanitized.trim();
}
