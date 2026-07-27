/**
 * Editorial site header — sticky mono nav + scroll progress bar.
 * Three-zone grid (brand | links | utilities) with text-slide + L→R underline hover.
 * Below `md`, links collapse into a Menu/Close sliding toggle + overlay panel.
 */

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, type NavItem } from '../lib/constants/navigation';
import { useAvailability } from '../lib/hooks/useAvailability';
import type { AvailabilityStatus } from '../lib/utils/availability';
import { useI18n, type Tr } from '../features/i18n';

const LABEL = 'font-mono text-[11px] font-medium leading-none tracking-[0.14em]';

const HOVER_EASE =
  'duration-[600ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none';

const MENU_EASE =
  'duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none';

const STATUS_LABEL: Record<AvailabilityStatus, Tr> = {
  available: { en: 'AVAILABLE', tr: 'MÜSAİT' },
  offline: { en: 'OFFLINE', tr: 'ÇEVRİMDIŞI' },
  holiday: { en: 'HOLIDAY', tr: 'TATİL' },
};

const MENU_LABEL: Tr = { en: 'Menu', tr: 'Menü' };
const CLOSE_LABEL: Tr = { en: 'Close', tr: 'Kapat' };

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
  onNavigate,
  className: classNameProp,
}: {
  item: NavItem;
  label: string;
  isHome: boolean;
  pathname: string;
  onNavigate?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  const active =
    !item.isHash &&
    (pathname === item.href || pathname.startsWith(`${item.href}/`));

  const colour = item.accent
    ? 'text-signal group-hover:text-signal-hover'
    : 'text-ink-55 group-hover:text-foreground';

  const className = classNameProp ?? hoverLinkClass(colour);
  const children: ReactNode = classNameProp ? (
    label
  ) : (
    <NavLinkFace label={label} active={active} />
  );

  if (!item.isHash) {
    return (
      <Link
        to={item.href}
        className={className}
        aria-label={label}
        onClick={onNavigate}
      >
        {children}
      </Link>
    );
  }

  if (isHome) {
    return (
      <a
        href={item.href}
        className={className}
        aria-label={label}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={`/${item.href}`}
      className={className}
      aria-label={label}
      onClick={onNavigate}
    >
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

/** Menu ↔ Close vertical slide; clipped by the button’s overflow-hidden. */
function MenuToggle({
  open,
  onToggle,
  menuLabel,
  closeLabel,
}: {
  open: boolean;
  onToggle: () => void;
  menuLabel: string;
  closeLabel: string;
}) {
  return (
    <button
      type="button"
      data-menu-toggle
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-nav"
      aria-label={open ? closeLabel : menuLabel}
      className={`${LABEL} h-5 cursor-pointer overflow-hidden text-foreground`}
    >
      <span
        aria-hidden="true"
        className={[
          'flex flex-col transition-transform',
          MENU_EASE,
          open ? '-translate-y-1/2' : 'translate-y-0',
        ].join(' ')}
      >
        <span className="flex h-5 items-center leading-5">{menuLabel}</span>
        <span className="flex h-5 items-center leading-5">{closeLabel}</span>
      </span>
    </button>
  );
}

export function SiteHeader() {
  const { lang, t, toggle } = useI18n();
  const availability = useAvailability();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const headerRef = useRef<HTMLElement>(null);
  /**
   * Compact = Menu/Close panel. Driven by CSS `@media (max-width: 1399.98px)`
   * for layout; this flag only mirrors that for panel/scroll-lock behaviour.
   */
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1399.98px)').matches,
  );
  /** Intended open/closed (toggle + Escape + route). */
  const [menuOpen, setMenuOpen] = useState(false);
  /** Keeps panel in the DOM through the exit clip-path animation. */
  const [panelMounted, setPanelMounted] = useState(false);
  /** Drives `.is-open` after mount so the browser can interpolate clip-path. */
  const [panelRevealed, setPanelRevealed] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const handleMobileNavigate =
    (item: NavItem) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (!compact) return;

      if (item.isHash) {
        event.preventDefault();
        closeMenu();

        if (isHome) {
          const target = document.querySelector(item.href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (window.location.hash !== item.href) {
              window.history.pushState(null, '', item.href);
            }
            return;
          }
        }

        void navigate(`/${item.href}`);
        return;
      }

      closeMenu();
    };

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

  // Compact (Menü) for all phone + tablet widths, including iPad Mini/Air.
  // 1400px = first width where TR inline labels fit without crushing utilities.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1399.98px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    // DevTools device toggles sometimes skip matchMedia 'change' — also listen resize.
    window.addEventListener('resize', sync);
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  // Close overlay on route / hash change, or when expanding to desktop nav.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!compact) setMenuOpen(false);
  }, [compact]);

  // Mount → reveal (open); collapse reveal (close). Unmount after clip-path ends.
  useEffect(() => {
    if (menuOpen) {
      setPanelMounted(true);
      return;
    }
    setPanelRevealed(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPanelMounted(false);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!panelMounted || !menuOpen) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelRevealed(true));
    });
    return () => cancelAnimationFrame(id);
  }, [panelMounted, menuOpen]);

  // Safety net if `transitionend` is skipped (tab backgrounded, etc.).
  useEffect(() => {
    if (menuOpen || !panelMounted || panelRevealed) return;
    const timer = window.setTimeout(() => setPanelMounted(false), 560);
    return () => window.clearTimeout(timer);
  }, [menuOpen, panelMounted, panelRevealed]);

  // Escape + scroll lock while the mobile panel is mounted.
  useEffect(() => {
    if (!panelMounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const html = document.documentElement;
    const { body } = document;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };

    html.classList.add('mobile-nav-open');
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    window.addEventListener('keydown', onKeyDown);

    return () => {
      html.classList.remove('mobile-nav-open');
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [panelMounted]);

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'clip-path') return;
    if (!menuOpen) setPanelMounted(false);
  };

  const menuLabel = t(MENU_LABEL);
  const closeLabel = t(CLOSE_LABEL);
  const showPanel = panelMounted && compact;

  return (
    <>
      <ScrollProgress />
      {showPanel && (
        <div
          aria-hidden="true"
          style={{ height: 'var(--nav-height, 64px)' }}
        />
      )}
      <header
        ref={headerRef}
        data-site-header
        data-compact={compact ? 'true' : 'false'}
        data-lang={lang}
        className={[
          'border-b border-hairline bg-[rgba(10,10,11,0.82)] backdrop-blur-[14px]',
          showPanel
            ? 'fixed inset-x-0 top-0 z-[90]'
            : 'sticky top-0 z-50',
        ].join(' ')}
      >
        <nav
          aria-label="Main navigation"
          className={[
            LABEL,
            'mx-auto grid max-w-[1440px] items-center gap-x-[clamp(12px,2vw,24px)] px-[clamp(18px,4vw,52px)] py-4',
            compact
              ? 'grid-cols-[1fr_auto]'
              : 'grid-cols-[auto_1fr_auto]',
          ].join(' ')}
        >
          {/* Zone 1 — brand (auto = içerik kadar, ezilmez) */}
          <div className="flex shrink-0 items-center whitespace-nowrap">
            <BrandLink isHome={isHome} />
          </div>

          {/*
            Zone 2 — desktop links ONLY when there is room (≥1400px).
            Unmounted on tablet/phone so Turkish labels cannot overlap utilities.
          */}
          {!compact && (
            <div
              data-desktop-links
              className="flex min-w-0 items-center justify-center gap-x-[clamp(10px,1.4vw,22px)]"
            >
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
          )}

          {/* Zone 3 — availability + language + Menu/Close (auto, nowrap) */}
          <div className="flex shrink-0 items-center justify-end gap-3.5 whitespace-nowrap">
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
              {compact ? (
                <span className="sr-only">{t(STATUS_LABEL[availability])}</span>
              ) : (
                <span data-status-label>{t(STATUS_LABEL[availability])}</span>
              )}
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={lang === 'en' ? 'Türkçeye geç' : 'Switch to English'}
              className={`${LABEL} cursor-pointer border border-hairline-strong bg-transparent px-[11px] py-2 text-foreground hover:border-[rgba(255,255,255,0.35)]`}
            >
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
            {compact && (
              <MenuToggle
                open={menuOpen}
                onToggle={() => setMenuOpen((prev) => !prev)}
                menuLabel={menuLabel}
                closeLabel={closeLabel}
              />
            )}
          </div>
        </nav>
      </header>

      {showPanel && (
        <>
          <button
            type="button"
            aria-label={closeLabel}
            tabIndex={panelRevealed ? 0 : -1}
            onClick={closeMenu}
            className={[
              'mobile-nav-backdrop fixed inset-0 z-[80] bg-black/45 backdrop-blur-[6px]',
              panelRevealed ? 'is-open' : '',
            ].join(' ')}
            style={{ top: 'var(--nav-height, 64px)' }}
          />
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
            aria-hidden={!panelRevealed}
            onTransitionEnd={onPanelTransitionEnd}
            className={[
              'mobile-nav-reveal fixed inset-x-0 bottom-0 z-[85] overscroll-contain',
              panelRevealed ? 'is-open' : '',
              panelRevealed ? '' : 'pointer-events-none',
            ].join(' ')}
            style={{ top: 'var(--nav-height, 64px)' }}
          >
            <div className="flex h-full flex-col border-t border-hairline bg-[rgba(10,10,11,0.97)] backdrop-blur-[10px]">
              <nav
                aria-label="Mobile navigation"
                className={`${LABEL} flex flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-[clamp(18px,4vw,52px)] py-10`}
              >
                {NAV_ITEMS.map((item) => (
                  <HeaderNavLink
                    key={item.href}
                    item={item}
                    label={t(item.label)}
                    isHome={isHome}
                    pathname={location.pathname}
                    onNavigate={handleMobileNavigate(item)}
                    className={[
                      'font-mono text-[15px] font-medium tracking-[0.14em] transition-colors',
                      item.accent
                        ? 'text-signal hover:text-signal-hover'
                        : 'text-ink-55 hover:text-foreground',
                    ].join(' ')}
                  />
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
