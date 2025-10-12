import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Newspaper, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { NewsletterSignup } from './NewsletterSignup';

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
export function TechNews() {
  const [newsData, setNewsData] = useState<NewsDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ARTICLES_PER_PAGE = 20;

  useEffect(() => {
    fetchNews();
  }, []);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [newsData]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const dataUrl = '/data/tech-news.json';
      const response = await fetch(dataUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news (status ${response.status})`);
      }
      
      const data: NewsDatabase = await response.json();
      setNewsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
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

  // Pagination logic
  const totalArticles = newsData?.articles.length || 0;
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = newsData?.articles.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of articles section
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Maximum visible page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
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
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
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
              onClick={fetchNews}
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
            {/* Articles Count & Page Info */}
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalArticles)} of {totalArticles} articles
                {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.map((article) => (
              <Link
                key={article.id}
                to={`/tech-news/${article.slug}`}
                className="group"
              >
                <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 hover:border-primary/50">
                  {/* Article Image */}
                  {article.image && (
                    <div className="relative overflow-hidden h-48 bg-muted">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="line-clamp-3 text-sm">
                      {truncateText(article.description, 150)}
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                      Read article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              <div className="flex gap-2">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-4 py-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => handlePageChange(page as number)}
                        className={`h-10 w-10 ${
                          currentPage === page 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : ''
                        }`}
                      >
                        {page}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
        )}
      </div>
    </main>
  );
}
