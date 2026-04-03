import { useState, useEffect } from 'react';
import { TECH_NEWS_API_BASE } from '../constants/urls';
import { pickRelatedArticles } from '../utils/articleHelpers';
import type { Article } from '../types';

const RELATED_POOL_LIMIT = 60;
const RELATED_DISPLAY_COUNT = 3;

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
            cache: 'no-store',
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
        setArticle(loadedArticle);

        const categoryQuery =
          loadedArticle.category && loadedArticle.category.trim() !== ''
            ? `&category=${encodeURIComponent(loadedArticle.category)}`
            : '';

        const relatedResponse = await fetch(
          `${TECH_NEWS_API_BASE}?page=1&limit=${RELATED_POOL_LIMIT}${categoryQuery}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        if (!relatedResponse.ok) {
          return;
        }

        const relatedPayload = (await relatedResponse.json()) as ArticleListResponse;
        if (
          !controller.signal.aborted &&
          relatedPayload.success &&
          relatedPayload.data?.articles
        ) {
          let pool = relatedPayload.data.articles;

          if (pool.length < RELATED_DISPLAY_COUNT && categoryQuery) {
            const fallbackResponse = await fetch(
              `${TECH_NEWS_API_BASE}?page=1&limit=${RELATED_POOL_LIMIT}`,
              {
                cache: 'no-store',
                signal: controller.signal,
              },
            );
            if (fallbackResponse.ok) {
              const fallbackPayload =
                (await fallbackResponse.json()) as ArticleListResponse;
              if (
                fallbackPayload.success &&
                fallbackPayload.data?.articles?.length
              ) {
                const byId = new Map(pool.map((a) => [a.id, a]));
                for (const a of fallbackPayload.data.articles) {
                  if (!byId.has(a.id)) byId.set(a.id, a);
                }
                pool = [...byId.values()];
              }
            }
          }

          setRelatedArticles(
            pickRelatedArticles(loadedArticle, pool, RELATED_DISPLAY_COUNT),
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
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
