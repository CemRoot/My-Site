import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Github, Linkedin, Download, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { OptimizedImage } from './OptimizedImage';

// Import all image formats for Vite's asset hashing
import portraitPng from '../assets/b2434507c36da971cecf1c8e91f157fb86abbf62.png';
import portraitWebp from '../assets/b2434507c36da971cecf1c8e91f157fb86abbf62.webp';
import portraitAvif from '../assets/b2434507c36da971cecf1c8e91f157fb86abbf62.avif';

export function Hero() {
  const roles = [
    "Software Engineer",
    "AI Engineer",
    "Backend Developer",
    "Python Developer",
    "System Operations Engineer",
    "Cloud Automation Specialist"
  ];

  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [scrambledText, setScrambledText] = useState(roles[0]);
  const [isScrambling, setIsScrambling] = useState(false);
  
  // Mouse tracking for 3D portrait effect - optimized with RAF and debouncing
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const mousePosRef = useRef({ x: 0, y: 0 }); // Use ref to avoid state updates on every move

  // Auto-rotate roles every 3 seconds
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setCurrentRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3000);

    return () => clearInterval(rotateInterval);
  }, []);

  // Scramble effect when role changes - optimized interval
  useEffect(() => {
    const currentRole = roles[currentRoleIndex];
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    let iterations = 0;
    const maxIterations = currentRole.length;

    setIsScrambling(true);

    // Use requestAnimationFrame for better performance
    let lastTime = performance.now();
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= 50) { // 50ms delay between updates
        setScrambledText(
          currentRole
            .split('')
            .map((char, index) => {
              if (index < iterations) {
                return currentRole[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );

        iterations += 1 / 2;
        lastTime = currentTime;
      }

      if (iterations >= maxIterations) {
        setScrambledText(currentRole);
        setIsScrambling(false);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentRoleIndex]);
  
  // Highly optimized mouse handler with RAF and aggressive throttling
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = performance.now();
    // Aggressive throttle to 30fps (33ms) for better performance
    if (now - lastUpdateRef.current < 33) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

      // Only update state if change is significant (>0.05 difference)
      if (Math.abs(mousePosRef.current.x - x) > 0.05 || Math.abs(mousePosRef.current.y - y) > 0.05) {
        mousePosRef.current = { x, y };
        setMousePos({ x, y });
      }
      lastUpdateRef.current = now;
    });
  }, []);
  
  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-20">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center justify-center lg:justify-start">
              <div className="group relative overflow-hidden rounded-full px-5 py-2 liquid-glass neon-border-primary liquid-shimmer">
                <span className={`relative font-mono text-sm text-primary transition-all duration-200 ${isScrambling ? 'opacity-80' : 'opacity-100'}`}>
                  {scrambledText}
                </span>
              </div>
            </div>

            {/* Name & Title */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent" style={{ paddingTop: '0.1em', paddingBottom: '0.1em' }}>
                  Cem
                </span>
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-wide antialiased" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.05em', paddingTop: '0.1em', paddingBottom: '0.15em', lineHeight: '1.2' }}>
                  Koyluoglu
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0" style={{ paddingTop: '0.25em', paddingBottom: '0.25em', lineHeight: '1.6' }}>
                Software Engineer with MSc in AI (First Class Honours) specializing in Python, backend development, REST APIs, and Azure cloud automation
              </p>
            </div>

            {/* Credentials */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm">
              <div className="px-4 py-2 rounded-xl liquid-glass neon-border-primary liquid-shimmer">
                <span className="text-primary">MSc AI</span> · First Class · 3.1 GPA
              </div>
              <div className="px-4 py-2 rounded-xl liquid-glass neon-border-secondary liquid-shimmer">
                Python · 3+ Years
              </div>
              <div className="px-4 py-2 rounded-xl liquid-glass border border-accent/20 liquid-shimmer">
                Dublin, Ireland
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-black rounded-2xl px-8 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-105"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CV
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group relative overflow-hidden border-primary/20 hover:border-primary/40 rounded-2xl px-8 backdrop-blur-sm bg-primary/5 hover:bg-primary/10 transition-all duration-300"
              >
                <a href="https://github.com/CemRoot" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="group relative overflow-hidden border-secondary/20 hover:border-secondary/40 rounded-2xl px-8 backdrop-blur-sm bg-secondary/5 hover:bg-secondary/10 transition-all duration-300"
              >
                <a href="https://www.linkedin.com/in/cem-koyluoglu/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="relative group liquid-glow">
                <div className="relative p-4 rounded-2xl frosted-glass neon-border-primary hover:scale-105 transition-all duration-300 liquid-shimmer">
                  <div className="text-3xl sm:text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                    97%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Deepfake Detection</div>
                </div>
              </div>
              <div className="relative group liquid-glow">
                <div className="relative p-4 rounded-2xl frosted-glass neon-border-secondary hover:scale-105 transition-all duration-300 liquid-shimmer">
                  <div className="text-3xl sm:text-4xl bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent mb-1">
                    45%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Load Reduction</div>
                </div>
              </div>
              <div className="relative group liquid-glow">
                <div className="relative p-4 rounded-2xl frosted-glass border border-accent/30 hover:border-accent/50 hover:scale-105 transition-all duration-300 liquid-shimmer">
                  <div className="text-3xl sm:text-4xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-1">
                    40%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Ops Efficiency</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Portrait Image with Liquid Glass Frame */}
          <div className="order-1 lg:order-2 p-8 lg:p-12">
            <div 
              className="relative group max-w-md mx-auto" 
              style={{ perspective: '1500px' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => {
                setIsHovering(false);
                setMousePos({ x: 0, y: 0 });
                if (rafRef.current) {
                  cancelAnimationFrame(rafRef.current);
                }
              }}
            >
              {/* Subtle glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500" />
              
              {/* Liquid Glass Frame - REMOVED overflow-hidden */}
              <div className="relative rounded-3xl liquid-border">
                {/* Image - POP OUT EFFECT with MOUSE TRACKING - Optimized with modern formats */}
                <OptimizedImage
                  src={portraitPng}
                  srcWebp={portraitWebp}
                  srcAvif={portraitAvif}
                  alt="Cem Koyluoglu - AI Engineer"
                  className="w-full h-auto relative rounded-3xl"
                  loading="eager"
                  fetchPriority="high"
                  width={800}
                  height={800}
                  style={{
                    transform: isHovering
                      ? `perspective(1200px) translateZ(60px) translateY(-20px) translateX(12px) rotateY(${-8 + mousePos.x * 10}deg) rotateX(${4 - mousePos.y * 10}deg) scale(1.12)`
                      : 'perspective(1200px) translateZ(40px) translateY(-12px) translateX(8px) rotateY(-5deg) rotateX(3deg) scale(1.08)',
                    transformStyle: 'preserve-3d',
                    transition: isHovering ? 'transform 0.15s ease-out, box-shadow 0.3s ease' : 'transform 0.7s ease-out, box-shadow 0.7s ease',
                    zIndex: 50,
                    boxShadow: isHovering
                      ? `
                        0 50px 100px -20px rgba(0, 0, 0, 0.9),
                        -40px 30px 80px -10px rgba(91, 231, 255, 0.7),
                        40px 30px 80px -10px rgba(167, 139, 250, 0.7),
                        -50px 0 100px rgba(91, 231, 255, 0.4),
                        50px 0 100px rgba(167, 139, 250, 0.4),
                        ${-30 + mousePos.x * 25}px ${20 + mousePos.y * 20}px 90px rgba(91, 231, 255, 0.35),
                        ${30 - mousePos.x * 25}px ${20 + mousePos.y * 20}px 90px rgba(167, 139, 250, 0.35)
                      `
                      : `
                        0 40px 80px -15px rgba(0, 0, 0, 0.85),
                        -35px 25px 70px -10px rgba(91, 231, 255, 0.5),
                        35px 25px 70px -10px rgba(167, 139, 250, 0.5),
                        -45px 0 80px rgba(91, 231, 255, 0.3),
                        45px 0 80px rgba(167, 139, 250, 0.3),
                        -25px 20px 70px rgba(91, 231, 255, 0.25),
                        25px 20px 70px rgba(167, 139, 250, 0.25)
                      `,
                    filter: 'brightness(1.08) contrast(1.12) saturate(1.05)',
                  }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent rounded-3xl pointer-events-none" style={{ zIndex: 45 }} />
              </div>

              {/* Minimal floating accent elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl liquid-morph liquid-float" style={{ zIndex: 1 }} />
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-secondary/10 rounded-full blur-xl liquid-morph" style={{ animationDelay: '2s', animationDuration: '10s', zIndex: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="hidden md:flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-xs text-muted-foreground">Scroll</span>
          <ChevronDown className="w-5 h-5 text-primary" />
        </div>
      </div>
    </section>
  );
}
