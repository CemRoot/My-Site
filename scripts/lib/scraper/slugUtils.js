/**
 * Slug generation utilities — no external dependencies.
 * Used by database.js (persistence) and importable in tests without
 * triggering the Supabase client initialization.
 */

/**
 * Transliterate common non-ASCII characters (Turkish and Latin extended) to their
 * ASCII equivalents. Applied before slug generation to ensure URLs are ASCII-safe.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function transliterateToAscii(text) {
  if (!text) return '';
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/â/g, 'a').replace(/Â/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/û/g, 'u').replace(/Û/g, 'U')
    .replace(/é/g, 'e').replace(/É/g, 'E')
    .replace(/è/g, 'e').replace(/È/g, 'E')
    .replace(/ê/g, 'e').replace(/Ê/g, 'E')
    .replace(/ë/g, 'e').replace(/Ë/g, 'E')
    .replace(/à/g, 'a').replace(/À/g, 'A')
    .replace(/á/g, 'a').replace(/Á/g, 'A')
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/ã/g, 'a').replace(/Ã/g, 'A')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
    .replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036F]/g, '');
}

const SLUG_STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from',
  'in', 'into', 'is', 'of', 'on', 'or', 'that', 'the',
  'this', 'to', 'with',
]);

function trimTrailingStopWords(words) {
  while (words.length > 4 && SLUG_STOP_WORDS.has(words[words.length - 1])) {
    words.pop();
  }
}

/**
 * Generate a URL-safe kebab-case slug from a title.
 * Applies ASCII transliteration first so Turkish (and other non-ASCII)
 * characters are converted rather than silently dropped.
 *
 * @param {string} title
 * @returns {string}
 */
export function generateSlug(title) {
  const normalizedWords = transliterateToAscii(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return 'article';
  }

  const slugWords = [];
  for (const word of normalizedWords) {
    const candidate = [...slugWords, word].join('-').replace(/-+/g, '-');
    // Early-stop heuristic: if adding this word would exceed 72 chars and we
    // already have at least 6 words, stop collecting. The hard 60-char trim
    // that follows will produce the final URL-safe length.
    if (candidate.length > 72 && slugWords.length >= 6) {
      break;
    }

    slugWords.push(word);

    if (slugWords.length >= 10) {
      break;
    }
  }

  trimTrailingStopWords(slugWords);

  let slug = slugWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (slug.length > 60) {
    const shortened = slug.substring(0, 60).replace(/-+$/g, '');
    const lastDash = shortened.lastIndexOf('-');
    slug = lastDash > 20 ? shortened.substring(0, lastDash) : shortened;
  }

  const finalWords = slug.split('-').filter(Boolean);
  trimTrailingStopWords(finalWords);
  slug = finalWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return slug || normalizedWords.slice(0, 4).join('-');
}
