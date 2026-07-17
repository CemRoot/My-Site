import { useState, useEffect } from 'react';
import { TECH_NEWS_API_BASE } from '../constants/urls';
import { pickRelatedArticles } from '../utils/articleHelpers';
import type { Article } from '../types';

/** Small pool is enough for pickRelatedArticles scoring of 3 cards */
const RELATED_POOL_LIMIT = 24;
const RELATED_DISPLAY_COUNT = 3;

const FETCH_CACHE: RequestCache = 'default';

interface ArticleDetailResponse {
  success: boolean;
  article?: Article;
  message?: string;
}

interface ArticleListResponse {
  success: boolean;
  data?: {
    articles: Article[];
  };
  message?: string;
}

async function fetchRelatedPool(
  loadedArticle: Article,
  signal: AbortSignal,
): Promise<Article[]> {
  const categoryQuery =
    loadedArticle.category && loadedArticle.category.trim() !== ''
      ? `&category=${encodeURIComponent(loadedArticle.category)}`
      : '';

  const relatedResponse = await fetch(
    `${TECH_NEWS_API_BASE}?page=1&limit=${RELATED_POOL_LIMIT}${categoryQuery}`,
    {
      cache: FETCH_CACHE,
      signal,
    },
  );

  if (!relatedResponse.ok) {
    return [];
  }

  const relatedPayload = (await relatedResponse.json()) as ArticleListResponse;
  if (!relatedPayload.success || !relatedPayload.data?.articles) {
    return [];
  }

  let pool = relatedPayload.data.articles;

  if (pool.length < RELATED_DISPLAY_COUNT && categoryQuery) {
    const fallbackResponse = await fetch(
      `${TECH_NEWS_API_BASE}?page=1&limit=${RELATED_POOL_LIMIT}`,
      {
        cache: FETCH_CACHE,
        signal,
      },
    );
    if (fallbackResponse.ok) {
      const fallbackPayload =
        (await fallbackResponse.json()) as ArticleListResponse;
      if (fallbackPayload.success && fallbackPayload.data?.articles?.length) {
        const byId = new Map(pool.map((a) => [a.id, a]));
        for (const a of fallbackPayload.data.articles) {
          if (!byId.has(a.id)) byId.set(a.id, a);
        }
        pool = [...byId.values()];
      }
    }
  }

  return pool;
}

export function useArticle(slug: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        setArticle(null);
        setRelatedArticles([]);

        const articleResponse = await fetch(
          `${TECH_NEWS_API_BASE}?slug=${encodeURIComponent(slug)}`,
          {
            cache: FETCH_CACHE,
            signal: controller.signal,
          },
        );

        if (!articleResponse.ok) {
          throw new Error('Article not found');
        }

        const articlePayload =
          (await articleResponse.json()) as ArticleDetailResponse;

        if (!articlePayload.success || !articlePayload.article) {
          throw new Error(articlePayload.message || 'Article not found');
        }

        if (controller.signal.aborted) return;

        const loadedArticle = articlePayload.article;
        // Unblock LCP/hero immediately — related articles load in background
        setArticle(loadedArticle);
        setLoading(false);

        try {
          const pool = await fetchRelatedPool(loadedArticle, controller.signal);
          if (controller.signal.aborted) return;
          setRelatedArticles(
            pickRelatedArticles(loadedArticle, pool, RELATED_DISPLAY_COUNT),
          );
        } catch {
          // Related is non-critical; article already visible
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      controller.abort();
    };
  }, [slug]);

  return { article, relatedArticles, loading, error };
}

/** Prefetch article JSON on hover/focus so detail navigations feel instant */
export function prefetchArticle(slug: string): void {
  if (!slug) return;
  void fetch(`${TECH_NEWS_API_BASE}?slug=${encodeURIComponent(slug)}`, {
    cache: FETCH_CACHE,
  }).catch(() => {});
}
