/**
 * Signal — the tech-news feed surfaced on the Home page: one top story plus
 * three secondary cards, backed by the live /api/tech-news pipeline via
 * useTechNews (same data source as the /tech-news route).
 */

import { Link } from 'react-router-dom';
import { useTechNews } from '../lib/hooks/useTechNews';
import { formatDate } from '../lib/utils/formatDate';
import { useI18n } from '../features/i18n';
import type { Article } from '../lib/types';

function articleMeta(article: Article): string {
  const parts = [formatDate(article.date).toUpperCase()];
  if (article.category) parts.push(article.category.toUpperCase());
  return parts.join(' · ');
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-[rgba(255,255,255,0.05)] ${className}`} />;
}

export function SignalSection() {
  const { t } = useI18n();
  const { currentArticles, loading } = useTechNews('all');

  const [topStory, ...rest] = currentArticles;
  const secondary = rest.slice(0, 3);

  return (
    <section
      id="signal"
      className="mt-[clamp(44px,7vh,80px)] scroll-mt-20 border-y border-hairline bg-surface"
    >
      <div className="mx-auto max-w-[1440px] px-[clamp(18px,4vw,52px)] py-[clamp(40px,6vh,68px)]">
        <div className="rv flex flex-wrap items-baseline justify-between gap-[18px] font-mono text-[11px] font-medium leading-none tracking-[0.14em] text-ink-42">
          <span className="text-signal">
            {t({
              en: 'NEWS — SCRAPED, THEN FILTERED BY ME',
              tr: 'HABERLER — TOPLANIR, BEN SÜZERİM',
            })}
          </span>
          <span>
            {t({ en: 'UPDATED TWICE DAILY · WEEKDAYS', tr: 'HAFTA İÇİ GÜNDE 2 KEZ GÜNCELLENİR' })}
          </span>
        </div>

        {loading && !topStory ? (
          <div className="mt-[26px] space-y-4">
            <SkeletonBlock className="h-24 w-full max-w-[720px]" />
            <div className="grid gap-px sm:grid-cols-3">
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
            </div>
          </div>
        ) : topStory ? (
          <>
            <Link
              to={`/tech-news/${topStory.slug}`}
              className="rv mt-[26px] grid items-end gap-[clamp(16px,3vw,40px)] border-b border-hairline pb-7 text-foreground hover:text-foreground md:grid-cols-2"
            >
              <div>
                <div className="font-mono text-[10.5px] leading-none tracking-[0.1em] text-signal">
                  {t({ en: 'TOP STORY', tr: 'GÜNÜN HABERİ' })} · {articleMeta(topStory)}
                </div>
                <h3 className="mb-0 mt-3.5 font-sans text-[clamp(24px,3vw,38px)] font-medium leading-[1.14] tracking-[-0.025em] [text-wrap:balance]">
                  {topStory.title}
                </h3>
              </div>
              <p className="m-0 font-sans text-[clamp(13px,1.1vw,15px)] leading-[1.65] text-ink-62 [text-wrap:pretty]">
                {topStory.description}
              </p>
            </Link>

            <div className="mt-px grid gap-px bg-surface sm:grid-cols-3">
              {secondary.map((article) => (
                <Link
                  key={article.id}
                  to={`/tech-news/${article.slug}`}
                  className="rv bg-surface p-6 text-foreground outline-1 outline-hairline hover:text-foreground"
                >
                  <div className="font-mono text-[10.5px] leading-none tracking-[0.1em] text-ink-42">
                    {articleMeta(article)}
                  </div>
                  <h4 className="mb-0 mt-3 font-sans text-lg font-medium leading-[1.35] text-ink-90">
                    {article.title}
                  </h4>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-[26px] font-sans text-[14px] text-ink-55">
            {t({
              en: 'The feed is warming up.',
              tr: 'Akış şu anda hazırlanıyor.',
            })}
          </p>
        )}

        <Link
          to="/tech-news"
          className="mt-[22px] inline-block border-b border-[rgba(255,74,28,0.5)] pb-1 font-mono text-[11px] font-medium leading-none tracking-[0.12em] text-signal hover:text-signal-hover"
        >
          {t({ en: 'ALL TECH NEWS →', tr: 'TÜM TEKNOLOJİ HABERLERİ →' })}
        </Link>
      </div>
    </section>
  );
}
