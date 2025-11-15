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
    <section id="skills" className="relative py-12 sm:py-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="px-4 py-1.5 rounded-full frosted-glass border border-primary/20">
              <span className="text-xs font-mono text-primary tracking-wider">TECHNICAL SKILLS</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4 text-foreground font-semibold">
            Expertise & Tools
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Cloud Operations, Python Development, AI/ML, and Microsoft 365 Ecosystem
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {skillCategories.map((category, index) => {
            const Icon = category.icon;
            const colorClasses = {
              primary: 'border-primary/20 text-primary bg-primary/5',
              secondary: 'border-secondary/20 text-secondary bg-secondary/5',
              accent: 'border-accent/20 text-accent bg-accent/5',
            };

            return (
              <div key={index} className="group">
                <div className={`relative p-4 rounded-2xl frosted-glass border ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[0]} transition-all duration-300`}>
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-current/10">
                    <div className={`w-8 h-8 rounded-lg ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[2]} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[1]}`} />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">
                      {category.title}
                    </h3>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    {category.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{skill.name}</span>
                        <span className={`text-xs font-mono ${colorClasses[category.color as keyof typeof colorClasses].split(' ')[1]} opacity-70`}>
                          {skill.years}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Methodologies */}
        <div className="mb-8">
          <h3 className="text-base text-center mb-3 text-muted-foreground font-medium">
            Methodologies & Practices
          </h3>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-4xl mx-auto">
            {methodologies.map((methodology, index) => {
              const colorClasses = {
                primary: 'border-primary/15 text-primary/80',
                secondary: 'border-secondary/15 text-secondary/80',
                accent: 'border-accent/15 text-accent/80',
              };

              return (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-md frosted-glass border ${colorClasses[methodology.color as keyof typeof colorClasses]} text-[10px] leading-tight`}
                >
                  {methodology.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <h3 className="text-base text-center mb-4 text-muted-foreground font-medium">
            Certifications & Licenses
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-5xl mx-auto">
            {certifications.map((cert, index) => {
              const colorClasses = {
                primary: 'border-primary/10',
                secondary: 'border-secondary/10',
                accent: 'border-accent/10',
              };

              return (
                <div
                  key={index}
                  className={`flex items-start gap-1.5 p-2 rounded-lg frosted-glass border ${colorClasses[cert.color as keyof typeof colorClasses]} transition-opacity duration-300 hover:opacity-80`}
                >
                  <div className={`w-1 h-1 rounded-full ${cert.color === 'primary' ? 'bg-primary' : cert.color === 'secondary' ? 'bg-secondary' : 'bg-accent'} mt-1 flex-shrink-0`} />
                  <span className="text-[10px] text-muted-foreground leading-snug">{cert.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
