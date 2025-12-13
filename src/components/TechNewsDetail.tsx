import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, ExternalLink, Clock, Share2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { usePageContext } from '../lib/context/PageContext';
import SmartMarkdown from './markdown/SmartMarkdown';
import { supabase } from '../../lib/supabase.js';
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
  // Minimal cleanup only - embeds are now handled via [[EMBED:...]] tokens
  // ============================================
  
  // 1. Remove ANY remaining markdown images (backend already handles this)
  sanitized = sanitized.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // 2. Remove Nuvemmag logo and branding
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

  // 3. Clean up any remaining broken widget text (legacy content only)
  sanitized = sanitized
    .replace(/>\s*TikTok Embed\s*/gi, '')
    .replace(/>\s*Twitter Widget Iframe\s*/gi, '')
    .replace(/>\s*YouTube Widget\s*/gi, '')
    .replace(/>\s*Watch more exciting videos on TikTok[\\]*\s*/gi, '')
    .replace(/>\s*\[[\d.MK]+\]\([^)]+\)/gi, '') // Remove view count links
    .replace(/>\s*Watch now\s*/gi, '')
    .replace(/>\s*\\?\s*/gi, '')
    .replace(/>\s*$/gm, '');

  // 4. Clean up excessive whitespace
  sanitized = sanitized.replace(/(\r?\n){3,}/g, '\n\n');
  sanitized = sanitized.replace(/[ \t]+$/gm, '');

  return sanitized.trim();
}

function TechNewsDetail() {
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
      
      // Use direct Supabase query (works in both dev and production)
      const { data: articleData, error: articleError } = await supabase
        .from('tech_news_articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (articleError || !articleData) {
        throw new Error('Article not found');
      }

      // Format article to match interface
      const formattedArticle: Article = {
        id: articleData.id,
        title: articleData.title,
        description: articleData.description,
        content: articleData.content,
        originalTitle: articleData.original_title,
        image: articleData.image_url,
        date: articleData.date,
        category: articleData.category,
        sourceUrl: articleData.source_url,
        originalSource: articleData.original_source,
        slug: articleData.slug,
        createdAt: articleData.created_at,
      };

      setArticle(formattedArticle);

      // Increment view count
      await supabase.rpc('increment_article_views', { article_id: articleData.id });
      
      // Fetch related articles (3 recent articles from same category if available)
      const category = formattedArticle.category;
      const { data: relatedData } = await supabase
        .from('tech_news_articles')
        .select('*')
        .eq('category', category || 'AI')
        .neq('id', articleData.id)
        .order('date', { ascending: false })
        .limit(3);

      if (relatedData) {
        const formattedRelated = relatedData.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          content: a.content,
          originalTitle: a.original_title,
          image: a.image_url,
          date: a.date,
          category: a.category,
          sourceUrl: a.source_url,
          originalSource: a.original_source,
          slug: a.slug,
          createdAt: a.created_at,
        }));
        setRelatedArticles(formattedRelated);
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
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)', fontFamily: "'Satoshi', sans-serif" }}
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
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)', fontFamily: "'Satoshi', sans-serif" }}
      >
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700 }}>Article Not Found</h1>
          <p className="text-muted-foreground mb-8" style={{ fontFamily: "'Satoshi', sans-serif" }}>
            {error || 'The article you are looking for does not exist.'}
          </p>
          <Button onClick={() => navigate('/tech-news')} variant="default" style={{ fontFamily: "'Satoshi', sans-serif" }}>
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
        ogImage={article.image || 'https://cemkoyluoglu.codes/og-image.png'}
      />
      
      <main
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 120px) + 56px)', fontFamily: "'Satoshi', sans-serif" }}
      >
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          asChild
          className="mb-8 hover:bg-primary/10"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
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

            <h1 className="text-4xl md:text-5xl font-bold leading-tight font-[Hobo_BT]" style={{ fontWeight: 700 }}>
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground" style={{ fontFamily: "'Satoshi', sans-serif" }}>
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
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {article.description && (
              <p className="text-xl text-muted-foreground leading-relaxed" style={{ fontFamily: "'Satoshi', sans-serif", textAlign: 'justify' }}>
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
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          )}

          <Separator />

          {/* Article Content - Using SmartMarkdown for safe rendering with auto-embeds */}
          <div className="prose prose-lg dark:prose-invert max-w-none" style={{ fontFamily: "'Satoshi', sans-serif" }}>
            <SmartMarkdown content={sanitizedContent} />
          </div>

          {/* Original Article Source (if available) */}
          {article.originalSource && (
            <>
              <Separator />
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/10" style={{ fontFamily: "'Satoshi', sans-serif" }}>
                <p className="text-sm font-medium text-muted-foreground mb-3" style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 500 }}>
                  📰 Original Article Source
                </p>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full sm:w-auto"
                  style={{ fontFamily: "'Satoshi', sans-serif" }}
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
            <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700 }}>Related Articles</h2>
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
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors font-[Hobo_BT] text-sm md:text-base" style={{ fontWeight: 600 }}>
                        {related.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-2" style={{ fontFamily: "'Satoshi', sans-serif" }}>
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

export default TechNewsDetail;
