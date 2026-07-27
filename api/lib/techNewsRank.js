/**
 * Tech-news list ordering: newest publish date first.
 * Kept under the historical "rank" name so API / snapshot callers stay stable.
 */

/**
 * Sort articles by date DESC, then created_at DESC.
 * @template T
 * @param {T[]} articles
 * @param {number} [_nowMs] unused — kept for call-site compatibility
 * @returns {T[]}
 */
export function sortArticlesByRank(articles, _nowMs = Date.now()) {
  return [...(articles || [])].sort((a, b) => {
    const dateA = String(a?.date || '');
    const dateB = String(b?.date || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);

    const createdA = String(a?.created_at || a?.createdAt || '');
    const createdB = String(b?.created_at || b?.createdAt || '');
    return createdB.localeCompare(createdA);
  });
}

/** @deprecated List order is date-only; freshness no longer affects ranking. */
export function computeDateFreshness() {
  return 0;
}

/** @deprecated Prefer computeDateFreshness — kept as alias for callers. */
export function computeRecencyBoost() {
  return 0;
}

/** @deprecated List order is date-only; composite rank removed. */
export function computeArticleRank() {
  return 0;
}
