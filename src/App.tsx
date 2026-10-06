import { useEffect, useLayoutEffect, Suspense, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ProbeTree } from './lib/perfProbe';
import { SiteHeader } from './sections/SiteHeader';
import { SiteFooter } from './sections/SiteFooter';
import { SEO } from './components/SEO';
import { Toaster } from './components/ui/sonner';
import { I18nProvider } from './features/i18n';
import { useScrollTop } from './lib/hooks/useScrollTop';
import { useSmoothScroll } from './lib/hooks/useSmoothScroll';
import { PageContextProvider } from './lib/context/PageContext';
import { lazyWithRetry, resetChunkErrorCounter } from './lib/chunk-error-handler';
import { SCROLL_TOP_THRESHOLD } from './lib/constants/animation';
import {
  clearTechNewsRestoreNavFlag,
  setTechNewsRestoreNavFlag,
} from './lib/techNewsListRestore';
import {
  isTechNewsDetailPath,
  jumpTo,
  readRoutePosition,
  restoreScrollWhenReady,
  routeEntryId,
  saveRoutePosition,
} from './lib/routeScroll';

/*
  HomePage is imported EAGERLY; every other route stays lazy.

  It used to be lazy so that /tech-news would not pull the hero code. But `/` is
  the primary route, and splitting it meant the landing page paid an extra
  serialised round-trip for its own content: the entry chunk had to download and
  execute, React then painted the `RouteLoadingFallback` ("Loading…"), and only
  after HomePage-*.js (33.6 KB) arrived did the hero appear. That was the second
  and third of three throwaway paints before any real content.

  Bundling it into the entry chunk removes a request from the critical path and
  means the Suspense fallback never paints on `/` at all. /tech-news grows by the
  hero's share of the entry chunk, which is the cheaper side of the trade.
*/
import HomePage from './pages/HomePage';

const TechNews = lazyWithRetry(() => import('./components/TechNews'));
const TechNewsDetail = lazyWithRetry(() => import('./components/TechNewsDetail'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const IrishLegalAssistantPrivacyPage = lazyWithRetry(
  () => import('./pages/IrishLegalAssistantPrivacyPage'),
);
const EnglishLearningPage = lazyWithRetry(() => import('./pages/EnglishLearningPage'));
const SkillsIndexPage = lazyWithRetry(() =>
  import('./pages/PortfolioPages').then((m) => ({ default: m.SkillsIndexPage })),
);
const SkillPage = lazyWithRetry(() =>
  import('./pages/PortfolioPages').then((m) => ({ default: m.SkillPage })),
);
const WorkPage = lazyWithRetry(() =>
  import('./pages/PortfolioPages').then((m) => ({ default: m.WorkPage })),
);
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage'));

// Lazy load ChatWidget - it's heavy and not immediately needed
const ChatWidget = lazyWithRetry(() => import('./components/ChatWidget'));

// Lightweight shell for first paint while route chunks load
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4" role="status" aria-live="polite">
      <p className="text-2xl font-semibold tracking-tight text-foreground">Cem Koyluoglu</p>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

// The router owns scroll; stop the browser from restoring it on popstate before
// the new route has rendered (it would land on the wrong page's height).
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function ScrollToTopOnRouteChange() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const prevRef = useRef<{ key: string; pathname: string } | null>(null);
  const listRestoreRef = useRef(false);
  const isFirstEntryRef = useRef(true);

  /*
    Runs once per history entry, not once per render. App re-renders for
    unrelated reasons (the scroll-to-top button toggles at 500px); a decision
    recomputed on every render used to flip and re-fire the scroll effect while
    the reader was scrolling. Session flags still have to be set during render
    so the /tech-news list's useState initialisers see them in the same commit.
  */
  if (prevRef.current?.key !== key || prevRef.current.pathname !== pathname) {
    const prev = prevRef.current;
    // Render happens before commit, so scrollY still belongs to the page we leave.
    if (prev) saveRoutePosition(routeEntryId(prev.pathname, prev.key), window.scrollY);
    // A fresh document load also reports POP; there is nothing of ours to resume.
    isFirstEntryRef.current = prev === null;

    const isTechNewsList = pathname === '/tech-news';
    listRestoreRef.current = isTechNewsList && isTechNewsDetailPath(prev?.pathname);
    if (isTechNewsList) {
      if (listRestoreRef.current) setTechNewsRestoreNavFlag();
      else clearTechNewsRestoreNavFlag();
    } else if (isTechNewsDetailPath(pathname)) {
      clearTechNewsRestoreNavFlag();
    }
    prevRef.current = { key, pathname };
  }

  useLayoutEffect(() => {
    // The list restores itself once its paginated data is back.
    if (listRestoreRef.current) return;

    if (navigationType === 'POP' && !isFirstEntryRef.current) {
      const saved = readRoutePosition(routeEntryId(pathname, key));
      if (saved != null) return restoreScrollWhenReady(saved);
    }

    // Skip the no-op on first load: native scrollTo still forces layout (93 ms
    // self time under 16x CPU throttling in a CDP profile).
    if (window.scrollY === 0) return;
    jumpTo(0);
    // Only a new history entry may move the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pathname]);

  return null;
}

function ChatWidgetWrapper() {
  const { pathname } = useLocation();

  // Show news notification on tech news detail pages
  const showNewsNotification = useMemo(() => {
    return pathname.startsWith('/tech-news/') && pathname !== '/tech-news';
  }, [pathname]);

  return (
    <Suspense fallback={null}>
      <ChatWidget showNewsNotification={showNewsNotification} />
    </Suspense>
  );
}

/**
 * Main Application Component
 * Portfolio website for Cem Koyluoglu - AI Engineer & System Operations Specialist
 */
export default function App() {
  const { showScrollTop, scrollToTop } = useScrollTop(SCROLL_TOP_THRESHOLD);
  useSmoothScroll();

  // Reset chunk error counter on successful app load
  useEffect(() => {
    resetChunkErrorCounter();
  }, []);

  return (
    <Router>
      <I18nProvider>
        <PageContextProvider>
          <ScrollToTopOnRouteChange />
          {/* overflow-x-clip, not -hidden: `hidden` would make this a scroll
              container and break `position: sticky` inside it. See globals.css. */}
          <div className="min-h-screen bg-background text-foreground antialiased overflow-x-clip">
            {/* SEO Meta Tags */}
            <SEO />

            {/* Navigation */}
            <ProbeTree id="SiteHeader"><SiteHeader /></ProbeTree>

            {/* Main Content with Routes */}
            <main>
              <Suspense fallback={<RouteLoadingFallback />}>
                <ProbeTree id="Routes">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/tech-news" element={<TechNews />} />
                  <Route path="/tech-news/:slug" element={<TechNewsDetail />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPage />} />
                  <Route path="/privacy" element={<IrishLegalAssistantPrivacyPage />} />
                  <Route path="/english-learning" element={<EnglishLearningPage />} />
                  <Route path="/skills" element={<SkillsIndexPage />} />
                  <Route path="/skills/:slug" element={<SkillPage />} />
                  <Route path="/work/:slug" element={<WorkPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </ProbeTree>
              </Suspense>
            </main>

            {/* Footer */}
            <ProbeTree id="SiteFooter"><SiteFooter /></ProbeTree>

            {/* Scroll to Top Button */}
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                data-site-fab
                className="fixed bottom-[var(--fab-bottom)] left-4 z-50 flex h-11 w-11 cursor-pointer items-center justify-center border border-hairline-strong bg-background font-mono text-sm text-foreground hover:border-[rgba(255,255,255,0.35)] sm:left-6"
                aria-label="Scroll to top"
              >
                ↑
              </button>
            )}

            {/* Chat Widget - Lazy loaded */}
            <ChatWidgetWrapper />

            {/* Toast Notifications */}
            <Toaster />

            {/* Vercel Analytics */}
            <Analytics />
          </div>
        </PageContextProvider>
      </I18nProvider>
    </Router>
  );
}
