import { useEffect, useLayoutEffect, Suspense, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SEO } from './components/SEO';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { useScrollTop } from './lib/hooks/useScrollTop';
import { useSmoothScroll } from './lib/hooks/useSmoothScroll';
import { PageContextProvider } from './lib/context/PageContext';
import { lazyWithRetry, resetChunkErrorCounter } from './lib/chunk-error-handler';
import { initLazyBlur, debouncedResizeHandler } from './lib/lazy-blur';
import { SCROLL_TOP_THRESHOLD, ROUTE_CHANGE_BLUR_DELAY_MS } from './lib/constants/animation';
import {
  clearTechNewsRestoreNavFlag,
  setTechNewsRestoreNavFlag,
} from './lib/techNewsListRestore';

// HomePage is loaded synchronously for fast FCP (it's the main landing page)
import HomePage from './pages/HomePage';

// Lazy load secondary routes for code splitting
const TechNews = lazyWithRetry(() => import('./components/TechNews'));
const TechNewsDetail = lazyWithRetry(() => import('./components/TechNewsDetail'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));

// Lazy load ChatWidget - it's heavy and not immediately needed
const ChatWidget = lazyWithRetry(() => import('./components/ChatWidget'));

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
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
    if (!(isTechNewsList && wasTechNewsDetail)) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname, isTechNewsList, wasTechNewsDetail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initLazyBlur();
    }, ROUTE_CHANGE_BLUR_DELAY_MS);

    return () => clearTimeout(timer);
  }, [pathname]);

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

  // Initialize lazy blur optimization (mobile only)
  useEffect(() => {
    // Initial setup
    const cleanupFn = initLazyBlur();

    // Listen for resize events (desktop ↔ mobile transitions)
    window.addEventListener('resize', debouncedResizeHandler);

    return () => {
      // Cleanup on unmount
      if (cleanupFn) cleanupFn();
      window.removeEventListener('resize', debouncedResizeHandler);
    };
  }, []);

  return (
    <Router>
      <PageContextProvider>
        <ScrollToTopOnRouteChange />
        <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
          {/* SEO Meta Tags */}
          <SEO />

          {/* Navigation */}
          <Navbar />

          {/* Main Content with Routes */}
          <main>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tech-news" element={<TechNews />} />
                <Route path="/tech-news/:slug" element={<TechNewsDetail />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPage />} />
              </Routes>
            </Suspense>
          </main>

          {/* Footer */}
          <Footer />

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              size="icon"
              className="fixed bottom-4 right-20 sm:bottom-8 sm:right-8 z-50 w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          )}

          {/* Chat Widget - Lazy loaded */}
          <ChatWidgetWrapper />

          {/* Toast Notifications */}
          <Toaster />

          {/* Vercel Analytics */}
          <Analytics />
        </div>
      </PageContextProvider>
    </Router>
  );
}
