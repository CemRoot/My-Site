import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Newspaper, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { NewsletterSignup } from './NewsletterSignup';
import { usePageContext } from '../lib/context/PageContext';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../lib/utils/imageProxy';
import ErrorBoundary from './ErrorBoundary';
import { SEO } from './SEO';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  date: string;
  sourceUrl: string;
  slug: string;
  createdAt: string;
  originalTitle?: string;
  category?: string;
  originalSource?: string;
}

interface NewsDatabase {
  version: string;
  lastUpdated: string | null;
  totalArticles: number;
  articles: Article[];
}

/**
 * Tech News Component
 * Displays latest tech news articles translated from Turkish to English
 */
function TechNews() {
  const [newsData, setNewsData] = useState<NewsDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { setPageInfo } = usePageContext();
  
  const ARTICLES_PER_PAGE = 10;

  useEffect(() => {
    // Reset state when category changes
    setNewsData(null);
    setCurrentPage(1);
    fetchNews(1, true);
  }, [selectedCategory]);

  const fetchFreshData = async (page: number, cacheKey: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const categoryQuery = selectedCategory && selectedCategory !== 'all'
        ? `&category=${encodeURIComponent(selectedCategory)}`
        : '';
      const apiUrl = `/api/tech-news?page=${page}&limit=${ARTICLES_PER_PAGE}${categoryQuery}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch news (status ${response.status})`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Save to sessionStorage
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            timestamp: Date.now()
          }));
        } catch {
          // Ignore storage errors (quota exceeded, etc.)
        }

        updateStateWithNewData(result.data, isNewSearch);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateStateWithNewData = (data: any, isNewSearch: boolean) => {
    setNewsData((prevData) => {
      const newArticles = isNewSearch
        ? data.articles
        : [...(prevData?.articles || []), ...data.articles];

      return {
        version: '2.0.0',
        lastUpdated: data._cache?.generatedAt || new Date().toISOString(),
        totalArticles: data.pagination.totalArticles,
        articles: newArticles
      };
    });
  };

  const fetchNews = async (page: number = 1, isNewSearch: boolean = false) => {
    const cacheKey = `tech-news-p${page}-c${selectedCategory}`;

    try {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const ageMs = Date.now() - timestamp;
        const maxAgeMs = 5 * 60 * 1000; // 5 minutes

        if (ageMs < maxAgeMs) {
          // Use cached data immediately
          updateStateWithNewData(data, isNewSearch);
          setLoading(false);
          setLoadingMore(false);

          // Still fetch fresh data in background if cache is older than 2 minutes
          if (ageMs > 2 * 60 * 1000) {
            fetchFreshData(page, cacheKey, isNewSearch);
          }
          return;
        }
      }

      // No valid cache, fetch fresh
      await fetchFreshData(page, cacheKey, isNewSearch);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle format: "2/7/2025" (day/month/year) or ISO format
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'AI': '#FF6B6B',
      'AI Applications': '#4ECDC4',
      'Tech': '#45B7D1',
      'Science': '#96CEB4',
      'Sustainability': '#95E1D3',
      'News': '#FFB6C1',
      'Latest News': '#DDA15E'
    };
    return colors[category || ''] || '#A8DADC';
  };

  const AVAILABLE_CATEGORIES: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'AI Applications', value: 'AI Applications' },
    { label: 'AI', value: 'AI' },
    { label: 'Tech', value: 'Tech' },
    { label: 'Science', value: 'Science' },
    { label: 'Sustainability', value: 'Sustainability' },
    { label: 'News', value: 'News' },
    { label: 'Latest News', value: 'Latest News' },
  ];

  // Pagination logic (server-side pagination)
  const totalArticles = newsData?.totalArticles || 0;
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  const currentArticles = newsData?.articles || [];

  const handleLoadMore = () => {
    if (currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchNews(nextPage, false);
  };

  useEffect(() => {
    const total = Math.max(1, totalPages || 1);
    const articles = newsData?.articles ?? [];
    const highlights = articles.slice(0, 3).map((article) => {
      const formattedDate = formatDate(article.date);
      return `${article.title} — ${formattedDate}`;
    });

    const categoryLabel =
      selectedCategory !== 'all'
        ? `Currently filtered by ${selectedCategory}.`
        : 'Showing all categories.';

    setPageInfo({
      path: '/tech-news',
      title: 'Tech Insights - Latest News',
      summary: `Translated Turkish technology news curated by Cem Koyluoglu. Displaying page ${currentPage} of ${total}. ${categoryLabel}`,
      highlights,
      lastUpdated: newsData?.lastUpdated || undefined,
    });
  }, [setPageInfo, newsData, selectedCategory, currentPage, totalPages]);

  useEffect(() => () => setPageInfo(null), [setPageInfo]);

  return (
    <>
      <SEO
        title="Tech News | Cem Koyluoglu"
        description="Latest technology news, translated and summarized by AI. Stay up to date with AI, tech, startups, and software engineering news."
        ogTitle="Tech News | Cem Koyluoglu"
        ogDescription="Latest technology news, translated and summarized by AI. Stay up to date with AI, tech, startups, and software engineering news."
      />
    <main
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24"
      style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Latest Tech News</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent antialiased leading-tight" style={{ lineHeight: '1.3', paddingTop: '0.15em', paddingBottom: '0.2em' }}>
            Tech Insights
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest technology news, trends, and innovations from around the world
          </p>
          
          {newsData && newsData.lastUpdated && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Updated{' '}
                  {new Date(newsData.lastUpdated).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <Newspaper className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Failed to Load Articles</h3>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <button
              onClick={() => fetchNews(currentPage)}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-black rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && newsData && newsData.articles.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No Articles Yet</h3>
            <p className="text-muted-foreground">
              Tech news articles will appear here once scraped
            </p>
          </div>
        )}

        {/* Newsletter Signup */}
        {!loading && !error && (
          <div className="mb-16">
            <NewsletterSignup />
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && newsData && newsData.articles.length > 0 && (
          <>
            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {AVAILABLE_CATEGORIES.map((c) => (
                <Button
                  key={c.value}
                  variant={selectedCategory === c.value ? 'default' : 'outline'}
                  onClick={() => {
                    if (selectedCategory !== c.value) {
                      setSelectedCategory(c.value);
                      setCurrentPage(1);
                    }
                  }}
                  className={`h-9 px-4 ${selectedCategory === c.value ? '' : 'bg-background'}`}
                  style={{
                    ...(selectedCategory === c.value && c.value !== 'all' ? { backgroundColor: getCategoryColor(c.value), color: '#000' } : {})
                  }}
                >
                  {c.label}
                </Button>
              ))}
            </div>

            {/* Articles Count & Page Info */}
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {currentArticles.length} of {totalArticles} articles
                {selectedCategory !== 'all' && ` • Category: ${selectedCategory}`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.map((article) => (
              <ErrorBoundary key={article.id} title="Failed to load article card">
                <Link
                  to={`/tech-news/${article.slug}`}
                  className="group block h-full"
                >
                  <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 hover:border-primary/50">
                    {/* Article Image - Optimized via CDN */}
                    {article.image && (
                      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '16/9', minHeight: '200px', maxHeight: '200px' }}>
                        <img
                          src={getOptimizedImageUrl(article.image, IMAGE_PRESETS.thumbnail)}
                          alt={article.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          width={400}
                          height={225}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: getCategoryColor(article.category),
                            color: '#000'
                          }}
                        >
                          {article.category || 'Tech News'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.date)}
                        </div>
                      </div>

                      <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors font-[Hobo_BT]" style={{ fontWeight: 600 }}>
                        {article.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <CardDescription className="line-clamp-3 text-sm">
                        {truncateText(article.description, 150)}
                      </CardDescription>
                    </CardContent>

                    <CardFooter className="pt-4 mt-auto">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                        Read article
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </ErrorBoundary>
            ))}
          </div>

          {/* Loading More State */}
          {loadingMore && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {[...Array(3)].map((_, i) => (
                <Card key={`loading-more-${i}`} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {currentPage < totalPages && !loadingMore && (
            <div className="mt-12 flex justify-center items-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                className="px-8 py-6 text-lg rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Load More Articles
              </Button>
            </div>
          )}
        </>
        )}
      </div>
    </main>
    </>
  );
}

export default function TechNewsWithErrorBoundary() {
  return (
    <ErrorBoundary title="Failed to load Tech News">
      <TechNews />
    </ErrorBoundary>
  );
}
