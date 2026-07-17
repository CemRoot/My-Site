import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../lib/utils/imageProxy';
import { formatDate } from '../lib/utils/formatDate';
import { getCategoryColor } from '../lib/utils/articleHelpers';
import { prefetchArticle } from '../lib/hooks/useArticle';
import ErrorBoundary from './ErrorBoundary';
import type { Article } from '../lib/types';

/** Above-the-fold cards on desktop (3-col) + mobile (1-col first screen) */
const PRIORITY_IMAGE_COUNT = 3;

let detailChunkPrefetchStarted = false;

function prefetchDetailChunk() {
  if (detailChunkPrefetchStarted) return;
  detailChunkPrefetchStarted = true;
  void import('./TechNewsDetail').catch(() => {
    detailChunkPrefetchStarted = false;
  });
}

interface TechNewsArticleCardProps {
  article: Article;
  truncateText: (text: string, maxLength: number) => string;
  onBeforeNavigate?: () => void;
  /** Zero-based index in the visible list — first cards get high-priority images */
  index?: number;
}

export function TechNewsArticleCard({
  article,
  truncateText,
  onBeforeNavigate,
  index = 0,
}: TechNewsArticleCardProps) {
  const prioritizeImage = index < PRIORITY_IMAGE_COUNT;

  const handlePrefetch = () => {
    prefetchDetailChunk();
    prefetchArticle(article.slug);
  };

  return (
    <ErrorBoundary title="Failed to load article card">
      <Link
        to={`/tech-news/${article.slug}`}
        className="group block h-full"
        onClick={() => onBeforeNavigate?.()}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
      >
        <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 border-border/50 hover:border-primary/50">
          {article.image && (
            <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '16/9', minHeight: '200px', maxHeight: '200px' }}>
              <img
                src={getOptimizedImageUrl(article.image, IMAGE_PRESETS.thumbnail)}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading={prioritizeImage ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={prioritizeImage ? 'high' : 'low'}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                width={400}
                height={225}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackApplied !== 'true' && article.image) {
                    img.dataset.fallbackApplied = 'true';
                    img.src = article.image;
                    return;
                  }
                  img.style.display = 'none';
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
  );
}
