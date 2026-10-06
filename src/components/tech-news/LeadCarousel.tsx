/**
 * LEAD carousel for the Tech News index.
 *
 * Every featured slide is mounted and stacked in one grid cell, so a slide's
 * image and text are a single element that fades/slides as one unit. A step is
 * committed only after the target image has decoded (capped wait), so the text
 * never lands before its picture. The progress bar's animation drives autoplay,
 * which keeps pause/resume and the visual timer in exact sync.
 */

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../../lib/utils/imageProxy';
import { useI18n } from '../../features/i18n';
import type { Article } from '../../lib/types';

const MONO = 'font-mono text-[11px] font-medium tracking-[0.14em]';
const ROTATE_MS = 8000;
const SWIPE_THRESHOLD_PX = 48;
/** Upper bound on waiting for the next image; past this we move anyway. */
const IMAGE_WAIT_MS = 700;
const SLIDE_SHIFT_PX = 28;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

type Props = {
  articles: Article[];
  meta: (article: Article) => string;
  onArticleClick: () => void;
  prefetch: (slug: string) => void;
  reducedMotion: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');

export function LeadCarousel({ articles, meta, onArticleClick, prefetch, reducedMotion }: Props) {
  const { t } = useI18n();
  const count = articles.length;
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const paused = hovered || focused || dragging;

  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const pendingRef = useRef<number | null>(null);
  const swipeRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    locked: null as 'horizontal' | 'vertical' | null,
    swiped: false,
  });

  const goTo = useCallback(
    (target: number, dir: 1 | -1) => {
      if (count <= 1) return;
      const next = ((target % count) + count) % count;
      if (next === active && pendingRef.current == null) return;
      pendingRef.current = next;

      const commit = () => {
        if (pendingRef.current !== next) return; // superseded by a newer step
        pendingRef.current = null;
        setDirection(dir);
        setPrevious(active);
        setActive(next);
        prefetch(articles[next].slug);
      };

      const img = imgRefs.current[next];
      if (!img || reducedMotion) {
        commit();
        return;
      }
      // decode() waits for the network load too, so image and text arrive together.
      window.setTimeout(commit, IMAGE_WAIT_MS);
      img.decode().then(commit, commit);
    },
    [active, articles, count, prefetch, reducedMotion],
  );

  const step = useCallback((delta: 1 | -1) => goTo(active + delta, delta), [active, goTo]);

  // ── Touch swipe ─────────────────────────────────────────────────────────
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1 || e.pointerType === 'mouse') return;
    Object.assign(swipeRef.current, {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      locked: null,
      swiped: false,
    });
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (s.pointerId !== e.pointerId || s.locked) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    s.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
  };

  const endSwipe = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    if (s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startX;
    if (s.locked === 'horizontal' && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
      s.swiped = true;
      step(dx < 0 ? 1 : -1);
    }
    s.pointerId = null;
    s.locked = null;
    setDragging(false);
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!swipeRef.current.swiped) return;
    e.preventDefault();
    e.stopPropagation();
    swipeRef.current.swiped = false;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
  };

  // ── Slide styles ────────────────────────────────────────────────────────
  const slideStyle = (i: number): CSSProperties => {
    const isActive = i === active;
    let shift = 0;
    if (!isActive && !reducedMotion) {
      shift = i === previous ? -direction * SLIDE_SHIFT_PX : direction * SLIDE_SHIFT_PX;
    }
    return {
      gridArea: '1 / 1',
      opacity: isActive ? 1 : 0,
      transform: `translate3d(${shift}px, 0, 0)`,
      transition: reducedMotion
        ? 'opacity 160ms linear'
        : `opacity 520ms ${EASE}, transform 620ms ${EASE}`,
      zIndex: isActive ? 1 : 0,
      pointerEvents: isActive ? 'auto' : 'none',
      willChange: 'opacity, transform',
    };
  };

  const rail =
    count > 1 ? Array.from({ length: count - 1 }, (_, i) => articles[(active + 1 + i) % count]) : [];
  const current = articles[active];

  const arrowClass =
    'group/arrow grid h-11 w-11 shrink-0 cursor-pointer place-items-center border border-hairline-strong ' +
    'bg-background text-ink-70 transition-[color,background-color,border-color,transform] duration-200 ' +
    'hover:border-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground ' +
    'active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-signal disabled:cursor-default disabled:opacity-40';

  return (
    <section
      className="mt-10 border-b border-hairline pb-12"
      aria-roledescription="carousel"
      aria-label={t({ en: 'Featured stories', tr: 'Öne çıkan haberler' })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      {/* Controls row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className={`${MONO} flex items-baseline gap-3 text-ink-42`}>
          <span className="text-signal">{t({ en: 'LEAD', tr: 'MANŞET' })}</span>
          {count > 1 && (
            <span className="tabular-nums">
              <span className="text-foreground">{pad(active + 1)}</span>
              <span className="px-1.5">/</span>
              {pad(count)}
            </span>
          )}
        </p>
        <p className="sr-only" aria-live={paused ? 'polite' : 'off'} aria-atomic="true">
          {t({
            en: `Story ${active + 1} of ${count}: ${current.title}`,
            tr: `Haber ${active + 1} / ${count}: ${current.title}`,
          })}
        </p>
        {count > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className={arrowClass}
              aria-label={t({ en: 'Previous lead story', tr: 'Önceki manşet' })}
            >
              <ChevronLeft
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover/arrow:-translate-x-0.5"
              />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className={arrowClass}
              aria-label={t({ en: 'Next lead story', tr: 'Sonraki manşet' })}
            >
              <ChevronRight
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover/arrow:translate-x-0.5"
              />
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-8">
          {/* Stage: all slides stacked in one cell; height = tallest slide (no layout jump). */}
          <div
            className="grid touch-pan-y select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endSwipe}
            onPointerCancel={endSwipe}
            onClickCapture={onClickCapture}
          >
            {articles.map((article, i) => {
              const isActive = i === active;
              return (
                <Link
                  key={article.id}
                  to={`/tech-news/${article.slug}`}
                  className="group block text-foreground hover:text-foreground"
                  style={slideStyle(i)}
                  data-lead-active={isActive ? 'true' : undefined}
                  aria-hidden={isActive ? undefined : true}
                  tabIndex={isActive ? undefined : -1}
                  inert={!isActive}
                  draggable={false}
                  onClick={onArticleClick}
                  onMouseEnter={() => prefetch(article.slug)}
                  onFocus={() => prefetch(article.slug)}
                >
                  {article.image && (
                    <div className="relative mb-6 aspect-[16/9] overflow-hidden bg-surface">
                      <img
                        ref={(el) => {
                          imgRefs.current[i] = el;
                        }}
                        src={getOptimizedImageUrl(article.image, IMAGE_PRESETS.hero)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                        loading="eager"
                        decoding="async"
                        fetchPriority={i === 0 ? 'high' : 'low'}
                        draggable={false}
                        width={1200}
                        height={675}
                      />
                    </div>
                  )}
                  <p className={`${MONO} text-signal`}>{meta(article)}</p>
                  <h2 className="mt-3 font-sans text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="mt-4 max-w-[65ch] font-sans text-[15px] leading-[1.65] text-ink-62">
                      {article.description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Progress segments: show position + autoplay timer, and jump on click. */}
          {count > 1 && (
            <div className="mt-6 flex gap-1.5" role="group" aria-label={t({ en: 'Choose story', tr: 'Haber seç' })}>
              {articles.map((article, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => goTo(i, i >= active ? 1 : -1)}
                    className="group/seg flex h-6 flex-1 cursor-pointer items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                    aria-label={t({ en: `Story ${i + 1}: ${article.title}`, tr: `Haber ${i + 1}: ${article.title}` })}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="relative block h-[2px] w-full overflow-hidden bg-hairline-strong transition-colors group-hover/seg:bg-[rgba(255,255,255,0.4)]">
                      {isActive &&
                        (reducedMotion ? (
                          // No autoplay under reduced motion: a static marker only.
                          <span className="absolute inset-0 bg-signal" />
                        ) : (
                          <span
                            key={active}
                            className="lead-progress absolute inset-0 origin-left bg-signal"
                            style={{
                              animationDuration: `${ROTATE_MS}ms`,
                              animationPlayState: paused ? 'paused' : 'running',
                            }}
                            onAnimationEnd={() => step(1)}
                          />
                        ))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-px border-t border-hairline lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-8">
          <p className={`${MONO} mb-4 pt-6 text-ink-42 lg:pt-0`}>{t({ en: 'NEXT', tr: 'SONRAKİ' })}</p>
          {/* Re-keyed per slide so the rail fades in on the same beat as the lead. */}
          <div key={active} className="lead-rail-in flex flex-col">
            {rail.map((article) => (
              <Link
                key={article.id}
                to={`/tech-news/${article.slug}`}
                className="border-t border-hairline py-4 text-foreground transition-colors hover:text-foreground"
                onClick={onArticleClick}
                onMouseEnter={() => prefetch(article.slug)}
                onFocus={() => prefetch(article.slug)}
              >
                <p className={`${MONO} text-[10.5px] text-ink-42`}>{meta(article)}</p>
                <h3 className="mt-2 font-sans text-[17px] font-medium leading-[1.3] text-ink-90">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
