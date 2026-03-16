import { Briefcase, GraduationCap, Award, Rocket, Globe, BookOpen, CheckCircle2, Server } from 'lucide-react';

function Experience() {
  return (
    <section id="experience" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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

          {/* ACHIEVEMENT BAR */}
          <div className="flex flex-nowrap overflow-x-auto pb-4 sm:pb-0 justify-start sm:justify-center gap-2 sm:gap-3 mt-10 max-w-6xl mx-auto px-2 no-scrollbar">
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-primary/50 bg-primary/10 text-primary text-[11px] sm:text-xs font-medium">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              First Class Honours · MSc AI
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-[#10b981]/50 bg-[#10b981]/10 text-[#34d399] text-[11px] sm:text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Published Researcher · Springer CCIS 2025
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-secondary/50 bg-secondary/10 text-secondary text-[11px] sm:text-xs font-medium">
              <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              3+ Years Enterprise Engineering
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-accent/50 bg-accent/10 text-accent text-[11px] sm:text-xs font-medium">
              <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Startup Founder · AI/Drone Tech
            </div>
          </div>
        </div>

        {/* LAYOUT: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN: WORK EXPERIENCE */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-foreground/90 border-b border-white/10 pb-4">
              <Briefcase className="text-primary w-6 h-6" />
              Work Experience
            </h3>

            {/* TIER 1: System Operations Engineer */}
            <div className="relative liquid-glow group">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-2xl frosted-glass border-y border-r border-white/20 border-l-[4px] border-l-[#3b82f6] hover:border-l-[#60a5fa] shadow-sm hover:shadow-[#3b82f6]/5 transition-all duration-300">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xl font-medium text-foreground">System Operations Engineer</h4>
                    <p className="text-primary mt-1">NDA Client (EU) · Remote · Contract</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full liquid-glass whitespace-nowrap">
                    Sep 2022 – Oct 2025 · 3 years
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Operated Microsoft cloud environments end-to-end for an enterprise EU client. Hardened Azure AD, automated with PowerShell, and managed VDI infrastructure at scale.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Azure', 'Entra ID', 'Intune', 'PowerShell', 'M365'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-muted-foreground border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* TIER 1: Junior Python Developer */}
            <div className="relative liquid-glow group">
              <div className="absolute -inset-2 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-2xl frosted-glass border-y border-r border-white/20 border-l-[4px] border-l-[#8b5cf6] hover:border-l-[#a78bfa] shadow-sm hover:shadow-[#8b5cf6]/5 transition-all duration-300">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xl font-medium text-foreground">Junior Python Developer</h4>
                    <p className="text-secondary mt-1">Art-In Systems · Turkey</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full liquid-glass whitespace-nowrap">
                    Jun 2022 – Mar 2023
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Built enterprise dashboards for 100+ clients using Django and Oracle DB. Improved data processing efficiency by 40%.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'Django', 'Selenium', 'MySQL', 'Oracle DB'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-muted-foreground border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* TIER 2: Compact Rows */}
            <div className="space-y-3 mt-8">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-foreground">Junior Backend Developer · Atolla</h5>
                  <p className="text-xs text-muted-foreground mt-1">45% faster page loads via multithreading · 1,000+ new subscribers delivered</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-foreground">FlyBee Delivery · Founder</h5>
                  <p className="text-xs text-muted-foreground mt-1">AI/TensorFlow drone delivery startup · suspended due to aviation regulations</p>
                </div>
              </div>
            </div>

            {/* TIER 3: Minimal Row */}
            <div className="mt-6 pl-4 border-l border-white/5 opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-white/70">Security Guard · RFC Security Group</span> — Part-time role supporting Stamp 4 residency pathway while completing MSc
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: EDUCATION */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-foreground/90 border-b border-white/10 pb-4">
              <GraduationCap className="text-accent w-6 h-6" />
              Education & Academics
            </h3>

            {/* TIER 1: MSc Artificial Intelligence */}
            <div className="relative liquid-glow group">
              <div className="absolute -inset-2 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-2xl frosted-glass border-y border-r border-white/20 border-l-[4px] border-l-[#eab308] hover:border-l-[#fde047] shadow-sm hover:shadow-[#eab308]/5 transition-all duration-300">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xl font-medium text-foreground">MSc Artificial Intelligence</h4>
                    <p className="text-accent mt-1">National College of Ireland · Dublin</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full liquid-glass whitespace-nowrap">
                    Sep 2024 – Sep 2025
                  </span>
                </div>

                <div className="mb-4 text-sm font-medium text-foreground/90">
                  Grade: First Class Honours · 71.4% Overall · GPA 3.1
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Specialized in deep learning, intelligent agents, and AI ethics. Thesis on Deepfake Detection achieved 77.6%.
                </p>

                {/* Distinct Publication Badge */}
                <div className="mb-6 inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-[#10b981]/40 bg-[#10b981]/15 text-[#6ee7b7] text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <BookOpen className="w-4 h-4 text-[#34d399]" />
                  Published · Springer CCIS · AICS 2025 · 33rd Int'l Conference
                </div>

                <div className="text-xs text-muted-foreground space-y-1.5 border-t border-white/10 pt-4">
                  <p className="font-medium text-foreground/80 mb-2">Top modules:</p>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-accent" /> Programming for AI (79.1%)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-accent" /> AI Decision Making (76.8%)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-accent" /> Machine Learning</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-accent" /> Data Analytics</div>
                </div>
              </div>
            </div>

            {/* TIER 1: BSc Software Engineering */}
            <div className="relative liquid-glow group">
              <div className="absolute -inset-2 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 rounded-2xl frosted-glass border-y border-r border-white/20 border-l-[4px] border-l-[#10b981] hover:border-l-[#34d399] shadow-sm hover:shadow-[#10b981]/5 transition-all duration-300">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xl font-medium text-foreground">BSc Software Engineering</h4>
                    <p className="text-secondary mt-1">National Technical University of Ukraine (KPI)</p>
                  </div>
                  <span className="text-xs text-muted-foreground px-3 py-1 rounded-full liquid-glass whitespace-nowrap">
                    Sep 2019 – Jun 2023
                  </span>
                </div>

                <div className="mb-3 text-sm font-medium text-foreground/90">
                  Grade: 93.4/100 · GPA 3.96/4.0
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Strong foundation in algorithms, OOP, and software architecture. Active member of Developer Student Club (DSC KPI).
                </p>

                <div className="flex flex-wrap gap-2">
                  {['Python', 'C++', 'Django', 'Flask', 'AWS'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-muted-foreground border border-white/5">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* C1 Business English Badge */}
            <div className="mt-6 flex justify-start pl-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-muted-foreground text-xs font-medium opacity-80 hover:opacity-100 transition-opacity">
                <Globe className="w-3 h-3" />
                C1 Business English
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Experience;
