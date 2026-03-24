import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { NewsletterSignup } from './NewsletterSignup';
import { usePageContext } from '../lib/context/PageContext';
import ErrorBoundary from './ErrorBoundary';
import { SEO } from './SEO';
import { formatDate } from '../lib/utils/formatDate';
import { getCategoryColor } from '../lib/utils/articleHelpers';
import { TechNewsArticleCard } from './TechNewsArticleCard';
import { useTechNews } from '../lib/hooks/useTechNews';

/**
 * Tech News Component
 * Displays latest tech news articles translated from Turkish to English
 */
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

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function TechNews() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { setPageInfo } = usePageContext();

  const {
    newsData,
    loading,
    loadingMore,
    error,
    currentPage,
    totalPages,
    currentArticles,
    totalArticles,
    handleLoadMore,
    refetch,
  } = useTechNews(selectedCategory);

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
              onClick={refetch}
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
                <TechNewsArticleCard
                  key={article.id}
                  article={article}
                  truncateText={truncateText}
                />
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
