import { useEffect, useRef, useState } from 'react';
import { Github, Linkedin, Download } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Fallback hero component using CSS clip-path animation
 * Used when image sequence is not available or on reduced motion
 */
export function HeroLightpassFallback() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return;
      
      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate scroll progress (0 to 1)
      const scrollRange = elementHeight - viewportHeight;
      const scrolled = -elementTop;
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const metrics = [
    { value: '97%', label: 'Deepfake Accuracy' },
    { value: '45%', label: 'Page-load Reduction' },
    { value: '40%', label: 'Ops Efficiency' },
  ];

  return (
    <>
      {/* Lightpass Effect Section */}
      <section
        ref={wrapperRef}
        className="relative h-[200vh] bg-black"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Base image */}
          <img
            src="https://images.unsplash.com/photo-1759399093797-997e0c85e85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            aria-hidden="true"
          />
          
          {/* Light overlay with clip-path */}
          <img
            src="https://images.unsplash.com/photo-1759399093797-997e0c85e85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              clipPath: `inset(0 ${100 - scrollProgress * 100}% 0 0)`,
              filter: 'brightness(1.3) contrast(1.1)',
            }}
            aria-hidden="true"
          />

          {/* Glow effect at the edge */}
          <div
            className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-2xl"
            style={{
              left: `${scrollProgress * 100}%`,
              transform: 'translateX(-50%)',
            }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Hero Content Section (SEO-friendly text) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-20 bg-background">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Motto */}
            <div className="inline-flex items-center rounded-xl border border-primary/30 bg-primary/5 text-primary px-4 py-2 backdrop-blur-sm">
              <span className="font-mono">I'm Coding Your Future!</span>
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Building high-impact AI systems
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                MSc AI (First Class) · Python/Backend · Data/ML Pipelines · Azure Automations
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-black gap-2 rounded-2xl shadow-lg shadow-primary/20"
              >
                <Download className="w-4 h-4" />
                Download CV
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 gap-2 rounded-2xl"
              >
                <a href="https://github.com/CemRoot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  View GitHub
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-secondary/30 hover:bg-secondary/10 gap-2 rounded-2xl"
              >
                <a href="https://linkedin.com/in/cem-koyluoglu/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  Connect
                </a>
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-8 max-w-3xl w-full">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-card border border-primary/10 rounded-2xl p-4 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="text-2xl sm:text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
