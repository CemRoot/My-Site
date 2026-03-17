import React from 'react';
import { Award } from 'lucide-react';
import {
  SKILL_CATEGORIES,
  METHODOLOGIES,
  CERTIFICATIONS,
  CERTIFICATION_THEMES,
} from '../lib/constants/skills';

export function Skills() {
  return (
    <section id="skills" className="relative py-12 sm:py-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-primary/30 liquid-shimmer">
                <span className="text-sm font-mono text-primary tracking-wider">TECHNICAL SKILLS</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
              Expertise & Tools
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Specializing in <span className="text-primary font-medium">Cloud Operations</span>, 
            <span className="text-secondary font-medium"> Python Development</span>, 
            <span className="text-accent font-medium"> AI/ML</span>, and 
            <span className="text-primary font-medium"> Microsoft 365 Ecosystem</span>
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 items-stretch">
          {[...SKILL_CATEGORIES]
            .sort((a, b) => a.priority - b.priority)
            .map((category, index) => {
              const columnIndex = index % 3;
              const columnColor = columnIndex === 0 ? 'primary' : columnIndex === 1 ? 'secondary' : 'accent';
              const displayColor = columnColor;
              
              const Icon = category.icon;
              const colorClasses = {
                primary: {
                  border: 'border-primary/20',
                  text: 'text-primary',
                  iconBg: 'from-primary/20 to-primary/5',
                },
                secondary: {
                  border: 'border-secondary/20',
                  text: 'text-secondary',
                  iconBg: 'from-secondary/20 to-secondary/5',
                },
                accent: {
                  border: 'border-accent/20',
                  text: 'text-accent',
                  iconBg: 'from-accent/20 to-accent/5',
                },
              };

              const colors = colorClasses[displayColor as keyof typeof colorClasses];

              return (
                <div key={index} className="relative h-full">
                  <div className={`relative h-full flex flex-col rounded-2xl frosted-glass border ${colors.border} bg-background/60 backdrop-blur-sm overflow-hidden min-h-[280px]`}>
                    {/* Header */}
                    <div className={`px-4 py-3 bg-gradient-to-r ${colors.iconBg} border-b ${colors.border} flex-shrink-0`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-background/40 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {category.title}
                        </h3>
                      </div>
                    </div>

                    {/* Skills List */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
                        {category.skills.map((skill, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-background/40 min-h-[28px]"
                          >
                            <span className="text-muted-foreground font-medium truncate text-[11px]">
                              {skill.name}
                            </span>
                            <span className={`text-[10px] font-mono ${colors.text} opacity-80 ml-2 flex-shrink-0`}>
                              {skill.years}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Methodologies */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-secondary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-secondary/30 liquid-shimmer">
                  <span className="text-sm font-mono text-secondary tracking-wider">METHODOLOGIES & PRACTICES</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {METHODOLOGIES.map((methodology, index) => {
              const colorClasses = {
                primary: {
                  border: 'border-primary/30',
                  text: 'text-primary',
                  bg: 'bg-gradient-to-br from-primary/10 to-primary/5',
                },
                secondary: {
                  border: 'border-secondary/30',
                  text: 'text-secondary',
                  bg: 'bg-gradient-to-br from-secondary/10 to-secondary/5',
                },
                accent: {
                  border: 'border-accent/30',
                  text: 'text-accent',
                  bg: 'bg-gradient-to-br from-accent/10 to-accent/5',
                },
              };

              const colors = colorClasses[methodology.color];

              return (
                <div
                  key={index}
                  className={`relative px-5 py-4 rounded-2xl frosted-glass border ${colors.border} ${colors.bg} text-center backdrop-blur-sm`}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current/20 to-transparent opacity-50" />
                  <span className={`text-xs font-semibold ${colors.text} leading-relaxed block relative z-10`}>
                    {methodology.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-accent/30 liquid-shimmer">
                  <span className="text-sm font-mono text-accent tracking-wider">CERTIFICATIONS & LICENSES</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {CERTIFICATIONS.map((cert) => {
              const theme = CERTIFICATION_THEMES[cert.color];

              return (
                <div
                  key={`${cert.title}-${cert.year}`}
                  className="relative"
                >
                  <div className={`relative flex h-full min-h-[240px] flex-col rounded-3xl frosted-glass border ${theme.border} bg-background/60 p-6`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Award className={`w-7 h-7 ${theme.text}`} />
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide ${theme.badge} flex-shrink-0 uppercase`}>
                        {cert.type}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-foreground leading-tight mb-3 line-clamp-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {cert.title}
                    </h4>

                    <p className={`text-sm ${theme.text} font-medium mb-3`}>
                      {cert.issuer}
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                      {cert.focus}
                    </p>

                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-current/10">
                      <div className={`px-3 py-1.5 rounded-lg ${theme.platformBg} border`}>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {cert.platform}
                        </span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg ${theme.platformBg} border`}>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {cert.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
