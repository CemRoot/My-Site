import { useState, useEffect, useRef } from 'react';
import { Brain } from 'lucide-react';
import { HIGHLIGHTS, ABOUT_ACHIEVEMENTS } from '../lib/constants/about';

export function About() {
  const [countersVisible, setCountersVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection observer for counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8"
    >
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl liquid-morph" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl liquid-morph" style={{ animationDuration: '15s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl liquid-pulse" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong neon-border-primary liquid-shimmer">
                <span className="text-sm font-mono text-primary tracking-wider">ABOUT ME</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
              Software Engineer
            </span>
            <span className="block bg-gradient-to-r from-secondary via-accent to-secondary bg-clip-text text-transparent text-3xl sm:text-4xl lg:text-5xl">
              Specializing in AI & Cloud Solutions
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Based in <span className="text-primary font-medium">Dublin, Ireland</span>, I hold an <span className="text-secondary font-medium">MSc in AI (First Class Honours, 71.4%)</span> from 
            National College of Ireland and a <span className="text-accent font-medium">BSc in Software Engineering (93.4%, 3.96 GPA)</span> from Kyiv Polytechnic Institute. 
            With over <span className="text-primary font-medium">3 years of System Operations and Python development</span> experience, 
            I specialize in <span className="text-secondary font-medium">Microsoft 365/Azure environments</span>, backend systems, and AI/ML solutions.
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {ABOUT_ACHIEVEMENTS.map((achievement, index) => {
            const Icon = achievement.icon;
            const colorClasses = {
              primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary',
              secondary: 'from-secondary/20 to-secondary/5 border-secondary/30 text-secondary',
              accent: 'from-accent/20 to-accent/5 border-accent/30 text-accent',
            };

            return (
              <div
                key={index}
                className="group relative"
                style={{
                  animation: countersVisible ? `slideInUp 0.6s ease-out ${index * 0.1}s both` : 'none',
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[achievement.color as keyof typeof colorClasses].split(' ')[0]} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`relative p-6 rounded-2xl frosted-glass border ${colorClasses[achievement.color as keyof typeof colorClasses].split(' ')[2]} hover:scale-105 transition-all duration-300 liquid-shimmer`}>
                  <Icon className={`w-8 h-8 mb-3 ${colorClasses[achievement.color as keyof typeof colorClasses].split(' ')[3]}`} />
                  <div className="text-2xl sm:text-3xl mb-1 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {achievement.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{achievement.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlights Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              primary: 'from-primary/20 to-primary/5 border-primary/20 group-hover:border-primary/40',
              secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 group-hover:border-secondary/40',
              accent: 'from-accent/20 to-accent/5 border-accent/20 group-hover:border-accent/40',
            };

            const iconColorClasses = {
              primary: 'text-primary bg-primary/10',
              secondary: 'text-secondary bg-secondary/10',
              accent: 'text-accent bg-accent/10',
            };

            const statColorClasses = {
              primary: 'text-primary',
              secondary: 'text-secondary',
              accent: 'text-accent',
            };

            return (
              <div
                key={index}
                className="group relative liquid-glow"
              >
                {/* Glow effect */}
                <div className={`absolute -inset-2 bg-gradient-to-br ${colorClasses[item.color as keyof typeof colorClasses].split(' ')[0]} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className={`relative p-8 rounded-3xl frosted-glass transition-all duration-500 h-full liquid-border liquid-shimmer hover:scale-[1.02] ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${iconColorClasses[item.color as keyof typeof iconColorClasses]} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className={`px-3 py-1 rounded-full liquid-glass text-xs font-mono ${statColorClasses[item.color as keyof typeof statColorClasses]}`}>
                      {item.stats}
                    </div>
                  </div>
                  <h3 className="text-xl mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personal Statement - Enhanced */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-[2rem] blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 liquid-pulse" />
          <div className="relative p-8 sm:p-12 rounded-[2rem] liquid-glass-strong liquid-border overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }} />
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                <Brain className="w-6 h-6 text-primary mx-4 animate-pulse" />
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent rounded-full" />
              </div>
              
              <p className="text-lg sm:text-xl leading-relaxed text-center max-w-4xl mx-auto">
                Currently working as a <span className="relative inline-block group/word">
                  <span className="text-primary font-medium">System Operations Engineer</span>
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 scale-x-0 group-hover/word:scale-x-100 transition-transform duration-500" />
                </span> managing <span className="text-secondary font-medium">Microsoft 365 and Azure environments</span> end-to-end. 
                I've 
                <span className="relative inline-block group/word ml-1">
                  <span className="text-accent font-medium">improved efficiency by 40%</span>
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent/0 via-accent to-accent/0 scale-x-0 group-hover/word:scale-x-100 transition-transform duration-500" />
                </span> through PowerShell automation and hardened security with 
                <span className="text-primary font-medium">Entra ID, Intune, and Conditional Access</span>. My expertise spans 
                <span className="font-medium bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"> cloud operations, Python development, and AI/ML engineering</span>.
              </p>

              <div className="flex items-center justify-center mt-8 gap-4">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Available for opportunities</span>
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-secondary/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
