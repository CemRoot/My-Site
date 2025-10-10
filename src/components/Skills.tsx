import { Code, Database, Cloud, Brain, Workflow, BarChart, Shield, Settings } from 'lucide-react';

export function Skills() {
  const skillCategories = [
    {
      title: 'Programming Languages',
      icon: Code,
      color: 'primary',
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
      title: 'Backend & APIs',
      icon: Workflow,
      color: 'secondary',
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
      title: 'Microsoft Ecosystem',
      icon: Settings,
      color: 'primary',
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
      title: 'Databases',
      icon: Database,
      color: 'secondary',
      skills: [
        { name: 'PostgreSQL', level: 90, years: '2+' },
        { name: 'Oracle DB', level: 85, years: '1+' },
        { name: 'MySQL', level: 90, years: '3+' },
        { name: 'MS SQL Server', level: 85, years: '2+' },
      ],
    },
    {
      title: 'AI & Machine Learning',
      icon: Brain,
      color: 'accent',
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
      title: 'Data Analysis & Tools',
      icon: BarChart,
      color: 'primary',
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
      title: 'Security & Operations',
      icon: Shield,
      color: 'secondary',
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
    { name: 'Generative AI: Working with Large Language Models (NASBA, 2025)', color: 'primary' },
    { name: 'The Complete Agentic AI Engineering Course (Udemy, 2025)', color: 'secondary' },
    { name: 'Machine Learning A-Z: AI, Python (Udemy, 2025)', color: 'accent' },
    { name: 'Hands-On Generative AI with Diffusion Models (LinkedIn, 2025)', color: 'primary' },
    { name: 'Introduction to Generative Adversarial Networks (LinkedIn, 2025)', color: 'secondary' },
    { name: 'What Is Generative AI? (LinkedIn, 2025)', color: 'accent' },
    { name: 'AI For Everyone (Coursera, 2023)', color: 'primary' },
    { name: 'Linear Regression with NumPy and Python (Coursera, 2023)', color: 'secondary' },
    { name: 'Python Pro Bootcamp (Udemy, 2022)', color: 'accent' },
    { name: 'Using Git and GitHub with Sourcetree (Udemy, 2021)', color: 'primary' },
    { name: 'IHA-1 Drone Pilot License (SHGM, 2021)', color: 'secondary' },
    { name: 'Static Security Guard (The Security Institute, 2023-2026)', color: 'accent' },
  ];

  return (
    <section id="skills" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong neon-border-primary liquid-shimmer">
                <span className="text-sm font-mono text-primary tracking-wider">TECHNICAL SKILLS</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Expertise & Tools
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive skill set spanning Cloud Operations, Python Development, AI/ML, and Microsoft 365 Ecosystem
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-16">
          {skillCategories.map((category, index) => {
            const Icon = category.icon;
            const colorClasses = {
              primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary bg-primary/10',
              secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 text-secondary bg-secondary/10',
              accent: 'from-accent/20 to-accent/5 border-accent/20 text-accent bg-accent/10',
            };

            return (
              <div key={index} className="group relative liquid-glow">
                <div className={`absolute -inset-2 bg-gradient-to-br ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[0]} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className={`relative p-6 rounded-3xl frosted-glass border ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[2]} liquid-shimmer transition-all duration-300 hover:scale-[1.02] h-full`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[4]} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className={`w-6 h-6 ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[3]}`} />
                    </div>
                    <h3 className="text-lg bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {category.title}
                    </h3>
                  </div>

                  {/* Skills */}
                  <div className="space-y-4">
                    {category.skills.map((skill, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">{skill.name}</span>
                          <span className={`text-xs font-mono ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[3]}`}>
                            {skill.years}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/20 rounded-full overflow-hidden backdrop-blur-sm">
                          <div
                            className={`h-full bg-gradient-to-r ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[0]} rounded-full transition-all duration-1000 group-hover:animate-pulse`}
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Methodologies */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl text-center mb-8 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Methodologies & Practices
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {methodologies.map((methodology, index) => {
              const colorClasses = {
                primary: 'border-primary/30 text-primary hover:bg-primary/10',
                secondary: 'border-secondary/30 text-secondary hover:bg-secondary/10',
                accent: 'border-accent/30 text-accent hover:bg-accent/10',
              };

              return (
                <div
                  key={index}
                  className={`px-5 py-3 rounded-2xl frosted-glass border ${colorClasses[methodology.color as keyof typeof colorClasses]} transition-all duration-300 hover:scale-105 liquid-shimmer cursor-default`}
                >
                  <span className="text-sm">{methodology.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
          <div className="relative p-8 sm:p-10 rounded-[2rem] liquid-glass-strong border border-primary/20 liquid-shimmer">
            <h3 className="text-2xl sm:text-3xl text-center mb-8 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Certifications & Licenses
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {certifications.map((cert, index) => {
                const colorClasses = {
                  primary: 'border-primary/10 hover:border-primary/30',
                  secondary: 'border-secondary/10 hover:border-secondary/30',
                  accent: 'border-accent/10 hover:border-accent/30',
                };

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-2xl liquid-glass border ${colorClasses[cert.color as keyof typeof colorClasses]} transition-all duration-300 hover:scale-[1.02]`}
                  >
                    <div className={`w-2 h-2 rounded-full ${cert.color === 'primary' ? 'bg-primary' : cert.color === 'secondary' ? 'bg-secondary' : 'bg-accent'} mt-2 flex-shrink-0`} />
                    <span className="text-sm text-muted-foreground leading-relaxed">{cert.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
