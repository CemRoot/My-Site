import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, ExternalLink, Clock, Share2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { usePageContext } from '../lib/context/PageContext';

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
  articles: Article[];
}

/**
 * Tech News Detail Component
 * Displays full article content with markdown rendering
 */
function sanitizeArticleContent(content: string) {
  if (!content) {
    return content;
  }

  let sanitized = content;

  // ============================================
  // FRONTEND CONTENT SANITIZATION
  // Additional safety layer for content cleaning
  // ============================================
  
  // 1. Remove ANY remaining markdown images (backend should already clean these)
  sanitized = sanitized.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // 2. Clean up broken social media widget fragments (from poor translations)
  // These appear as blockquote-style text that should be proper widgets
  sanitized = sanitized
    // Remove broken TikTok embed fragments
    .replace(/>\s*TikTok Embed\s*/gi, '\n\n__TIKTOK_WIDGET__\n\n')
    .replace(/>\s*Twitter Widget Iframe\s*/gi, '\n\n__TWITTER_WIDGET__\n\n')
    .replace(/>\s*YouTube Widget\s*/gi, '\n\n__YOUTUBE_WIDGET__\n\n')
    // Remove broken social media text fragments
    .replace(/>\s*Watch more exciting videos on TikTok[\\]*\s*/gi, '')
    .replace(/>\s*Watch more exciting videos on TikTokWatch more exciting videos on TikTok[\\]*\s*/gi, '')
    .replace(/>\s*@\w+\s*/gi, '')
    .replace(/>\s*\d+(\.\d+)?[MK]?\s+\d+(\.\d+)?[MK]?\s+\d+(\.\d+)?[MK]?\s*/gi, '') // View counts like "13.6M 130.4K 578.4K"
    .replace(/>\s*Watch now\s*/gi, '')
    .replace(/>\s*I never thought.*?See more\s*/gi, '')
    .replace(/>\s*Sunset Lover.*?Petit Biscuit\s*/gi, '')
    .replace(/>\s*Ineverthought.*?See more\s*/gi, '')
    // Remove empty blockquote lines
    .replace(/>\s*\\?\s*/gi, '')
    .replace(/>\s*$/gm, '')
    // Clean up excessive line breaks
    .replace(/\n{3,}/g, '\n\n');

  // 3. Remove Nuvemmag logo and branding
  sanitized = sanitized.replace(
    /\[!\[[^\]]*\]\([^)]+\)\]\(\s*https?:\/\/(?:www\.)?nuvemmag\.com\/?\s*\)/gi,
    '',
  );
  sanitized = sanitized.replace(
    /<a[^>]*href="https?:\/\/(?:www\.)?nuvemmag\.com\/?"[^>]*>\s*<img[\s\S]*?<\/a>/gi,
    '',
  );
  sanitized = sanitized.replace(
    /!\[[^\]]*\]\([^)]*NuvemMag-Logo[^)]*\)/gi,
    '',
  );

  // 4. Remove social media URLs that might have escaped
  sanitized = sanitized.replace(/https?:\/\/(?:www\.)?twitter\.com\/[^\s\)]+/gi, '');
  sanitized = sanitized.replace(/https?:\/\/(?:www\.)?x\.com\/[^\s\)]+/gi, '');
  sanitized = sanitized.replace(/https?:\/\/(?:www\.)?instagram\.com\/[^\s\)]+/gi, '');
  sanitized = sanitized.replace(/https?:\/\/(?:www\.)?youtube\.com\/[^\s\)]+/gi, '');

  // 5. Clean up excessive whitespace
  sanitized = sanitized.replace(/(\r?\n){3,}/g, '\n\n');
  sanitized = sanitized.replace(/[ \t]+$/gm, '');

  return sanitized.trim();
}

export function TechNewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setPageInfo } = usePageContext();

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // Fetch specific article by slug
      const articleResponse = await fetch(`/api/tech-news?slug=${slug}`);
      
      if (!articleResponse.ok) {
        throw new Error('Article not found');
      }
      
      const articleResult = await articleResponse.json();
      
      if (!articleResult.success || !articleResult.article) {
        throw new Error('Article not found');
      }
      
      setArticle(articleResult.article);
      
      // Fetch related articles (3 recent articles from same category if available)
      const category = articleResult.article.category;
      const relatedResponse = await fetch(`/api/tech-news?limit=4&category=${category || 'all'}`);
      
      if (relatedResponse.ok) {
        const relatedResult = await relatedResponse.json();
        if (relatedResult.success && relatedResult.data.articles) {
          // Filter out current article and take 3
          const otherArticles = relatedResult.data.articles.filter(
            (a: Article) => a.id !== articleResult.article.id
          );
          setRelatedArticles(otherArticles.slice(0, 3));
        }
      }
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

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

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

  const getSourceDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      // Capitalize first letter
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Original Source';
    }
  };

  useEffect(() => {
    setPageInfo({
      path: `/tech-news/${slug ?? ''}`,
      title: 'Tech News Article',
      summary:
        'Detailed view of a translated technology article with publish date, original source, and related reading suggestions.',
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
        `Source: ${getSourceDomain(article.sourceUrl)}`,
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

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
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
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {article.description && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {article.description}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {article.image && (
            <div className="relative overflow-hidden rounded-lg aspect-video bg-muted">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <Separator />

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{
                __html: sanitizedContent
                  // Convert markdown headers to HTML
                  .replace(/^### (.*$)/gim, '<h4 class="text-xl font-bold mt-4 mb-2">$1</h4>')
                  .replace(/^## (.*$)/gim, '<h3 class="text-2xl font-bold mt-6 mb-3">$1</h3>')
                  .replace(/^# (.*$)/gim, '<h2 class="text-3xl font-bold mt-8 mb-4">$1</h2>')
                  // Convert markdown links
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
                  // Convert markdown bold
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/__(.*?)__/g, '<strong>$1</strong>')
                  // Convert markdown italic
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/_(.*?)_/g, '<em>$1</em>')
                  // Convert line breaks
                  .replace(/\n\n/g, '</p><p class="text-lg leading-relaxed mb-4">')
                  .replace(/^(.+)$/gm, '<p class="text-lg leading-relaxed mb-4">$1</p>')
                  // Handle Social Media Widget placeholders
                  .replace(/__TWITTER_WIDGET__/gi, '<div class="my-6 p-4 border border-blue-200 rounded-lg bg-blue-50 text-center text-blue-600"><div class="flex items-center justify-center mb-2"><svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span class="font-medium">Twitter Post</span></div><p class="text-sm">Original Twitter content from the source article</p></div>')
                  .replace(/__TIKTOK_WIDGET__/gi, '<div class="my-6 p-4 border border-pink-200 rounded-lg bg-pink-50 text-center text-pink-600"><div class="flex items-center justify-center mb-2"><svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg><span class="font-medium">TikTok Video</span></div><p class="text-sm">Original TikTok content from the source article</p></div>')
                  .replace(/__YOUTUBE_WIDGET__/gi, '<div class="my-6 p-4 border border-red-200 rounded-lg bg-red-50 text-center text-red-600"><div class="flex items-center justify-center mb-2"><svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg><span class="font-medium">YouTube Video</span></div><p class="text-sm">Original YouTube content from the source article</p></div>')
                  // Clean up any remaining broken widget patterns
                  .replace(/Twitter Widget Iframe/gi, '')
                  .replace(/TikTok Embed/gi, '')
                  .replace(/YouTube Widget/gi, '')
                  // Clean up extra p tags
                  .replace(/<p[^>]*><\/p>/g, '')
                  .replace(/(<\/p>)(\s*)(<p[^>]*>)/g, '$1$2$3')
              }}
            />
          </div>

          {/* Original Article Source (if available) */}
          {article.originalSource && (
            <>
              <Separator />
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  📰 Original Article Source
                </p>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full sm:w-auto"
                >
                  <a
                    href={article.originalSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Read on {getSourceDomain(article.originalSource)}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </>
          )}
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/tech-news/${related.slug}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    {related.image && (
                      <div className="relative overflow-hidden h-40 bg-muted">
                        <img
                          src={related.image}
                          alt={related.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
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
  );
}
