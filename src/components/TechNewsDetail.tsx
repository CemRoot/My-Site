import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, Share2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { DEFAULT_OG_IMAGE_URL } from '../lib/constants/urls';
import { usePageContext } from '../lib/context/PageContext';
import SmartMarkdown from './markdown/SmartMarkdown';
import { SEO } from './SEO';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../lib/utils/imageProxy';
import ErrorBoundary from './ErrorBoundary';
import { formatDate } from '../lib/utils/formatDate';
import {
  getCategoryColor,
  estimateReadTime,
  sanitizeArticleContent,
} from '../lib/utils/articleHelpers';
import { useArticle } from '../lib/hooks/useArticle';

function TechNewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { article, relatedArticles, loading, error } = useArticle(slug);
  const { setPageInfo } = usePageContext();

  const handleShare = async () => {
    const shareData = {
      title: article?.title || '',
      text: article?.description || '',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  useEffect(() => {
    setPageInfo({
      path: `/tech-news/${slug ?? ''}`,
      title: 'Tech News Article',
      summary:
        'Detailed view of a translated technology article with publish date and related reading suggestions.',
    });
  }, [setPageInfo, slug]);

  useEffect(() => {
    if (!article) {
      return;
    }

    const preview =
      article.description ||
      sanitizeArticleContent(article.content || '')
        .split('\n')
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');

    setPageInfo({
      path: `/tech-news/${article.slug}`,
      title: article.title,
      summary: preview || 'Full article content from the selected tech news story.',
      highlights: [
        `Category: ${article.category || 'General'}`,
        `Published: ${formatDate(article.date)}`,
      ],
      lastUpdated: article.createdAt,
    });
  }, [article, setPageInfo]);

  useEffect(() => () => setPageInfo(null), [setPageInfo]);

  if (loading) {
    return (
      <main
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
      >
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'The article you are looking for does not exist.'}
          </p>
          <Button onClick={() => navigate('/tech-news')} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tech News
          </Button>
        </div>
      </main>
    );
  }

  const sanitizedContent = sanitizeArticleContent(article.content);
  const estimatedMinutes = estimateReadTime(sanitizedContent);

  return (
    <>
      {/* Dynamic SEO for Article */}
      <SEO
        title={`${article.title} | Tech News`}
        description={article.description}
        ogTitle={article.title}
        ogDescription={article.description}
        ogImage={article.image || DEFAULT_OG_IMAGE_URL}
      />
      
      <main
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)' }}
      >
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          asChild
          className="mb-8 hover:bg-primary/10"
        >
          <Link to="/tech-news">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tech News
          </Link>
        </Button>

        {/* Article Header */}
        <article className="space-y-8">
          <header className="space-y-6">
            <Badge 
              variant="secondary" 
              className="text-sm"
              style={{
                backgroundColor: getCategoryColor(article.category),
                color: '#000'
              }}
            >
              {article.category || 'Tech News'}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight font-[Hobo_BT]">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(article.date)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {estimatedMinutes} min read
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="ml-auto"
                aria-label="Share this article"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {article.description && (
              <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                {article.description}
              </p>
            )}
          </header>

          {/* Featured Image - Optimized via CDN */}
          {article.image && (
            <div className="relative overflow-hidden rounded-lg aspect-video bg-muted">
              <img
                src={getOptimizedImageUrl(article.image, IMAGE_PRESETS.hero)}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                width={1200}
                height={675}
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <Separator />

          {/* Article Content - Using SmartMarkdown for safe rendering with auto-embeds */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <SmartMarkdown content={sanitizedContent} />
          </div>

        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16" aria-label="Related articles">
            <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/tech-news/${related.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full flex flex-col">
                    {related.image && (
                      <div className="relative overflow-hidden aspect-video bg-muted">
                        <img
                          src={getOptimizedImageUrl(related.image, IMAGE_PRESETS.related)}
                          alt={related.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          width={300}
                          height={169}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors font-[Hobo_BT] text-sm md:text-base">
                        {related.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2">
                        {formatDate(related.date)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
    </>
  );
}

export default function TechNewsDetailWithErrorBoundary() {
  return (
    <ErrorBoundary title="Failed to load article detail">
      <TechNewsDetail />
    </ErrorBoundary>
  );
}
