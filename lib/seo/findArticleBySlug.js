/**
 * Slug → tech_news_articles row, shared by the JSON API (api/tech-news.js, Edge)
 * and the server-rendered article page. Runtime-agnostic: the caller passes its
 * own Supabase client.
 *
 * Lookup order: exact slug → slug prefix (old links to since-suffixed slugs) →
 * legacy title-derived slug.
 */

export const MAX_SLUG_LENGTH = 200;

export function isValidSlug(slug) {
  return (
    typeof slug === 'string' &&
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    /^[a-z0-9-]+$/i.test(slug)
  );
}

export function normalizeSlugValue(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(String(value)).toLowerCase().replace(/\/+$/, '');
  } catch {
    return String(value).toLowerCase().replace(/\/+$/, '');
  }
}

export function generateLegacyTitleSlug(title) {
  const normalizedWords = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return '';
  }

  let slug = normalizedWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (slug.length > 60) {
    const shortened = slug.substring(0, 60).replace(/-+$/g, '');
    const lastDash = shortened.lastIndexOf('-');
    slug = lastDash > 20 ? shortened.substring(0, lastDash) : shortened;
  }

  return slug;
}

async function findLegacyTitleSlugArticle(supabase, slug) {
  const normalizedSlug = normalizeSlugValue(slug);
  if (!normalizedSlug) return null;

  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    console.error('Legacy title-slug fallback error:', error);
    return null;
  }

  return (data || []).find(article => {
    const legacyTitleSlug = generateLegacyTitleSlug(article.title);
    return (
      legacyTitleSlug === normalizedSlug ||
      legacyTitleSlug.startsWith(`${normalizedSlug}-`) ||
      normalizedSlug.startsWith(`${legacyTitleSlug}-`)
    );
  }) || null;
}

/**
 * @returns {Promise<object|null>} the raw row, or null when nothing matches
 * @throws when the primary lookup failed and no fallback matched
 */
export async function findArticleBySlug(supabase, slug) {
  const { data: exactArticle, error: exactError } = await supabase
    .from('tech_news_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (exactArticle) return exactArticle;
  if (exactError) {
    console.error('Exact slug lookup error:', exactError);
  }

  const { data: legacyMatches, error: legacyError } = await supabase
    .from('tech_news_articles')
    .select('*')
    .like('slug', `${slug}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (legacyError) {
    console.error('Legacy slug fallback error:', legacyError);
  }

  if (legacyMatches?.[0]) return legacyMatches[0];

  const legacyTitleMatch = await findLegacyTitleSlugArticle(supabase, slug);
  if (legacyTitleMatch) return legacyTitleMatch;

  // A failed primary lookup is an outage, not a missing article: callers must
  // not answer 404 (and get the URL dropped from the index) for it.
  if (exactError) throw exactError;
  return null;
}
