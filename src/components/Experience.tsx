import { Briefcase, GraduationCap, Award, Shield, Code2, Rocket, Globe } from 'lucide-react';

function Experience() {
  const experiences = [
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
    {
      type: 'education',
      title: 'Business English Certificate (C1)',
      organization: 'Centre of English Studies (CES), Dublin',
      period: 'Jan 2024 - Aug 2024',
      description: 'Advanced (C1 Level) certification in Business English with comprehensive professional communication skills.',
      achievements: [
        'Achieved C1 (Advanced) Level certification',
        'Mastered Grammar & Structure, Lexical Development, Communication Skills',
        'Developed expertise in report writing and formal correspondence',
        'Enhanced presentation and public speaking abilities',
        'Improved cross-cultural communication in global business contexts',
      ],
      icon: Globe,
      color: 'accent',
    },
    {
      type: 'education',
      title: 'Business English (B2+)',
      organization: 'Emerald Cultural Institute, Dublin',
      period: 'May 2023 - Nov 2023',
      description: 'Upper Intermediate B2+ CEFR certification focusing on business communication and professional English.',
      achievements: [
        'Achieved B2+ (Upper Intermediate) CEFR Level',
        'Developed advanced business English communication skills',
        'Mastered business terminology and professional correspondence',
        'Enhanced ability to work in multicultural teams',
      ],
      icon: Globe,
      color: 'primary',
    },
    {
      type: 'education',
      title: 'Russian Language Preparation',
      organization: 'National Technical University of Ukraine (KPI)',
      period: '2018 - 2019',
      description: 'Intensive Russian language preparation program for university studies.',
      achievements: [
        'Achieved exceptional 95.2/100 grade',
        'Completed comprehensive language training for academic purposes',
        'Developed proficiency in Russian for technical and academic contexts',
      ],
      icon: Globe,
      color: 'secondary',
    },
  ];

  return (
    <section id="experience" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
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
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            3+ years of System Operations and Python development experience combined with First Class Honours MSc in AI
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-accent opacity-20" />

          <div className="space-y-12">
            {experiences.map((exp, index) => {
              const Icon = exp.icon;
              const colorClasses = {
                primary: 'from-primary/20 to-primary/5 border-primary/30 text-primary bg-primary/10',
                secondary: 'from-secondary/20 to-secondary/5 border-secondary/30 text-secondary bg-secondary/10',
                accent: 'from-accent/20 to-accent/5 border-accent/30 text-accent bg-accent/10',
              };

              return (
                <div key={index} className="relative pl-20 group">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 w-16 h-16 rounded-2xl ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[4]} border-2 ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[2]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[3]}`} />
                  </div>

                  {/* Content card */}
                  <div className="relative liquid-glow">
                    <div className={`absolute -inset-2 bg-gradient-to-br ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[0]} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`relative p-6 sm:p-8 rounded-3xl frosted-glass border ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[2]} liquid-shimmer transition-all duration-300 hover:scale-[1.02]`}>
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl sm:text-2xl mb-1 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            {exp.title}
                          </h3>
                          <p className={`font-medium ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[3]}`}>
                            {exp.organization}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground px-3 py-1 rounded-full liquid-glass whitespace-nowrap">
                          {exp.period}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {exp.description}
                      </p>

                      {/* Achievements */}
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${colorClasses[exp.color as keyof typeof colorClasses].split(' ')[4]} mt-2 flex-shrink-0`} />
                            <span className="leading-relaxed">{achievement}</span>
                          </li>
                        ))}
                      </ul>
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

export default Experience;
