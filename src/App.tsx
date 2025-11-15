import { useEffect, Suspense } from 'react';
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

// Lazy load routes for code splitting with chunk error handling
const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
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

  // Reset chunk error counter on successful app load
  useEffect(() => {
    resetChunkErrorCounter();
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
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>

          {/* Toast Notifications */}
          <Toaster />

          {/* Vercel Analytics */}
          <Analytics />
        </div>
      </PageContextProvider>
    </Router>
  );
}
