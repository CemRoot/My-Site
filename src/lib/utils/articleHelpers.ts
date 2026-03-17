/**
 * Shared helpers for the Tech News feature.
 *
 * Extracted from TechNews.tsx & TechNewsDetail.tsx to eliminate
 * duplication and keep components focused on rendering.
 */

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

  let sanitized = content;

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
