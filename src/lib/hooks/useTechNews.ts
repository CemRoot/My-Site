import { useState, useEffect, useCallback, useRef } from 'react';
import { ARTICLES_PER_PAGE, NEWS_CACHE_MAX_AGE_MS } from '../constants/animation';
import { TECH_NEWS_API_BASE } from '../constants/urls';
import type { NewsDatabase } from '../types';

const BUILD_SNAPSHOT_URL = '/tech-news-latest.json';

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

function mergePaginatedArticles(
  existingArticles: NewsDatabase['articles'],
  incomingArticles: NewsDatabase['articles'],
) {
  const mergedArticles = [...existingArticles];
  const articleIndexById = new Map(
    mergedArticles.map((article, index) => [article.id, index]),
  );

  for (const article of incomingArticles) {
    const existingIndex = articleIndexById.get(article.id);
    if (existingIndex === undefined) {
      articleIndexById.set(article.id, mergedArticles.length);
      mergedArticles.push(article);
      continue;
    }

    mergedArticles[existingIndex] = article;
  }

  return mergedArticles;
}

/** Newest publish date first (createdAt tie-break) — keeps UI chronological even if API lag. */
function sortArticlesByDateDesc(articles: NewsDatabase['articles']) {
  return [...articles].sort((a, b) => {
    const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCmp !== 0) return dateCmp;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

async function loadBuildSnapshot(): Promise<NewsDatabase | null> {
  try {
    const response = await fetch(BUILD_SNAPSHOT_URL, { cache: 'default' });
    if (!response.ok) return null;
    const result = await response.json();
    if (result?.success && result?.data?.articles?.length) {
      return result.data as NewsDatabase;
    }
  } catch {
    // Snapshot is best-effort
  }
  return null;
}

export function useTechNews(
  selectedCategory: string,
  restorationTargetPage: number | null = null,
) {
  const [state, setState] = useState<TechNewsState>({
    newsData: null,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const restorationChainDoneRef = useRef(false);

  const updateStateWithNewData = useCallback(
    (data: NewsDatabase, isNewSearch: boolean) => {
      setState((prev) => {
        const newArticles = isNewSearch
          ? data.articles
          : mergePaginatedArticles(prev.newsData?.articles || [], data.articles);

        return {
          ...prev,
          loading: false,
          loadingMore: false,
          newsData: {
            version: '2.0.0',
            lastUpdated: data._cache?.generatedAt || new Date().toISOString(),
            totalArticles: data.pagination?.totalArticles ?? data.articles.length,
            articles: sortArticlesByDateDesc(newArticles),
          },
        };
      });
    },
    [],
  );

  const fetchFreshData = useCallback(
    async (
      page: number,
      cacheKey: string,
      isNewSearch: boolean,
      backgroundRefresh: boolean = false,
    ) => {
      try {
        if (!backgroundRefresh) {
          setState((prev) => ({
            ...prev,
            loading: isNewSearch && !prev.newsData ? true : prev.loading,
            loadingMore: !isNewSearch,
          }));
        }

        const categoryQuery =
          selectedCategory && selectedCategory !== 'all'
            ? `&category=${encodeURIComponent(selectedCategory)}`
            : '';
        const apiUrl = `${TECH_NEWS_API_BASE}?page=${page}&limit=${ARTICLES_PER_PAGE}${categoryQuery}`;
        const response = await fetch(apiUrl, { cache: 'default' });

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
          error:
            backgroundRefresh && prev.newsData
              ? prev.error
              : err instanceof Error
                ? err.message
                : 'Unknown error',
          loading: backgroundRefresh ? prev.loading : false,
          loadingMore: backgroundRefresh ? prev.loadingMore : false,
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
            void fetchFreshData(page, cacheKey, isNewSearch, true);
            return;
          }
        }

        // Cold first page (all categories): paint from build snapshot, then refresh API
        if (
          isNewSearch &&
          page === 1 &&
          (!selectedCategory || selectedCategory === 'all')
        ) {
          const snapshot = await loadBuildSnapshot();
          if (snapshot) {
            updateStateWithNewData(snapshot, true);
            void fetchFreshData(page, cacheKey, true, true);
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
    restorationChainDoneRef.current = false;
    setState((prev) => ({ ...prev, newsData: null, error: null, loading: true }));
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

  useEffect(() => {
    if (!restorationTargetPage || restorationTargetPage <= 1) return;
    if (restorationChainDoneRef.current) return;
    if (state.loading || state.loadingMore) return;

    if (currentPage >= restorationTargetPage || currentPage >= totalPages) {
      restorationChainDoneRef.current = true;
      return;
    }

    handleLoadMore();
  }, [
    restorationTargetPage,
    state.loading,
    state.loadingMore,
    currentPage,
    totalPages,
    handleLoadMore,
  ]);

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
    refetch: () =>
      fetchFreshData(
        currentPage,
        `tech-news-p${currentPage}-c${selectedCategory}`,
        currentPage === 1,
      ),
  };
}
