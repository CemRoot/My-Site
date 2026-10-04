/**
 * Which tech-news articles search engines may index.
 *
 * Legacy articles are machine translations of a single Turkish outlet. They stay
 * readable on the site but are kept out of the index (noindex, follow) so they
 * cannot drag down the domain. Only first-party "original" pieces are indexable.
 */

import { ROBOTS_INDEX, ROBOTS_NOINDEX_FOLLOW } from './siteMeta.js';

export const SOURCE_KIND_TRANSLATED = 'translated';
export const SOURCE_KIND_ORIGINAL = 'original';

/** Accepts a raw Supabase row (source_kind) or a formatted API article (sourceKind). */
export function getSourceKind(article) {
  return article?.source_kind ?? article?.sourceKind ?? SOURCE_KIND_TRANSLATED;
}

export function isIndexableArticle(article) {
  return getSourceKind(article) === SOURCE_KIND_ORIGINAL;
}

export function articleRobots(article) {
  return isIndexableArticle(article) ? ROBOTS_INDEX : ROBOTS_NOINDEX_FOLLOW;
}
