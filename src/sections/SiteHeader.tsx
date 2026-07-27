/**
 * Editorial site header — sticky mono nav + scroll progress bar.
 * Three-zone grid (brand | links | utilities) with text-slide + L→R underline hover.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS, type NavItem } from '../lib/constants/navigation';
import { useAvailability } from '../lib/hooks/useAvailability';
import type { AvailabilityStatus } from '../lib/utils/availability';
import { useI18n, type Tr } from '../features/i18n';

const LABEL = 'font-mono text-[11px] font-medium leading-none tracking-[0.14em]';

const HOVER_EASE =
  'duration-[600ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none';

const STATUS_LABEL: Record<AvailabilityStatus, Tr> = {
  available: { en: 'AVAILABLE', tr: 'MÜSAİT' },
  offline: { en: 'OFFLINE', tr: 'ÇEVRİMDIŞI' },
  holiday: { en: 'HOLIDAY', tr: 'TATİL' },
};

const BRAND = 'CEM KÖYLÜOĞLU';

/** 2px accent bar pinned to the viewport top, driven by scroll position. */
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let queued = false;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        if (barRef.current) barRef.current.style.width = `${pct}%`;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-[2px] w-0 bg-signal"
    />
  );
}

function NavUnderline({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'absolute bottom-0 left-0 h-px w-full bg-current transition-transform',
        HOVER_EASE,
        active
          ? 'origin-left scale-x-100'
          : 'origin-right scale-x-0 group-hover:origin-left group-hover:scale-x-100',
      ].join(' ')}
    />
  );
}

/** Duplicated label for vertical slide; clipped by the link’s overflow-hidden. */
function NavLinkFace({ label, active }: { label: string; active?: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`flex flex-col transition-transform ${HOVER_EASE} group-hover:-translate-y-1/2 motion-reduce:group-hover:translate-y-0`}
      >
        <span>{label}</span>
        <span>{label}</span>
      </span>
      <NavUnderline active={active} />
    </>
  );
}

function hoverLinkClass(colour: string) {
  return [
    'group relative inline-flex h-[1.4em] flex-col overflow-hidden',
    'whitespace-nowrap leading-[1.4] transition-colors',
    HOVER_EASE,
    colour,
  ].join(' ');
}

function HeaderNavLink({
  item,
  label,
  isHome,
  pathname,
}: {
  item: NavItem;
  label: string;
  isHome: boolean;
  pathname: string;
}) {
  const active =
    !item.isHash &&
    (pathname === item.href || pathname.startsWith(`${item.href}/`));

  const colour = item.accent
    ? 'text-signal group-hover:text-signal-hover'
    : 'text-ink-55 group-hover:text-foreground';

  const className = hoverLinkClass(colour);
  const children: ReactNode = <NavLinkFace label={label} active={active} />;

  if (!item.isHash) {
    return (
      <Link to={item.href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  if (isHome) {
    return (
      <a href={item.href} className={className} aria-label={label}>
        {children}
      </a>
    );
  }

  return (
    <Link to={`/${item.href}`} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

function BrandLink({ isHome }: { isHome: boolean }) {
  const className = hoverLinkClass('text-foreground');
  const face = <NavLinkFace label={BRAND} />;

  if (isHome) {
    return (
      <a href="#top" className={className} aria-label={BRAND}>
        {face}
      </a>
    );
  }

  return (
    <Link to="/" className={className} aria-label={BRAND}>
      {face}
    </Link>
  );
}

export function SiteHeader() {
  const { lang, t, toggle } = useI18n();
  const availability = useAvailability();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const headerRef = useRef<HTMLElement>(null);

  // Legacy pages size sticky offsets from --nav-height; keep it accurate.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty('--nav-height', `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <ScrollProgress />
      {/*
        Full-bleed sticky bar; content capped at max-w-[1440px] to match page
        sections. Semantic <nav> uses a three-zone grid: brand | links | utilities.
      */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-hairline bg-[rgba(10,10,11,0.82)] backdrop-blur-[14px]"
      >
        <nav
          aria-label="Main navigation"
          className={`${LABEL} mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-[clamp(18px,4vw,52px)] py-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`}
        >
          {/* Zone 1 — brand */}
          <div className="flex min-w-0 items-center">
            <BrandLink isHome={isHome} />
          </div>

          {/* Zone 2 — primary links (center on md+) */}
          <div className="col-span-2 flex flex-wrap items-center justify-start gap-x-[clamp(14px,2vw,26px)] gap-y-2 md:col-span-1 md:justify-center">
            {NAV_ITEMS.map((item) => (
              <HeaderNavLink
                key={item.href}
                item={item}
                label={t(item.label)}
                isHome={isHome}
                pathname={location.pathname}
              />
            ))}
          </div>

          {/* Zone 3 — availability + language */}
          <div className="col-start-2 row-start-1 flex items-center justify-end gap-3.5 md:col-start-auto md:row-start-auto">
            <span
              className={`flex items-center gap-[7px] ${
                availability === 'available'
                  ? 'text-ink-55'
                  : availability === 'holiday'
                    ? 'text-ink-45'
                    : 'text-ink-38'
              }`}
              title={
                availability === 'available'
                  ? t({ en: 'Online · 09:00–21:00 Dublin', tr: 'Çevrimiçi · 09:00–21:00 Dublin' })
                  : availability === 'holiday'
                    ? t({ en: 'Away · 25 Aug–13 Sep', tr: 'İzin · 25 Ağu–13 Eyl' })
                    : t({
                        en: 'Offline · back 09:00 Dublin',
                        tr: "Çevrimdışı · 09:00 Dublin'de açılır",
                      })
              }
            >
              <span
                aria-hidden="true"
                className={
                  availability === 'available'
                    ? 'anim-pulse h-1.5 w-1.5 rounded-full bg-live'
                    : availability === 'holiday'
                      ? 'h-1.5 w-1.5 rounded-full bg-signal opacity-70'
                      : 'h-1.5 w-1.5 rounded-full bg-ink-38'
                }
              />
              <span>{t(STATUS_LABEL[availability])}</span>
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={lang === 'en' ? 'Türkçeye geç' : 'Switch to English'}
              className={`${LABEL} cursor-pointer border border-hairline-strong bg-transparent px-[11px] py-2 text-foreground hover:border-[rgba(255,255,255,0.35)]`}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
