import { useState } from 'react';
import { Briefcase, GraduationCap, Award, Shield, Code2, Rocket, Globe } from 'lucide-react';

function Experience() {
  const [activeTab, setActiveTab] = useState<'work' | 'education'>('work');

  const experiences = [
    {
      type: 'education',
      title: 'MSc Artificial Intelligence',
      organization: 'National College of Ireland, Dublin',
      period: 'Sep 2024 - Sep 2025',
      description: 'First Class Honours | 71.4% Overall Average | 3.1/4.0 GPA | 90 ECTS Credits',
      achievements: [
        'Programming for Artificial Intelligence: 79.1%',
        'Practicum/Thesis Project (DeepFake Detection): 77.6%',
        'AI Driven Decision Making: 76.8%',
        'Engineering and Evaluating AI: 70%',
        'Data Analytics for AI: 67.9%',
        'Machine Learning: 67.8%',
        'Also completed: Intelligent Agents, Process Automation, Data Governance & Ethics, Emerging AI Technologies',
      ],
      icon: GraduationCap,
      color: 'primary',
    },
    {
      type: 'work',
      title: 'Security Officer (Part-time)',
      organization: 'RFC Security Group, Dublin',
      period: 'Sep 2023 - Present · 2 yrs 2 mos',
      description: 'Part-time role to support MSc studies financially while enhancing attention to detail, situational awareness, and effective communication.',
      achievements: [
        'Successfully balanced full-time MSc studies with part-time security work',
        'Managed various security protocols ensuring premises safety and security',
        'Enhanced skills in attention to detail and situational awareness',
        'Maintained high performance in both professional and academic responsibilities',
        'Developed strong time management and multitasking capabilities',
      ],
      icon: Shield,
      color: 'accent',
      className: 'opacity-60', // visually smaller/greyed out
    },
    {
      type: 'work',
      title: 'System Operations Engineer (Contractor)',
      organization: 'NDA Client (EU)',
      period: 'Sep 2022 - Oct 2025 · 3 yrs 2 mos',
      description: 'Independent SysOps/CloudOps engineer operating Microsoft-based environments end to end. Client details withheld under Non-Disclosure Agreement.',
      achievements: [
        'Manage and harden Entra ID (Azure AD), Intune, Azure, and Windows 365 Cloud PC',
        'Design and enforce Intune configuration & compliance policies and security baselines',
        'Implement Conditional Access & MFA (device trust and risk-/session-based controls)',
        'Automate operations with PowerShell (inventory, reporting, Autopilot, patch flows)',
        'Oversee VDI operations and optimize user experience and performance',
        'Proactive patch management and system health monitoring with root-cause analysis',
        'Configure Google Workspace policies and secure interop with Microsoft 365',
        'Produce runbooks, documentation, and SOPs focused on security and scalability',
      ],
      icon: Briefcase,
      color: 'primary',
    },
    {
      type: 'work',
      title: 'Junior Python Developer',
      organization: 'Art-In Systems, Turkey',
      period: 'Jun 2022 - Mar 2023 · 10 mos',
      description: 'Developed enterprise dashboards and data processing solutions for 100+ customers using Django and Oracle DB.',
      achievements: [
        'Built comprehensive dashboard control panels for 100+ customers and administrators',
        'Enhanced data processing efficiency by 40% using Selenium, Beautiful Soup, and Pandas',
        'Optimized MySQL queries for improved data retrieval and management',
        'Implemented automated data extraction and ETL pipelines',
        'Conducted exploratory data analysis for business decision-making',
        'Worked with Oracle DB and PostgreSQL for secure data storage',
      ],
      icon: Code2,
      color: 'secondary',
    },
    {
      type: 'work',
      title: 'Junior Back End Developer (Internship)',
      organization: 'Atolla, Turkey',
      period: 'Feb 2022 - May 2022 · 4 mos',
      description: 'Optimized backend performance using multithreading and implemented ETL processes with focus on scalability.',
      achievements: [
        'Reduced page loading times by 45% through multithreading optimization',
        'Gained expertise in Struts Framework and MVC architecture',
        'Implemented security measures and data protection protocols',
        'Collaborated with team of 5 to deliver solutions resulting in 1,000+ new subscribers',
        'Developed and executed ETL data processing scripts',
        'Conducted statistical analysis on user behavior patterns',
      ],
      icon: Briefcase,
      color: 'primary',
    },
    {
      type: 'work',
      title: 'Start-up Owner',
      organization: 'FlyBee Delivery',
      period: '2021 - 2022 · 1 yr',
      description: 'Founded and led aviation delivery start-up focusing on UAV courier solutions. Project suspended due to regulatory challenges under Turkish aviation laws.',
      achievements: [
        'Developed robust business model tailored to aviation delivery industry',
        'Built and led diverse team fostering innovation culture',
        'Implemented TensorFlow, AI, and ML for operational efficiency',
        'Conducted financial analysis and account management',
        'Navigated legal and regulatory challenges in aviation sector',
        'Obtained IHA-1 Drone Pilot License for operational expertise',
      ],
      icon: Rocket,
      color: 'accent',
    },
    {
      type: 'education',
      title: 'BSc Software Engineering',
      organization: 'National Technical University of Ukraine (KPI)',
      period: 'Sep 2019 - Jun 2023',
      description: 'Graduated with exceptional academic performance. Member of DSC KPI (Developer Student Club).',
      achievements: [
        'Achieved outstanding 93.4/100 grade (3.96/4.0 GPA)',
        'Active member of Developer Student Club (DSC KPI)',
        'Built strong foundation in algorithms and data structures',
        'Developed expertise in OOP, software design patterns, and architecture',
        'Gained proficiency in Python, C++, Django, Flask, AWS, and R',
      ],
      icon: Award,
      color: 'secondary',
    },
  ];

  const workExperiences = experiences.filter(exp => exp.type === 'work');
  const educationExperiences = experiences.filter(exp => exp.type === 'education');

  const achievementsBar = [
    { text: 'First Class Honours · MSc AI', icon: GraduationCap },
    { text: 'Published Researcher · Springer CCIS 2025', icon: Award },
    { text: '3+ Years Enterprise Engineering', icon: Briefcase },
    { text: 'Startup Founder · AI/Drone Tech', icon: Rocket }
  ];

  const renderCard = (exp: typeof experiences[0], index: number) => {
    const Icon = exp.icon;
    const colorClasses = {
      primary: {
        from: 'from-primary/20',
        to: 'to-primary/5',
        border: 'border-primary/30',
        text: 'text-primary',
        bg: 'bg-primary/10'
      },
      secondary: {
        from: 'from-secondary/20',
        to: 'to-secondary/5',
        border: 'border-secondary/30',
        text: 'text-secondary',
        bg: 'bg-secondary/10'
      },
      accent: {
        from: 'from-accent/20',
        to: 'to-accent/5',
        border: 'border-accent/30',
        text: 'text-accent',
        bg: 'bg-accent/10'
      },
    };

    const colors = colorClasses[exp.color as keyof typeof colorClasses];
    const cardClassName = exp.className ? exp.className : '';

    return (
      <div key={index} className={`relative group w-full ${cardClassName}`}>
        {/* Content card */}
        <div className="relative liquid-glow w-full">
          <div className={`absolute -inset-2 bg-gradient-to-br ${colors.from} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          {/* Padding 20px -> p-5 */}
          <div className={`relative p-5 rounded-3xl frosted-glass border ${colors.border} liquid-shimmer transition-all duration-300 hover:scale-[1.01] w-full flex flex-row gap-5`}>

            {/* Icon (Left side inside card, 40px square -> w-10 h-10, rounded) */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shadow-md`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 flex flex-col items-start text-left">
              {/* Header & Date */}
              <div className="w-full flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  {/* Title: 15px, font-weight 600 */}
                  <h3 className="text-[15px] font-semibold text-foreground break-words text-left">
                    {exp.title}
                  </h3>
                  {/* Company: accent color, 13px */}
                  <p className={`text-[13px] font-medium text-primary break-words text-left`}>
                    {exp.organization}
                  </p>
                </div>
                {/* Date badge: top right corner, small (11px) */}
                <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {exp.period}
                </span>
              </div>

              {/* Description: left aligned, 14px */}
              <p className="text-[14px] text-muted-foreground mb-3 leading-relaxed break-words text-left w-full">
                {exp.description}
              </p>

              {/* Achievements list: left aligned, 14px, line-height 1.5, pl-4 (16px) */}
              <ul className="space-y-1.5 w-full pl-4 list-disc marker:text-muted-foreground/50">
                {exp.achievements.map((achievement, idx) => (
                  <li key={idx} className="text-[14px] leading-relaxed text-muted-foreground break-words text-left pl-1">
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
        <div className="text-center mb-10">
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

          {/* Achievement Bar - Always visible above tabs */}
          <div className="flex flex-nowrap overflow-x-auto items-center justify-start md:justify-center gap-4 w-full mb-10 pb-4 scrollbar-hide snap-x">
            {achievementsBar.map((badge, idx) => (
              <div key={idx} className="flex snap-center shrink-0 items-center gap-2 px-4 py-2 rounded-full frosted-glass border border-primary/20 liquid-shimmer text-[12px] md:text-sm font-medium text-foreground whitespace-nowrap">
                <badge.icon className="w-4 h-4 text-primary" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Clean Pill-Style Tabs */}
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              onClick={() => setActiveTab('work')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'work'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-transparent border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Work Experience
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === 'education'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-transparent border border-border text-muted-foreground hover:text-foreground'
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
            className={`flex flex-col gap-5 transition-opacity duration-300 ease-in-out ${
              activeTab === 'work' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0'
            }`}
          >
            {workExperiences.map((exp, index) => renderCard(exp, index))}
          </div>

          {/* Education Tab */}
          <div
            className={`flex flex-col gap-5 transition-opacity duration-300 ease-in-out ${
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
