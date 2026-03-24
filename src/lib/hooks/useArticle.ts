import { useState, useEffect } from 'react';
import { TECH_NEWS_API_BASE } from '../constants/urls';
import type { Article } from '../types';

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

        if (!loadedArticle.category) {
          return;
        }

        const relatedResponse = await fetch(
          `${TECH_NEWS_API_BASE}?page=1&limit=4&category=${encodeURIComponent(loadedArticle.category)}`,
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
          setRelatedArticles(
            relatedPayload.data.articles
              .filter((article) => article.slug !== loadedArticle.slug)
              .slice(0, 3),
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
