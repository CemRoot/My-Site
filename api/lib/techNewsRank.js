/**
 * Composite tech-news ranking (mirrors SQL list_tech_news_ranked).
 *
 * rank = importance_score * 0.7
 *      + least(views, 200) / 200 * 15
 *      + recency_boost (0–15 linear over last 72h)
 */

const RECENCY_WINDOW_MS = 72 * 60 * 60 * 1000;
const RECENCY_MAX = 15;

/**
 * @param {string | Date | null | undefined} dateOrCreatedAt
 * @param {number} [nowMs]
 */
export function computeRecencyBoost(dateOrCreatedAt, nowMs = Date.now()) {
  if (!dateOrCreatedAt) return 0;
  const ts = new Date(dateOrCreatedAt).getTime();
  if (!Number.isFinite(ts)) return 0;
  const ageMs = nowMs - ts;
  if (ageMs >= RECENCY_WINDOW_MS) return 0;
  if (ageMs <= 0) return RECENCY_MAX;
  return RECENCY_MAX * (1 - ageMs / RECENCY_WINDOW_MS);
}

/**
 * @param {object} article - raw DB row or formatted article
 * @param {number} [nowMs]
 */
export function computeArticleRank(article, nowMs = Date.now()) {
  const importance = Number(
    article?.importance_score ?? article?.importanceScore ?? 50,
  );
  const views = Number(article?.views ?? 0);
  const viewsPart = (Math.min(Number.isFinite(views) ? views : 0, 200) / 200) * 15;
  const ref =
    article?.created_at ||
    article?.createdAt ||
    article?.date ||
    null;
  return (
    (Number.isFinite(importance) ? importance : 50) * 0.7 +
    viewsPart +
    computeRecencyBoost(ref, nowMs)
  );
}

/**
 * Sort articles by rank DESC, then date DESC, then created_at DESC.
 * @template T
 * @param {T[]} articles
 * @param {number} [nowMs]
 * @returns {T[]}
 */
export function sortArticlesByRank(articles, nowMs = Date.now()) {
  return [...(articles || [])].sort((a, b) => {
    const rankDiff = computeArticleRank(b, nowMs) - computeArticleRank(a, nowMs);
    if (rankDiff !== 0) return rankDiff;

    const dateA = String(a?.date || '');
    const dateB = String(b?.date || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);

    const createdA = String(a?.created_at || a?.createdAt || '');
    const createdB = String(b?.created_at || b?.createdAt || '');
    return createdB.localeCompare(createdA);
  });
}
