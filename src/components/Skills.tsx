import React from 'react';
import { Code, Database, Cloud, Brain, Workflow, BarChart, Shield, Settings, Award } from 'lucide-react';

export function Skills() {
  const skillCategories = [
    {
      title: 'Programming Languages',
      icon: Code,
      color: 'primary',
      priority: 1,
      skills: [
        { name: 'Python', level: 95, years: '3+' },
        { name: 'JavaScript', level: 80, years: '2+' },
        { name: 'SQL', level: 90, years: '3+' },
        { name: 'C++', level: 75, years: '2+' },
        { name: 'C#', level: 70, years: '1+' },
        { name: 'R', level: 65, years: '1+' },
        { name: 'HTML/CSS', level: 85, years: '2+' },
      ],
    },
    {
      title: 'AI & Machine Learning',
      icon: Brain,
      color: 'accent',
      priority: 2,
      skills: [
        { name: 'TensorFlow', level: 90, years: '2+' },
        { name: 'Scikit-learn', level: 85, years: '2+' },
        { name: 'CNN/Deep Learning', level: 95, years: '1+' },
        { name: 'GANs', level: 80, years: '1+' },
        { name: 'Diffusion Models', level: 75, years: '1+' },
        { name: 'LangGraph/Crew AI', level: 80, years: '<1' },
        { name: 'OpenAI/Hugging Face', level: 85, years: '1+' },
      ],
    },
    {
      title: 'Backend & APIs',
      icon: Workflow,
      color: 'secondary',
      priority: 3,
      skills: [
        { name: 'Django', level: 90, years: '2+' },
        { name: 'Flask', level: 95, years: '3+' },
        { name: 'REST APIs', level: 95, years: '3+' },
        { name: 'FastAPI', level: 85, years: '1+' },
        { name: 'Microservices', level: 80, years: '1+' },
        { name: 'Struts Framework', level: 70, years: '1+' },
      ],
    },
    {
      title: 'Cloud & DevOps',
      icon: Cloud,
      color: 'accent',
      priority: 4,
      skills: [
        { name: 'Microsoft Azure', level: 90, years: '3+' },
        { name: 'Entra ID (Azure AD)', level: 95, years: '3+' },
        { name: 'Microsoft 365', level: 95, years: '3+' },
        { name: 'Docker', level: 85, years: '2+' },
        { name: 'CI/CD Pipelines', level: 85, years: '2+' },
        { name: 'Git/GitHub', level: 95, years: '3+' },
        { name: 'AWS', level: 75, years: '1+' },
      ],
    },
    {
      title: 'Databases',
      icon: Database,
      color: 'secondary',
      priority: 5,
      skills: [
        { name: 'PostgreSQL', level: 90, years: '2+' },
        { name: 'Oracle DB', level: 85, years: '1+' },
        { name: 'MySQL', level: 90, years: '3+' },
        { name: 'MS SQL Server', level: 85, years: '2+' },
      ],
    },
    {
      title: 'Data Analysis & Tools',
      icon: BarChart,
      color: 'primary',
      priority: 6,
      skills: [
        { name: 'Pandas', level: 95, years: '3+' },
        { name: 'NumPy', level: 90, years: '3+' },
        { name: 'Selenium', level: 85, years: '2+' },
        { name: 'Beautiful Soup', level: 85, years: '2+' },
        { name: 'Matplotlib/Visualization', level: 80, years: '2+' },
        { name: 'Statistical Analysis', level: 90, years: '2+' },
        { name: 'Excel (Advanced)', level: 90, years: '3+' },
      ],
    },
    {
      title: 'Microsoft Ecosystem',
      icon: Settings,
      color: 'primary',
      priority: 7,
      skills: [
        { name: 'Intune (Endpoint Manager)', level: 95, years: '3+' },
        { name: 'Windows 365 Cloud PC', level: 90, years: '2+' },
        { name: 'PowerShell Automation', level: 90, years: '3+' },
        { name: 'Conditional Access & MFA', level: 95, years: '3+' },
        { name: 'Azure Autopilot', level: 85, years: '2+' },
        { name: 'Google Workspace', level: 80, years: '2+' },
      ],
    },
    {
      title: 'Security & Operations',
      icon: Shield,
      color: 'secondary',
      priority: 8,
      skills: [
        { name: 'Security Baselines', level: 90, years: '3+' },
        { name: 'VDI Operations', level: 85, years: '2+' },
        { name: 'Patch Management', level: 90, years: '3+' },
        { name: 'System Monitoring', level: 90, years: '3+' },
        { name: 'Runbook/SOP Creation', level: 85, years: '3+' },
      ],
    },
  ];

  const methodologies = [
    { name: 'Agile/Scrum', color: 'primary' },
    { name: 'Test-Driven Development (TDD)', color: 'secondary' },
    { name: 'MVC Architecture', color: 'accent' },
    { name: 'SOLID Principles', color: 'primary' },
    { name: 'OOP', color: 'secondary' },
    { name: 'Data Visualization', color: 'accent' },
    { name: 'A/B Testing', color: 'primary' },
    { name: 'Statistical Modeling', color: 'secondary' },
    { name: 'Root-Cause Analysis', color: 'accent' },
    { name: 'Process Automation', color: 'primary' },
  ];

  const certifications = [
    {
      title: 'Generative AI: Working with Large Language Models',
      issuer: 'NASBA',
      platform: 'NASBA',
      year: '2025',
      focus: 'LLMs & Prompt Engineering',
      type: 'Certification',
      color: 'primary' as const,
    },
    {
      title: 'The Complete Agentic AI Engineering Course',
      issuer: 'Udemy',
      platform: 'Udemy',
      year: '2025',
      focus: 'Agentic AI Systems',
      type: 'Certification',
      color: 'secondary' as const,
    },
    {
      title: 'Machine Learning A-Z: AI, Python',
      issuer: 'Udemy',
      platform: 'Udemy',
      year: '2025',
      focus: 'Machine Learning Foundations',
      type: 'Certification',
      color: 'accent' as const,
    },
    {
      title: 'Hands-On Generative AI with Diffusion Models',
      issuer: 'LinkedIn Learning',
      platform: 'LinkedIn Learning',
      year: '2025',
      focus: 'Diffusion & Visual Generation',
      type: 'Certification',
      color: 'primary' as const,
    },
    {
      title: 'Introduction to Generative Adversarial Networks',
      issuer: 'LinkedIn Learning',
      platform: 'LinkedIn Learning',
      year: '2025',
      focus: 'GAN Architectures',
      type: 'Certification',
      color: 'secondary' as const,
    },
    {
      title: 'What Is Generative AI?',
      issuer: 'LinkedIn Learning',
      platform: 'LinkedIn Learning',
      year: '2025',
      focus: 'AI Strategy & Adoption',
      type: 'Certification',
      color: 'accent' as const,
    },
    {
      title: 'AI For Everyone',
      issuer: 'deeplearning.ai',
      platform: 'Coursera',
      year: '2023',
      focus: 'Executive AI Strategy',
      type: 'Certification',
      color: 'primary' as const,
    },
    {
      title: 'Linear Regression with NumPy and Python',
      issuer: 'Coursera',
      platform: 'Coursera',
      year: '2023',
      focus: 'Statistical Modeling',
      type: 'Certification',
      color: 'secondary' as const,
    },
    {
      title: 'Python Pro Bootcamp',
      issuer: 'Udemy',
      platform: 'Udemy',
      year: '2022',
      focus: 'Applied Python Engineering',
      type: 'Certification',
      color: 'accent' as const,
    },
    {
      title: 'Using Git and GitHub with Sourcetree',
      issuer: 'Udemy',
      platform: 'Udemy',
      year: '2021',
      focus: 'Version Control Workflows',
      type: 'Certification',
      color: 'primary' as const,
    },
    {
      title: 'IHA-1 Drone Pilot License',
      issuer: 'SHGM (Turkish DGCA)',
      platform: 'SHGM',
      year: '2021',
      focus: 'Aviation Safety & Operations',
      type: 'License',
      color: 'secondary' as const,
    },
    {
      title: 'Static Security Guard',
      issuer: 'The Security Institute',
      platform: 'The Security Institute',
      year: '2023-2026',
      focus: 'Physical Security & Compliance',
      type: 'License',
      color: 'accent' as const,
    },
  ] as const;

  const certificationThemes = {
    primary: {
      border: 'border-primary/20',
      badge: 'border border-primary/30 text-primary bg-primary/10',
      text: 'text-primary',
      iconBg: 'from-primary/25 to-primary/5',
      platformBg: 'bg-primary/5 border-primary/20',
    },
    secondary: {
      border: 'border-secondary/20',
      badge: 'border border-secondary/30 text-secondary bg-secondary/10',
      text: 'text-secondary',
      iconBg: 'from-secondary/25 to-secondary/5',
      platformBg: 'bg-secondary/5 border-secondary/20',
    },
    accent: {
      border: 'border-accent/20',
      badge: 'border border-accent/30 text-accent bg-accent/10',
      text: 'text-accent',
      iconBg: 'from-accent/25 to-accent/5',
      platformBg: 'bg-accent/5 border-accent/20',
    },
  } as const;

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
          {[...skillCategories]
            .sort((a, b) => a.priority - b.priority)
            .map((category, index) => {
              // Assign colors based on column position (0=left=primary, 1=middle=secondary, 2=right=accent)
              const columnIndex = index % 3;
              const columnColor = columnIndex === 0 ? 'primary' : columnIndex === 1 ? 'secondary' : 'accent';
              
              // Use column color instead of original category color
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
            {methodologies.map((methodology, index) => {
              const colorClasses = {
                primary: {
                  border: 'border-primary/30',
                  text: 'text-primary',
                  bg: 'bg-gradient-to-br from-primary/10 to-primary/5',
                  badge: 'border-primary/20 text-primary/90 bg-primary/5',
                },
                secondary: {
                  border: 'border-secondary/30',
                  text: 'text-secondary',
                  bg: 'bg-gradient-to-br from-secondary/10 to-secondary/5',
                  badge: 'border-secondary/20 text-secondary/90 bg-secondary/5',
                },
                accent: {
                  border: 'border-accent/30',
                  text: 'text-accent',
                  bg: 'bg-gradient-to-br from-accent/10 to-accent/5',
                  badge: 'border-accent/20 text-accent/90 bg-accent/5',
                },
              };

              const colors = colorClasses[methodology.color as keyof typeof colorClasses];

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
            {certifications.map((cert) => {
              const theme = certificationThemes[cert.color];

              return (
                <div
                  key={`${cert.title}-${cert.year}`}
                  className="relative"
                >
                  {/* Card */}
                  <div className={`relative flex h-full min-h-[240px] flex-col rounded-3xl frosted-glass border ${theme.border} bg-background/60 p-6`}>
                    {/* Header with Icon and Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Award className={`w-7 h-7 ${theme.text}`} />
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide ${theme.badge} flex-shrink-0 uppercase`}>
                        {cert.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-semibold text-foreground leading-tight mb-3 line-clamp-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {cert.title}
                    </h4>

                    {/* Issuer */}
                    <p className={`text-sm ${theme.text} font-medium mb-3`}>
                      {cert.issuer}
                    </p>

                    {/* Focus Area */}
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                      {cert.focus}
                    </p>

                    {/* Footer with Year and Platform */}
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
