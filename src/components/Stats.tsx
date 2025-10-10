import { useEffect, useRef, useState } from 'react';
import { Code2, Award, Briefcase, TrendingUp } from 'lucide-react';
import { STATS } from '../lib/constants/personal';
import { getColorClasses } from '../lib/utils/classNames';
import type { StatItem as StatItemType } from '../lib/types';

/**
 * Individual Stat Item Component
 * Displays an animated counter with icon and label
 */
interface StatItemProps extends StatItemType {
  icon: React.ElementType;
}

function StatItem({ icon: Icon, value, suffix, label, color, decimals = 0 }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Observe when component enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate counter when visible
  useEffect(() => {
    if (!isVisible) return;

    const ANIMATION_DURATION = 2000;
    const ANIMATION_STEPS = 60;
    const stepValue = value / ANIMATION_STEPS;
    const stepDuration = ANIMATION_DURATION / ANIMATION_STEPS;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= ANIMATION_STEPS) {
        setCount(stepValue * currentStep);
      } else {
        setCount(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  const colors = getColorClasses(color);

  return (
    <div ref={ref} className="group relative">
      <div className={`absolute -inset-2 bg-gradient-to-br ${colors.bg} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
      <div className={`relative p-8 rounded-3xl liquid-glass-strong border ${colors.border} transition-all duration-300 hover:scale-105`}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-8 h-8 ${colors.text}`} />
          </div>
          <div className={`text-4xl sm:text-5xl mb-2 ${colors.text} tabular-nums`}>
            {count.toFixed(decimals)}
            <span className="ml-1">{suffix}</span>
          </div>
          <p className="text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stats Section Component
 * Displays achievements and key metrics with animated counters
 */
export function Stats() {
  const statsWithIcons = [
    { ...STATS[0], icon: Code2 },
    { ...STATS[1], icon: Award },
    { ...STATS[2], icon: Briefcase },
    { ...STATS[3], icon: TrendingUp },
  ];

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-primary/30 liquid-shimmer">
                <span className="text-sm font-mono text-primary tracking-wider">ACHIEVEMENTS</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              By The Numbers
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Proven track record of excellence in AI engineering and system operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsWithIcons.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl liquid-glass border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Currently pursuing advanced AI certifications & working on cutting-edge projects
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
