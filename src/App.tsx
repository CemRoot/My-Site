import { useEffect, useLayoutEffect, Suspense, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
const EnglishLearningPage = lazyWithRetry(() => import('./pages/EnglishLearningPage'));
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

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();
  const prevPathRef = useRef<string | undefined>(undefined);

  const prev = prevPathRef.current;
  const isTechNewsList = pathname === '/tech-news';
  const wasTechNewsDetail =
    typeof prev === 'string' &&
    prev.startsWith('/tech-news/') &&
    prev !== '/tech-news';

  // Session flags must run during render so /tech-news list useState initializers
  // see the correct value in the same commit (before child layout effects).
  if (isTechNewsList) {
    if (wasTechNewsDetail) {
      setTechNewsRestoreNavFlag();
    } else {
      clearTechNewsRestoreNavFlag();
    }
  } else if (pathname.startsWith('/tech-news/')) {
    clearTechNewsRestoreNavFlag();
  }

  prevPathRef.current = pathname;

  useLayoutEffect(() => {
    if (isTechNewsList && wasTechNewsDetail) return;
    /*
      Only scroll when there is somewhere to scroll from.

      This runs on the FIRST mount too, where the page is already at the top, so
      the call was a no-op that still forced a scroll + layout. A CDP sampling
      profile of the initial load put native `scrollTo` at 93 ms of self time
      under 16x CPU throttling — the fourth-hottest function on the page, for a
      scroll that moved nothing.
    */
    if (window.scrollY === 0) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, isTechNewsList, wasTechNewsDetail]);

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
                  <Route path="/english-learning" element={<EnglishLearningPage />} />
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
