import React, { useState, useEffect } from 'react';
import { Github, Linkedin, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import portraitImage from '../assets/b2434507c36da971cecf1c8e91f157fb86abbf62.png';

export function Hero() {
  const roles = [
    "AI Engineer",
    "GenAI Specialist",
    "DeepFake Detection Expert",
    "Python Developer",
    "Azure Cloud Architect",
    "AI Automation Engineer"
  ];

  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [scrambledText, setScrambledText] = useState(roles[0]);
  const [isScrambling, setIsScrambling] = useState(false);

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-20">
      {/* Enhanced animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient - top left */}
        <div 
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '6s',
            background: 'radial-gradient(circle, rgba(91, 231, 255, 0.4) 0%, rgba(91, 231, 255, 0.1) 50%, transparent 100%)'
          }} 
        />
        
        {/* Secondary gradient - bottom right */}
        <div 
          className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '8s', 
            animationDelay: '1s',
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, rgba(167, 139, 250, 0.1) 50%, transparent 100%)'
          }} 
        />
        
        {/* Accent gradient - center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/25 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '10s', 
            animationDelay: '2s',
            background: 'radial-gradient(circle, rgba(255, 184, 108, 0.35) 0%, rgba(255, 184, 108, 0.1) 50%, transparent 100%)'
          }} 
        />
        
        {/* Additional glow layers for depth */}
        <div 
          className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '7s',
            animationDelay: '0.5s',
            background: 'radial-gradient(circle, rgba(91, 231, 255, 0.3) 0%, transparent 70%)'
          }} 
        />
        
        <div 
          className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDuration: '9s',
            animationDelay: '1.5s',
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%)'
          }} 
        />
        
        {/* Subtle overlay gradient for overall ambiance */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(91, 231, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(167, 139, 250, 0.15) 0%, transparent 50%), radial-gradient(ellipse at center, rgba(255, 184, 108, 0.1) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center justify-center lg:justify-start">
              <div className="group relative rounded-full px-5 liquid-glass neon-border-primary" style={{ overflow: 'visible', paddingTop: '0.75rem', paddingBottom: '0.75rem', position: 'relative' }}>
                {/* Continuous shimmer effect */}
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(91, 231, 255, 0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmerMove 3s linear infinite',
                    opacity: 0.6,
                  }}
                />
                <span className={`relative font-[Hobo_BT] text-sm text-primary transition-all duration-200 z-10 ${isScrambling ? 'opacity-80' : 'opacity-100'}`} style={{ display: 'inline-block', lineHeight: '1.8', verticalAlign: 'baseline', paddingTop: '0.1em', paddingBottom: '0.2em' }}>
                  {scrambledText}
                </span>
              </div>
            </div>

            {/* Name & Title */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent font-[Hobo_BT]" style={{ paddingTop: '0.1em', paddingBottom: '0.1em' }}>
                  Cem
                </span>
                <span 
                  className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-wide antialiased font-[Hobo_BT] relative"
                  style={{ 
                    fontWeight: 600, 
                    letterSpacing: '0.05em', 
                    paddingTop: '0.1em', 
                    paddingBottom: '0.15em', 
                    lineHeight: '1.2',
                  }}
                >
                  Koyluoglu
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0" style={{ paddingTop: '0.25em', paddingBottom: '0.25em', lineHeight: '1.6' }}>
                AI Engineer crafting intelligent automation systems with Python, GenAI, and Azure Cloud. Expert in DeepFake detection and AI-powered solutions.
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
            <div className="relative group max-w-md mx-auto">
              {/* Subtle glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl opacity-10 group-hover:opacity-25 transition-opacity duration-500" />
              
              {/* Liquid Glass Frame */}
              <div className="relative rounded-3xl liquid-border">
                {/* Image */}
                <img
                  src={portraitImage}
                  alt="Cem Koyluoglu - AI Engineer"
                  className="w-full h-auto relative rounded-3xl transition-all duration-300 group-hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                  style={{
                    boxShadow: `
                      0 40px 80px -15px rgba(0, 0, 0, 0.85),
                      -35px 25px 70px -10px rgba(91, 231, 255, 0.5),
                      35px 25px 70px -10px rgba(167, 139, 250, 0.5),
                      -45px 0 80px rgba(91, 231, 255, 0.3),
                      45px 0 80px rgba(167, 139, 250, 0.3)
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

      {/* Color Wave Animation */}
      <style>{`
        @keyframes colorWave {
          0% {
            background-position: 200% 0%;
          }
          100% {
            background-position: -200% 0%;
          }
        }
        @keyframes shimmerMove {
          0% {
            background-position: -200% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }
        .color-wave {
          display: inline-block;
          animation: colorWave 5s linear infinite;
          background: linear-gradient(90deg, #E30A17 0%, #E30A17 25%, #FFFFFF 25%, #FFFFFF 50%, #E30A17 50%, #E30A17 75%, #FFFFFF 75%, #FFFFFF 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </section>
  );
}
