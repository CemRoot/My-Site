import { useState, useEffect, useCallback } from 'react';
import { ARTICLES_PER_PAGE, NEWS_CACHE_MAX_AGE_MS, NEWS_CACHE_STALE_MS } from '../constants/animation';
import { TECH_NEWS_API_BASE } from '../constants/urls';
import type { NewsDatabase } from '../types';

interface TechNewsState {
  newsData: {
    version: string;
    lastUpdated: string;
    totalArticles: number;
    articles: NewsDatabase['articles'];
  } | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export function useTechNews(selectedCategory: string) {
  const [state, setState] = useState<TechNewsState>({
    newsData: null,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const updateStateWithNewData = useCallback(
    (data: NewsDatabase, isNewSearch: boolean) => {
      setState((prev) => {
        const newArticles = isNewSearch
          ? data.articles
          : [...(prev.newsData?.articles || []), ...data.articles];

        return {
          ...prev,
          loading: false,
          loadingMore: false,
          newsData: {
            version: '2.0.0',
            lastUpdated: data._cache?.generatedAt || new Date().toISOString(),
            totalArticles: data.pagination.totalArticles,
            articles: newArticles,
          },
        };
      });
    },
    [],
  );

  const fetchFreshData = useCallback(
    async (page: number, cacheKey: string, isNewSearch: boolean) => {
      try {
        setState((prev) => ({
          ...prev,
          loading: isNewSearch ? true : prev.loading,
          loadingMore: !isNewSearch,
        }));

        const categoryQuery =
          selectedCategory && selectedCategory !== 'all'
            ? `&category=${encodeURIComponent(selectedCategory)}`
            : '';
        const apiUrl = `${TECH_NEWS_API_BASE}?page=${page}&limit=${ARTICLES_PER_PAGE}${categoryQuery}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch news (status ${response.status})`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: result.data, timestamp: Date.now() }),
            );
          } catch {
            // Ignore storage errors (quota exceeded, etc.)
          }

          updateStateWithNewData(result.data, isNewSearch);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          loading: false,
          loadingMore: false,
        }));
      }
    },
    [selectedCategory, updateStateWithNewData],
  );

  const fetchNews = useCallback(
    async (page: number = 1, isNewSearch: boolean = false) => {
      const cacheKey = `tech-news-p${page}-c${selectedCategory}`;

      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const ageMs = Date.now() - timestamp;

          if (ageMs < NEWS_CACHE_MAX_AGE_MS) {
            updateStateWithNewData(data, isNewSearch);

            if (ageMs > NEWS_CACHE_STALE_MS) {
              fetchFreshData(page, cacheKey, isNewSearch);
            }
            return;
          }
        }

        await fetchFreshData(page, cacheKey, isNewSearch);
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          loading: false,
          loadingMore: false,
        }));
      }
    },
    [selectedCategory, fetchFreshData, updateStateWithNewData],
  );

  useEffect(() => {
    setState((prev) => ({ ...prev, newsData: null, error: null }));
    setCurrentPage(1);
    fetchNews(1, true);
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(
    (state.newsData?.totalArticles || 0) / ARTICLES_PER_PAGE,
  );

  const handleLoadMore = useCallback(() => {
    if (currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchNews(nextPage, false);
  }, [currentPage, totalPages, fetchNews]);

  return {
    newsData: state.newsData,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    currentPage,
    totalPages,
    currentArticles: state.newsData?.articles || [],
    totalArticles: state.newsData?.totalArticles || 0,
    handleLoadMore,
    refetch: () => fetchNews(currentPage),
  };
}
