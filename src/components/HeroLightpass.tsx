import { useEffect, useRef, useState } from 'react';
import { Github, Linkedin, Download } from 'lucide-react';
import { Button } from './ui/button';
import { drawImageCover } from '../lib/drawImageCover';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FRAME_COUNT = 150;
const BATCH_SIZE = 15;
const MOBILE_FRAME_STEP = 2;

export function HeroLightpass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Store decoded frames
  const framesRef = useRef<(ImageBitmap | HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', checkMobile);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    // Skip setup if we already know there's a load error
    if (loadError) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isMounted = true;
    let setupComplete = false;

    // Set up canvas with DPR
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Render a specific frame
    const renderFrame = (frameIndex: number) => {
      const frame = framesRef.current[frameIndex];
      if (!frame) return;

      const rect = canvas.getBoundingClientRect();
      drawImageCover(ctx, frame, rect.width, rect.height);
    };

    // Preload frames in batches
    const loadFrames = async () => {
      const frameStep = isMobile ? MOBILE_FRAME_STEP : 1;
      const framesToLoad: number[] = [];

      for (let i = 0; i < FRAME_COUNT; i += frameStep) {
        framesToLoad.push(i);
      }

      // Load first frame immediately
      const firstFrame = await loadFrame(0);
      if (!firstFrame || !isMounted) {
        // First frame failed to load or component unmounted
        return;
      }

      framesRef.current[0] = firstFrame;
      renderFrame(0);
      setIsLoaded(true);

      // Load remaining frames in batches
      for (let i = 1; i < framesToLoad.length; i += BATCH_SIZE) {
        if (!isMounted) break;
        const batch = framesToLoad.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(loadFrame));
      }
    };

    const loadFrame = async (index: number): Promise<ImageBitmap | HTMLImageElement | null> => {
      try {
        const paddedIndex = String(index + 1).padStart(4, '0');
        const path = `/sequences/face_lightpass/${paddedIndex}.webp`;

        const response = await fetch(path);
        if (!response.ok) {
          // If first frame fails, set error state
          if (index === 0) {
            setLoadError(true);
          }
          throw new Error(`Failed to load ${path}`);
        }

        const blob = await response.blob();

        // Use createImageBitmap if available
        if (typeof createImageBitmap !== 'undefined') {
          const bitmap = await createImageBitmap(blob);
          framesRef.current[index] = bitmap;
          return bitmap;
        } else {
          // Fallback to Image
          const img = new Image();
          const url = URL.createObjectURL(blob);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          URL.revokeObjectURL(url);
          framesRef.current[index] = img;
          return img;
        }
      } catch (error) {
        // Silently fail for individual frames, only log first frame error
        if (index === 0) {
          console.debug('Lightpass sequence not available');
        }
        return null;
      }
    };

    // Reduced motion fallback - show single composite frame
    if (prefersReducedMotion) {
      loadFrame(Math.floor(FRAME_COUNT / 2)).then((frame) => {
        if (frame && isMounted) {
          framesRef.current[Math.floor(FRAME_COUNT / 2)] = frame;
          renderFrame(Math.floor(FRAME_COUNT / 2));
          setIsLoaded(true);
        }
      });
      return () => {
        isMounted = false;
      };
    }

    // Start loading frames
    loadFrames().then(() => {
      if (!isMounted || loadError || !wrapper) return;

      setupComplete = true;

      // Set up GSAP ScrollTrigger animation only after first frame loads
      const state = { frame: 0 };
      const frameStep = isMobile ? MOBILE_FRAME_STEP : 1;
      const maxFrame = Math.floor((FRAME_COUNT - 1) / frameStep) * frameStep;

      try {
        animationRef.current = gsap.to(state, {
          frame: maxFrame,
          snap: { frame: frameStep },
          ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: '+=200vh',
            scrub: 0.5,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (isMounted) {
                const currentFrame = Math.round(state.frame);
                renderFrame(currentFrame);
              }
            },
          },
          onUpdate: () => {
            if (isMounted) {
              const currentFrame = Math.round(state.frame);
              renderFrame(currentFrame);
            }
          },
        });

        scrollTriggerRef.current = animationRef.current.scrollTrigger || null;
      } catch (error) {
        console.error('GSAP setup error:', error);
        setLoadError(true);
      }
    }).catch((error) => {
      console.error('Frame loading error:', error);
      setLoadError(true);
    });

    // Cleanup
    return () => {
      isMounted = false;
      window.removeEventListener('resize', setupCanvas);
      
      // Kill GSAP animations safely - only if setup was complete
      if (setupComplete) {
        try {
          if (scrollTriggerRef.current) {
            scrollTriggerRef.current.kill(true);
            scrollTriggerRef.current = null;
          }
          
          if (animationRef.current) {
            animationRef.current.kill();
            animationRef.current = null;
          }
        } catch (error) {
          // Silently handle cleanup errors
          console.debug('GSAP cleanup:', error);
        }
      }

      // Release ImageBitmaps
      framesRef.current.forEach((frame) => {
        if (frame && 'close' in frame) {
          try {
            (frame as ImageBitmap).close();
          } catch (error) {
            // Silently handle bitmap cleanup errors
          }
        }
      });
      
      framesRef.current = new Array(FRAME_COUNT).fill(null);
    };
  }, [isMobile, prefersReducedMotion, loadError]);

  const metrics = [
    { value: '97%', label: 'Deepfake Accuracy' },
    { value: '45%', label: 'Page-load Reduction' },
    { value: '40%', label: 'Ops Efficiency' },
  ];

  return (
    <>
      {/* Lightpass Canvas Section */}
      {!loadError && (
        <section
          ref={wrapperRef}
          id="hero-lightpass-wrap"
          className="relative h-[300vh] bg-black"
          aria-hidden="true"
        >
          <canvas
            ref={canvasRef}
            id="hero-lightpass"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[100vw] max-h-[100vh] bg-black"
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'contain',
            }}
          />
        </section>
      )}

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
                asChild
              >
                <a href="https://github.com/CemRoot" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                  View GitHub
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-secondary/30 hover:bg-secondary/10 gap-2 rounded-2xl"
                asChild
              >
                <a href="https://linkedin.com/in/cem-koyluoglu/" target="_blank" rel="noopener noreferrer">
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

            {/* Loading/Error indicator */}
            {!isLoaded && !loadError && (
              <div className="mt-8 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Loading lightpass sequence...
                </div>
              </div>
            )}
            
            {loadError && (
              <div className="mt-8 text-muted-foreground text-xs max-w-md text-center">
                <p>
                  <span className="text-accent">⚠</span> Image sequence not found. 
                  Place your frames in <code className="bg-muted px-1 rounded">/public/sequences/face_lightpass/</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
