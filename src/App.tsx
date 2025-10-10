import { ArrowUp } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Stats } from './components/Stats';
import { About } from './components/About';
import { Services } from './components/Services';
import { Projects } from './components/Projects';
import { Experience } from './components/Experience';
import { Skills } from './components/Skills';
import { CV } from './components/CV';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { SEO } from './components/SEO';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { useScrollTop } from './lib/hooks/useScrollTop';
import { useSmoothScroll } from './lib/hooks/useSmoothScroll';

/**
 * Main Application Component
 * Portfolio website for Cem Koyluoglu - AI Engineer & System Operations Specialist
 */
export default function App() {
  const { showScrollTop, scrollToTop } = useScrollTop(500);
  useSmoothScroll();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      {/* SEO Meta Tags */}
      <SEO />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        <Hero />
        <Stats />
        <About />
        <Services />
        <Projects />
        <Experience />
        <Skills />
        <CV />
        <Contact />
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

      {/* Chat Widget */}
      <ChatWidget />

      {/* Toast Notifications */}
      <Toaster />

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}
