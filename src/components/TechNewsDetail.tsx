/**
 * Tech News article — editorial 8/4 grid, ~68ch body measure + sticky related rail.
 */

import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEFAULT_OG_IMAGE_URL } from '../lib/constants/urls';
import { usePageContext } from '../lib/context/PageContext';
import SmartMarkdown from './markdown/SmartMarkdown';
import './markdown/tech-news-article.css';
import { SEO } from './SEO';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../lib/utils/imageProxy';
import ErrorBoundary from './ErrorBoundary';
import { formatDate } from '../lib/utils/formatDate';
import {
  getSourceDomain,
  estimateReadTime,
  sanitizeArticleContent,
} from '../lib/utils/articleHelpers';
import { useArticle } from '../lib/hooks/useArticle';
import { useI18n } from '../features/i18n';

const PAGE =
  'mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)] pb-[clamp(64px,10vh,120px)]';
const MONO = 'font-mono text-[11px] font-medium tracking-[0.14em]';

function TechNewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { article, relatedArticles, loading, error } = useArticle(slug);
  const { setPageInfo } = usePageContext();
  const { t } = useI18n();

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
        toast.success(t({ en: 'Link copied to clipboard!', tr: 'Bağlantı panoya kopyalandı!' }));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error(t({ en: 'Failed to share', tr: 'Paylaşılamadı' }));
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
    if (!article) return;

    const preview =
      article.description ||
      sanitizeArticleContent(article.content || '')
        .split('\n')
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');

    const articleContent = sanitizeArticleContent(article.content || '').slice(0, 4000);

    setPageInfo({
      path: `/tech-news/${article.slug}`,
      title: article.title,
      summary: preview || 'Full article content from the selected tech news story.',
      content: articleContent || undefined,
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
        className="min-h-screen bg-background"
        style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
      >
        <div className={PAGE}>
          <div className="h-4 w-24 animate-pulse bg-[rgba(255,255,255,0.05)]" />
          <div className="mt-8 h-12 w-3/4 max-w-xl animate-pulse bg-[rgba(255,255,255,0.05)]" />
          <div className="mt-8 aspect-video w-full max-w-[720px] animate-pulse bg-[rgba(255,255,255,0.05)]" />
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main
        className="min-h-screen bg-background"
        style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
      >
        <div className={PAGE}>
          <h1 className="font-sans text-3xl font-bold">
            {t({ en: 'Article not found', tr: 'Haber bulunamadı' })}
          </h1>
          <p className="mt-3 text-ink-55">
            {error ||
              t({
                en: 'The article you are looking for does not exist.',
                tr: 'Aradığınız haber mevcut değil.',
              })}
          </p>
          <button
            type="button"
            onClick={() => navigate('/tech-news')}
            className={`mt-8 ${MONO} text-signal hover:text-signal-hover`}
          >
            {t({ en: '← BACK TO INDEX', tr: '← DİZİNE DÖN' })}
          </button>
        </div>
      </main>
    );
  }

  const sanitizedContent = sanitizeArticleContent(article.content);
  const estimatedMinutes = estimateReadTime(sanitizedContent);

  return (
    <>
      <SEO
        title={`${article.title} | Tech News`}
        description={article.description}
        ogTitle={article.title}
        ogDescription={article.description}
        ogImage={article.image || DEFAULT_OG_IMAGE_URL}
      />

      <main
        className="min-h-screen bg-background"
        style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
      >
        <div className={PAGE}>
          <Link
            to="/tech-news"
            className={`${MONO} text-ink-42 transition-colors hover:text-foreground`}
          >
            {t({ en: '← TECH NEWS', tr: '← TEKNOLOJİ HABERLERİ' })}
          </Link>

          <article className="mt-8">
            <header className="border-b border-hairline pb-8">
              <p className={`${MONO} text-signal`}>
                {(article.category || t({ en: 'Tech News', tr: 'Teknoloji' })).toUpperCase()} ·{' '}
                {formatDate(article.date).toUpperCase()} · {estimatedMinutes}{' '}
                {t({ en: 'MIN', tr: 'DK' })}
              </p>
              <h1 className="mt-4 max-w-[20ch] font-sans text-[clamp(28px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] sm:max-w-[28ch]">
                {article.title}
              </h1>
              {article.description && (
                <p className="mt-5 max-w-[68ch] font-sans text-[16px] leading-[1.65] text-ink-62">
                  {article.description}
                </p>
              )}
              <button
                type="button"
                onClick={handleShare}
                className={`mt-6 ${MONO} text-ink-42 hover:text-foreground`}
              >
                {t({ en: 'SHARE', tr: 'PAYLAŞ' })}
              </button>
            </header>

            {article.image && (
              <div className="relative mt-10 aspect-video w-full max-w-[720px] overflow-hidden bg-surface">
                <img
                  src={getOptimizedImageUrl(article.image, IMAGE_PRESETS.hero)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  width={1200}
                  height={675}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied !== 'true' && article.image) {
                      img.dataset.fallbackApplied = 'true';
                      img.src = article.image;
                      return;
                    }
                    img.parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/*
              Two explicit tracks, not 12 columns. With `col-span-8` the body
              track was 865px holding a 578px (68ch) measure — 287px of dead
              space *inside* the column, so the copy hugged the left edge with a
              void before the rail. Sizing the first track to just clear the
              measure pushes that slack into the gap between body and rail,
              where it reads as breathing room instead of a hole.

              600px, not 68ch: `ch` on this container resolves against its 16px
              font while the body sets 68ch in its own 17px font (= 578px), so a
              `68ch` track silently clamped the body to 544px. The track now
              stays just clear of 578px, leaving the body's own max-width as the
              single source of truth for the measure.
            */}
            <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,600px)_minmax(0,340px)] lg:justify-between">
              <div className="min-w-0">
                {/*
                  `prose prose-invert` used to sit here but @tailwindcss/typography
                  was never installed — dead classes. All body typography lives in
                  tech-news-article.css.
                */}
                <div className="tech-news-article-body">
                  <SmartMarkdown content={sanitizedContent} />
                </div>

                {article.originalSource && (
                  <p className="mt-12 max-w-[68ch] border-t border-hairline pt-6 font-mono text-[11px] tracking-[0.1em] text-ink-42">
                    {t({ en: 'SOURCE', tr: 'KAYNAK' })} ·{' '}
                    <a
                      href={article.originalSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-signal hover:text-signal-hover"
                    >
                      {getSourceDomain(article.originalSource)} ↗
                    </a>
                  </p>
                )}
              </div>

              {relatedArticles.length > 0 && (
                <aside aria-label={t({ en: 'Related articles', tr: 'İlgili haberler' })}>
                  <div className="lg:sticky lg:top-[calc(var(--nav-height,64px)+24px)]">
                    <p className={`${MONO} mb-4 text-ink-42`}>
                      {t({ en: 'RELATED', tr: 'İLGİLİ' })}
                    </p>
                    <ul className="list-none border-t border-hairline p-0">
                      {relatedArticles.map((related) => (
                        <li key={related.id} className="border-b border-hairline">
                          <Link
                            to={`/tech-news/${related.slug}`}
                            className="block py-4 text-foreground hover:text-foreground"
                          >
                            <p className={`${MONO} text-[10.5px] text-ink-42`}>
                              {formatDate(related.date).toUpperCase()}
                              {related.category ? ` · ${related.category.toUpperCase()}` : ''}
                            </p>
                            <h2 className="mt-2 font-sans text-[17px] font-medium leading-[1.3] text-ink-90">
                              {related.title}
                            </h2>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              )}
            </div>
          </article>
        </div>
      </main>
    </>
  );
}

function TechNewsDetailWithErrorBoundary() {
  const { t } = useI18n();
  return (
    <ErrorBoundary title={t({ en: 'Failed to load article', tr: 'Haber yüklenemedi' })}>
      <TechNewsDetail />
    </ErrorBoundary>
  );
}

export default TechNewsDetailWithErrorBoundary;
