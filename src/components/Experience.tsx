import { useState } from 'react';
import { Globe } from 'lucide-react';
import { EXPERIENCES, ACHIEVEMENTS_BAR } from '../lib/constants/experience';

function Experience() {
  const [activeTab, setActiveTab] = useState<'work' | 'education'>('work');

  const workExperiences = EXPERIENCES.filter(exp => exp.type === 'work');
  const educationExperiences = EXPERIENCES.filter(exp => exp.type === 'education');

  const renderCard = (exp: typeof EXPERIENCES[number], index: number) => {
    const Icon = exp.icon;
    const colorClasses = {
      primary: {
        border: 'border-primary/30',
        hoverBorder: 'hover:border-primary/50',
        text: 'text-primary',
        bg: 'bg-primary/10',
      },
      secondary: {
        border: 'border-secondary/30',
        hoverBorder: 'hover:border-secondary/50',
        text: 'text-secondary',
        bg: 'bg-secondary/10',
      },
      accent: {
        border: 'border-accent/30',
        hoverBorder: 'hover:border-accent/50',
        text: 'text-accent',
        bg: 'bg-accent/10',
      },
    };

    const colors = colorClasses[exp.color as keyof typeof colorClasses];
    const isSubdued = exp.className?.includes('opacity');

    return (
      <div key={index} className={`relative group w-full ${isSubdued ? 'opacity-70' : ''}`}>
        <div className="relative w-full">
          <div className={`relative p-6 sm:p-8 rounded-2xl frosted-glass border ${colors.border} ${colors.hoverBorder} transition-all duration-300 w-full`}>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mt-0.5`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground break-words leading-snug">
                    {exp.title}
                  </h3>
                  <p className={`text-sm font-medium ${colors.text} break-words mt-0.5`}>
                    {exp.organization}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted/50 whitespace-nowrap flex-shrink-0 self-start ml-13 sm:ml-0">
                {exp.period}
              </span>
            </div>

            <div className="sm:pl-14">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed break-words">
                {exp.description}
              </p>

              <ul className="space-y-2.5 pl-4 list-disc marker:text-muted-foreground/50">
                {exp.achievements.map((achievement, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-muted-foreground break-words pl-1">
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="experience" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-accent/30 liquid-shimmer">
                <span className="text-sm font-mono text-accent tracking-wider">EXPERIENCE & EDUCATION</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
              Professional Journey
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            3+ years of System Operations and Python development experience combined with First Class Honours MSc in AI
          </p>

          {/* Achievement Bar - Auto-scrolling marquee on mobile, static wrap on desktop */}
          <div className="w-full overflow-hidden md:overflow-visible pb-4 md:pb-0">
            <div className="flex md:flex-wrap md:justify-center gap-3 sm:gap-4 animate-marquee md:animate-none">
              {[...ACHIEVEMENTS_BAR, ...ACHIEVEMENTS_BAR].map((badge, idx) => (
                <div
                  key={idx}
                  aria-hidden={idx >= ACHIEVEMENTS_BAR.length}
                  className={`flex shrink-0 md:shrink items-center gap-2 px-4 py-2 rounded-full frosted-glass border border-primary/20 liquid-shimmer text-xs md:text-sm font-medium text-foreground whitespace-nowrap ${idx >= ACHIEVEMENTS_BAR.length ? 'md:hidden' : ''}`}
                >
                  <badge.icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center justify-center gap-4 w-full pt-10 sm:pt-14 mt-2 border-t border-white/5">
            <button
              onClick={() => setActiveTab('work')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'work'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'frosted-glass border border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              Work Experience
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'education'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'frosted-glass border border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              Education
            </button>
          </div>
        </div>

        {/* Tab Content Area with Smooth Fade Transition */}
        <div className="relative w-full">
          {/* Work Experience Tab */}
          <div
            className={`flex flex-col gap-6 sm:gap-8 transition-opacity duration-300 ease-in-out ${
              activeTab === 'work' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0'
            }`}
          >
            {workExperiences.map((exp, index) => renderCard(exp, index))}
          </div>

          {/* Education Tab */}
          <div
            className={`flex flex-col gap-6 sm:gap-8 transition-opacity duration-300 ease-in-out ${
              activeTab === 'education' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0'
            }`}
          >
            {educationExperiences.map((exp, index) => renderCard(exp, index))}

            {/* Standalone C1 Business English Badge (Visible only in Education Tab) */}
            <div className="flex justify-center mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                <Globe className="w-3.5 h-3.5" />
                C1 Business English
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Experience;
