/**
 * Tech News index — LEAD/NEXT carousel (top-5 ranked) + hairline index rows.
 * Data layer: useTechNews + list-scroll restore (unchanged).
 */

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Link } from 'react-router-dom';
import { usePageContext } from '../lib/context/PageContext';
import ErrorBoundary from './ErrorBoundary';
import { SEO } from './SEO';
import { formatDate } from '../lib/utils/formatDate';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../lib/utils/imageProxy';
import { prefetchArticle } from '../lib/hooks/useArticle';
import { useTechNews } from '../lib/hooks/useTechNews';
import {
  clearTechNewsRestoreNavFlag,
  isTechNewsRestoreNavActive,
  readTechNewsListScroll,
  writeTechNewsListScroll,
} from '../lib/techNewsListRestore';
import type { Article } from '../lib/types';
import { useI18n, type Tr } from '../features/i18n';

const AVAILABLE_CATEGORIES: { label: Tr; value: string }[] = [
  { label: { en: 'All', tr: 'Tümü' }, value: 'all' },
  { label: { en: 'AI Applications', tr: 'AI Uygulamaları' }, value: 'AI Applications' },
  { label: { en: 'AI', tr: 'AI' }, value: 'AI' },
  { label: { en: 'Tech', tr: 'Teknoloji' }, value: 'Tech' },
  { label: { en: 'Science', tr: 'Bilim' }, value: 'Science' },
  { label: { en: 'Sustainability', tr: 'Sürdürülebilirlik' }, value: 'Sustainability' },
  { label: { en: 'News', tr: 'Haber' }, value: 'News' },
];

const PAGE =
  'mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)] pb-[clamp(64px,10vh,120px)]';
const MONO = 'font-mono text-[11px] font-medium tracking-[0.14em]';
const FEATURED_COUNT = 5;
const ROTATE_MS = 8000;

function articleMeta(article: Article): string {
  const parts = [formatDate(article.date).toUpperCase()];
  if (article.category) parts.push(article.category.toUpperCase());
  return parts.join(' · ');
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-[rgba(255,255,255,0.05)] ${className}`} />;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function TechNews() {
  const { t, lang } = useI18n();
  const upper = (value: string) => value.toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (!isTechNewsRestoreNavActive()) return 'all';
    return readTechNewsListScroll()?.category ?? 'all';
  });
  const { setPageInfo } = usePageContext();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [leadIndex, setLeadIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const restorationTargetPage = useMemo(() => {
    if (!isTechNewsRestoreNavActive()) return null;
    const saved = readTechNewsListScroll();
    if (!saved || saved.page < 2) return null;
    return saved.page;
  }, []);

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
  } = useTechNews(selectedCategory, restorationTargetPage);

  const categoryRef = useRef(selectedCategory);
  const pageRef = useRef(currentPage);
  useEffect(() => {
    categoryRef.current = selectedCategory;
    pageRef.current = currentPage;
  }, [selectedCategory, currentPage]);

  const persistListScroll = useCallback(() => {
    writeTechNewsListScroll({
      scrollY: window.scrollY,
      category: categoryRef.current,
      page: pageRef.current,
    });
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        persistListScroll();
      }, 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [persistListScroll]);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loading || loadingMore) return;
        if (currentPage >= totalPages) return;
        handleLoadMore();
      },
      { root: null, rootMargin: '320px 0px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [currentPage, totalPages, loading, loadingMore, handleLoadMore]);

  const scrollRestoreDoneRef = useRef(false);
  useLayoutEffect(() => {
    if (scrollRestoreDoneRef.current) return;
    if (!isTechNewsRestoreNavActive()) return;
    if (loading || loadingMore) return;
    if (
      restorationTargetPage != null &&
      restorationTargetPage > 1 &&
      currentPage < restorationTargetPage
    ) {
      return;
    }

    const saved = readTechNewsListScroll();
    if (!saved || saved.category !== selectedCategory) {
      clearTechNewsRestoreNavFlag();
      scrollRestoreDoneRef.current = true;
      return;
    }

    requestAnimationFrame(() => {
      if (scrollRestoreDoneRef.current) return;
      scrollRestoreDoneRef.current = true;
      window.scrollTo({ top: saved.scrollY, left: 0, behavior: 'auto' });
      clearTechNewsRestoreNavFlag();
    });
  }, [
    loading,
    loadingMore,
    currentPage,
    restorationTargetPage,
    selectedCategory,
    newsData?.articles.length,
  ]);

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

  // Reset carousel when category / article set changes
  useEffect(() => {
    setLeadIndex(0);
  }, [selectedCategory, currentArticles[0]?.id]);

  const featured = currentArticles.slice(0, FEATURED_COUNT);
  const featuredLen = featured.length;
  const safeLeadIndex = featuredLen > 0 ? leadIndex % featuredLen : 0;
  const lead = featured[safeLeadIndex] ?? null;
  const rail = featuredLen > 1
    ? Array.from({ length: featuredLen - 1 }, (_, i) => featured[(safeLeadIndex + 1 + i) % featuredLen])
    : [];
  const indexRows = currentArticles.slice(FEATURED_COUNT);

  const stepLead = useCallback(
    (delta: number) => {
      if (featuredLen <= 1) return;
      setLeadIndex((prev) => (prev + delta + featuredLen) % featuredLen);
    },
    [featuredLen],
  );

  useEffect(() => {
    if (prefersReducedMotion || carouselPaused || featuredLen <= 1) return;
    const id = window.setInterval(() => {
      setLeadIndex((prev) => (prev + 1) % featuredLen);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, carouselPaused, featuredLen]);

  const prefetch = useCallback((slug: string) => {
    void import('./TechNewsDetail').catch(() => undefined);
    prefetchArticle(slug);
  }, []);

  const featuredPrefetchKey = featured.map((a) => a.slug).join('|');

  // Prefetch active LEAD + NEXT slugs
  useEffect(() => {
    if (!featuredPrefetchKey) return;
    for (const slug of featuredPrefetchKey.split('|')) {
      if (slug) prefetch(slug);
    }
  }, [featuredPrefetchKey, prefetch]);

  return (
    <>
      <SEO
        title="Tech News | Cem Koyluoglu"
        description="Latest technology news, translated and summarized by AI. Stay up to date with AI, tech, startups, and software engineering news."
        ogTitle="Tech News | Cem Koyluoglu"
        ogDescription="Latest technology news, translated and summarized by AI."
      />
      <main
        className="min-h-screen bg-background pb-24"
        style={{ paddingTop: 'calc(var(--nav-height, 64px) + 40px)' }}
      >
        <div className={PAGE}>
          <header className="border-b border-hairline pb-8">
            <p className={`${MONO} text-signal`}>
              {t({ en: 'TECH NEWS · INDEX', tr: 'TEKNOLOJİ HABERLERİ · DİZİN' })}
            </p>
            <h1 className="mt-3 font-sans text-[clamp(32px,5vw,52px)] font-bold leading-[0.96] tracking-[-0.04em]">
              {t({ en: 'Tech News', tr: 'Teknoloji Haberleri' })}
            </h1>
            <p className="mt-4 max-w-[65ch] font-sans text-[15px] leading-[1.65] text-ink-70">
              {t({
                en: 'Scraped, translated, and filtered — AI, science, and systems news without the noise.',
                tr: 'Toplanır, çevrilir, süzülür — gürültüsüz AI, bilim ve sistem haberleri.',
              })}
            </p>
          </header>

          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline py-5">
            <div
              className="flex flex-wrap gap-x-4 gap-y-2"
              role="toolbar"
              aria-label={t({ en: 'Filter by category', tr: 'Kategoriye göre filtrele' })}
            >
              {AVAILABLE_CATEGORIES.map((c) => {
                const active = selectedCategory === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      if (selectedCategory !== c.value) setSelectedCategory(c.value);
                    }}
                    className={`${MONO} cursor-pointer border-b pb-1 transition-colors ${
                      active
                        ? 'border-signal text-signal'
                        : 'border-transparent text-ink-42 hover:text-foreground'
                    }`}
                    aria-pressed={active}
                  >
                    {upper(t(c.label))}
                  </button>
                );
              })}
            </div>
            <p className={`${MONO} text-ink-42`}>
              {loading && !lead
                ? t({ en: 'LOADING…', tr: 'YÜKLENİYOR…' })
                : t({
                    en: `${currentArticles.length} / ${totalArticles} SHOWN`,
                    tr: `${currentArticles.length} / ${totalArticles} GÖSTERİLİYOR`,
                  })}
            </p>
          </div>

          {error && !loading && (
            <div className="py-16">
              <h2 className="font-sans text-2xl font-bold">
                {t({ en: 'Failed to load', tr: 'Yüklenemedi' })}
              </h2>
              <p className="mt-2 text-ink-55">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-6 border border-hairline-strong bg-signal px-5 py-3 font-mono text-[11px] tracking-[0.14em] text-background hover:bg-signal-hover"
              >
                {t({ en: 'TRY AGAIN', tr: 'TEKRAR DENE' })}
              </button>
            </div>
          )}

          {loading && !lead && (
            <div className="mt-10 space-y-6">
              <SkeletonBlock className="aspect-[16/9] w-full max-w-3xl" />
              <SkeletonBlock className="h-10 w-2/3 max-w-xl" />
              <div className="grid gap-4 lg:grid-cols-12">
                <SkeletonBlock className="h-40 lg:col-span-8" />
                <div className="space-y-3 lg:col-span-4">
                  <SkeletonBlock className="h-16" />
                  <SkeletonBlock className="h-16" />
                  <SkeletonBlock className="h-16" />
                </div>
              </div>
            </div>
          )}

          {!loading && !error && newsData && currentArticles.length === 0 && (
            <p className="py-16 font-sans text-[15px] text-ink-55">
              {t({
                en: 'No articles in this filter yet.',
                tr: 'Bu filtrede henüz haber yok.',
              })}
            </p>
          )}

          {!error && lead && (
            <>
              <div
                className="mt-10 border-b border-hairline pb-12"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
                onFocusCapture={() => setCarouselPaused(true)}
                onBlurCapture={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setCarouselPaused(false);
                  }
                }}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <p className={`${MONO} text-ink-42`} aria-live="polite">
                    {t({ en: 'LEAD', tr: 'MANŞET' })}{' '}
                    {featuredLen > 1
                      ? `${safeLeadIndex + 1} / ${featuredLen}`
                      : ''}
                    {lead ? ` · ${lead.title}` : ''}
                  </p>
                  {featuredLen > 1 && (
                    <div className="flex items-center gap-4" role="group" aria-label={t({ en: 'Featured stories', tr: 'Öne çıkan haberler' })}>
                      <button
                        type="button"
                        onClick={() => stepLead(-1)}
                        className={`${MONO} text-ink-42 transition-colors hover:text-foreground`}
                        aria-label={t({ en: 'Previous lead story', tr: 'Önceki manşet' })}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => stepLead(1)}
                        className={`${MONO} text-ink-42 transition-colors hover:text-foreground`}
                        aria-label={t({ en: 'Next lead story', tr: 'Sonraki manşet' })}
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                  <Link
                    to={`/tech-news/${lead.slug}`}
                    className="group block text-foreground hover:text-foreground lg:col-span-8"
                    onClick={persistListScroll}
                    onMouseEnter={() => prefetch(lead.slug)}
                    onFocus={() => prefetch(lead.slug)}
                  >
                    {lead.image && (
                      <div className="relative mb-6 aspect-[16/9] overflow-hidden bg-surface">
                        <img
                          src={getOptimizedImageUrl(lead.image, IMAGE_PRESETS.hero)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-90"
                          loading="eager"
                          fetchPriority="high"
                          width={1200}
                          height={675}
                        />
                      </div>
                    )}
                    <p className={`${MONO} text-signal`}>
                      {t({ en: 'LEAD', tr: 'MANŞET' })} · {articleMeta(lead)}
                    </p>
                    <h2 className="mt-3 font-sans text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
                      {lead.title}
                    </h2>
                    {lead.description && (
                      <p className="mt-4 max-w-[65ch] font-sans text-[15px] leading-[1.65] text-ink-62">
                        {lead.description}
                      </p>
                    )}
                  </Link>

                  <aside className="flex flex-col gap-px border-t border-hairline lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-8">
                    <p className={`${MONO} mb-4 pt-6 text-ink-42 lg:pt-0`}>
                      {t({ en: 'NEXT', tr: 'SONRAKİ' })}
                    </p>
                    {rail.map((article) => (
                      <Link
                        key={article.id}
                        to={`/tech-news/${article.slug}`}
                        className="border-t border-hairline py-4 text-foreground hover:text-foreground"
                        onClick={persistListScroll}
                        onMouseEnter={() => prefetch(article.slug)}
                        onFocus={() => prefetch(article.slug)}
                      >
                        <p className={`${MONO} text-[10.5px] text-ink-42`}>{articleMeta(article)}</p>
                        <h3 className="mt-2 font-sans text-[17px] font-medium leading-[1.3] text-ink-90">
                          {article.title}
                        </h3>
                      </Link>
                    ))}
                  </aside>
                </div>
              </div>

              {indexRows.length > 0 && (
                <ul className="mt-2 list-none p-0">
                  {indexRows.map((article) => (
                    <li key={article.id} className="border-b border-hairline">
                      <Link
                        to={`/tech-news/${article.slug}`}
                        className="flex flex-wrap items-baseline justify-between gap-3 py-5 text-foreground hover:text-foreground"
                        onClick={persistListScroll}
                        onMouseEnter={() => prefetch(article.slug)}
                        onFocus={() => prefetch(article.slug)}
                      >
                        <h3 className="max-w-[65ch] font-sans text-[18px] font-medium leading-[1.35] tracking-[-0.02em]">
                          {article.title}
                        </h3>
                        <span className={`${MONO} shrink-0 text-[10.5px] text-ink-42`}>
                          {articleMeta(article)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {currentPage < totalPages && (
                <div ref={loadMoreSentinelRef} className="mt-8 h-8 w-full" aria-hidden="true" />
              )}
              {loadingMore && (
                <p className="sr-only" role="status">
                  {t({ en: 'Loading more articles', tr: 'Daha fazla haber yükleniyor' })}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function TechNewsWithErrorBoundary() {
  const { t } = useI18n();
  return (
    <ErrorBoundary title={t({ en: 'Failed to load Tech News', tr: 'Teknoloji haberleri yüklenemedi' })}>
      <TechNews />
    </ErrorBoundary>
  );
}

export default TechNewsWithErrorBoundary;
