import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SEO } from './components/SEO';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { useScrollTop } from './lib/hooks/useScrollTop';
import { useSmoothScroll } from './lib/hooks/useSmoothScroll';
import { PageContextProvider } from './lib/context/PageContext';

// Lazy load routes for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const TechNews = lazy(() => import('./components/TechNews'));
const TechNewsDetail = lazy(() => import('./components/TechNewsDetail'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Lazy load ChatWidget - it's heavy and not immediately needed
const ChatWidget = lazy(() => import('./components/ChatWidget'));

// Lazy load Analytics - load after initial render to improve FCP/LCP
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics }))
);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

/**
 * Main Application Component
 * Portfolio website for Cem Koyluoglu - AI Engineer & System Operations Specialist
 */
export default function App() {
  const { showScrollTop, scrollToTop } = useScrollTop(500);
  useSmoothScroll();

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
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>

          {/* Toast Notifications */}
          <Toaster />

          {/* Vercel Analytics - Lazy loaded to not block initial render */}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </div>
      </PageContextProvider>
    </Router>
  );
}
