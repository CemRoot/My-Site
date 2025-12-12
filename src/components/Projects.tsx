import { useState } from 'react';
import { ExternalLink, Github, Eye, Database, Bot, Plane, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';

function Projects() {
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);

  const projects = [
    {
      title: 'DeepFake Detection Framework',
      description: 'MSc Dissertation: Novel deep learning framework using Attention-Enhanced EfficientNetB7 achieving 97% accuracy on 10,000+ synthetic images.',
      icon: Eye,
      tags: ['Python', 'TensorFlow', 'CNN', 'Flask', 'Machine Learning'],
      color: 'primary',
      stats: ['97% Accuracy', '10K+ Images', 'Real-time Prediction'],
      details: 'Developed a comprehensive deep learning framework for deepfake detection as part of my MSc dissertation. Conducted statistical analysis, feature engineering, and hyperparameter tuning on a dataset of over 10,000 synthetic images.',
      highlights: [
        'Achieved 97% classification accuracy through advanced CNN architecture',
        'Evaluated multiple ML models: CNN, SVM, Random Forest',
        'Performed comprehensive statistical analysis and cross-validation',
        'Built Flask web application for real-time prediction',
        'Applied feature engineering and model performance analysis',
        'GitHub: github.com/CemRoot/FlaskWebApp',
      ],
      github: 'https://github.com/CemRoot/FlaskWebApp',
    },
    {
      title: 'Ireland Expat Assistant',
      description: 'AI-powered assistant for expats in Ireland, providing step-by-step guidance on visa/IRP, tax (PAYE/PRSI/USC), healthcare (HSE/Medical Card), social welfare, and citizenship processes.',
      icon: Globe,
      tags: ['ChatGPT', 'GPT', 'NLP', 'RAG', 'Immigration', 'Irish Tax', 'Healthcare'],
      color: 'secondary',
      stats: ['IRP Renewal Guide', 'Tax & Budget Updates', 'Healthcare Guidance'],
      details: 'Ireland Expat Assistant provides practical, official-source-based guidance for people who have moved to or are planning to move to Ireland. It summarizes IRP card renewals, stamp permits, work permits (General/Critical Skills), tax system (PAYE, PRSI, USC, tax credits), budget changes like rent tax credit, Medical Card/GP Visit Card applications, social supports, and citizenship application requirements in an understandable way. The assistant references official uploaded documents when possible, providing checklists, required documents, and critical points to watch out for. (For informational purposes only; not legal/financial advice.)',
      highlights: [
        'IRP Renewal: Clarifies which documents to upload by stamp type, helping reduce delays',
        'Employment Permits: Provides checklist-based document/condition tracking for General and Critical Skills applications',
        'Tax & Budget Changes: Summarizes updates like Rent Tax Credit extension and USC adjustments clearly',
        'Medical Card/GP Visit Card: Explains application steps, required evidence/documents, and assessment framework',
        'Citizenship Application: Guides on residence proof "points" logic and common mistakes leading to rejection',
        'Family Reunification: Frames the policy framework and assessment approach clearly',
      ],
      link: 'https://chatgpt.com/g/g-693c3f003b308191a3aa51cf1e75e47e-ireland-expat-assistant',
    },
    {
      title: 'Automated Data Analysis System',
      description: 'Python-based system for automated data collection, cleaning, and analysis reducing manual processing time by 60%.',
      icon: Database,
      tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Visualization'],
      color: 'secondary',
      stats: ['60% Time Saved', 'Automated Workflows', 'Visual Dashboards'],
      details: 'Built a comprehensive automated data analysis system implementing statistical analysis workflows and data visualization dashboards for efficient data processing.',
      highlights: [
        'Reduced manual data processing time by 60%',
        'Implemented automated data collection and cleaning pipelines',
        'Created interactive dashboards using Matplotlib',
        'Applied statistical analysis and data visualization techniques',
        'Automated report generation and insights delivery',
      ],
    },
    {
      title: 'Customer Dashboard Platform',
      description: 'Enterprise Django application with Oracle DB serving 100+ customers with comprehensive dashboards and control panels.',
      icon: Bot,
      tags: ['Django', 'Oracle DB', 'PostgreSQL', 'REST API', 'Web Scraping'],
      color: 'accent',
      stats: ['100+ Customers', '40% Efficiency Gain', 'Enterprise Scale'],
      details: 'Developed comprehensive dashboards and control panels for over 100 customers at Art-In Systems, enhancing data presentation and accessibility with enterprise-grade solutions.',
      highlights: [
        'Built scalable dashboards for 100+ customers using Django',
        'Enhanced data processing efficiency by 40% with Selenium & Beautiful Soup',
        'Optimized MySQL queries for improved data retrieval',
        'Implemented automated data extraction and ETL pipelines',
        'Conducted exploratory data analysis for business insights',
        'Worked with Oracle DB and PostgreSQL for secure data storage',
      ],
    },
    {
      title: 'FlyBee Drone Courier',
      description: 'Aviation start-up project leveraging UAV technology for rotary-wing courier services. Suspended due to Turkish Aviation Laws.',
      icon: Plane,
      tags: ['TensorFlow', 'AI', 'Business Development', 'Aviation Tech'],
      color: 'primary',
      stats: ['Start-up Owner', 'Jan 2021 - Dec 2022', 'Innovation Focus'],
      details: 'Led FlyBee Delivery from concept to execution, focusing on innovative UAV courier solutions. Developed business models, built diverse teams, and implemented advanced AI technologies.',
      highlights: [
        'Developed robust business model for aviation delivery industry',
        'Led diverse team fostering innovation culture',
        'Implemented TensorFlow, AI, and ML for operational efficiency',
        'Conducted financial analysis and account management',
        'Navigated complex aviation regulatory landscape',
        'Project suspended due to Turkish aviation law challenges',
      ],
    },
  ];

  return (
    <section id="projects" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-accent to-secondary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-secondary/30 liquid-shimmer">
                <span className="text-sm font-mono text-secondary tracking-wider">FEATURED PROJECTS</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-secondary to-foreground bg-clip-text text-transparent">
              Real-World Impact
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From AI-powered deepfake detection to enterprise data platforms, here are some of the projects 
            I've built that deliver measurable results
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {projects.map((project, index) => {
            const Icon = project.icon;
            const colorClasses = {
              primary: 'from-primary/20 to-primary/5 border-primary/20 group-hover:border-primary/40 text-primary',
              secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 group-hover:border-secondary/40 text-secondary',
              accent: 'from-accent/20 to-accent/5 border-accent/20 group-hover:border-accent/40 text-accent',
            };

            return (
              <div
                key={index}
                className="group relative liquid-glow cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                {/* Glow effect */}
                <div className={`absolute -inset-2 bg-gradient-to-br ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[0]} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Card */}
                <div className={`relative p-8 rounded-3xl frosted-glass transition-all duration-500 h-full liquid-border liquid-shimmer hover:scale-[1.02] ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[1]} ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[2]}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[0]} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <Icon className={`w-7 h-7 ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[3]}`} />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="text-2xl mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.stats.map((stat, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-3 py-1 rounded-full liquid-glass ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[3]}`}
                      >
                        {stat}
                      </span>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-muted-foreground/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Projects CTA */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            asChild
            className="group relative overflow-hidden border-primary/20 hover:border-primary/40 rounded-2xl px-8 backdrop-blur-sm bg-primary/5 hover:bg-primary/10 transition-all duration-300"
          >
            <a href="https://github.com/CemRoot" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              View All Projects on GitHub
            </a>
          </Button>
        </div>
      </div>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-primary/20 shadow-2xl">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  {(() => {
                    const Icon = selectedProject.icon;
                    const colorClasses = {
                      primary: 'from-primary/20 to-primary/5 text-primary',
                      secondary: 'from-secondary/20 to-secondary/5 text-secondary',
                      accent: 'from-accent/20 to-accent/5 text-accent',
                    };
                    return (
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[selectedProject.color as keyof typeof colorClasses].split(' ')[0]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${colorClasses[selectedProject.color as keyof typeof colorClasses].split(' ')[2]}`} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl sm:text-2xl md:text-3xl mb-1.5 sm:mb-2 leading-tight">{selectedProject.title}</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base leading-relaxed">
                      {selectedProject.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                  {selectedProject.stats.map((stat, idx) => {
                    const colorClasses = {
                      primary: 'text-primary bg-primary/10 border-primary/20',
                      secondary: 'text-secondary bg-secondary/10 border-secondary/20',
                      accent: 'text-accent bg-accent/10 border-accent/20',
                    };
                    return (
                      <span
                        key={idx}
                        className={`px-4 py-2 rounded-xl border ${colorClasses[selectedProject.color as keyof typeof colorClasses]}`}
                      >
                        {stat}
                      </span>
                    );
                  })}
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-lg mb-3">Overview</h4>
                  <p className="text-muted-foreground leading-relaxed">{selectedProject.details}</p>
                </div>

                {/* Highlights */}
                <div>
                  <h4 className="text-lg mb-3">Key Highlights</h4>
                  <ul className="space-y-2">
                    {selectedProject.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div>
                  <h4 className="text-lg mb-3">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-muted-foreground/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Project Links */}
                {(selectedProject.github || selectedProject.link) && (
                  <div className="pt-4 space-y-3">
                    {selectedProject.github && (
                      <Button
                        size="lg"
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-black"
                      >
                        <a href={selectedProject.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          View on GitHub
                        </a>
                      </Button>
                    )}
                    {selectedProject.link && (
                      <Button
                        size="lg"
                        asChild
                        variant={selectedProject.github ? "outline" : "default"}
                        className={selectedProject.github ? "w-full border-secondary/40 hover:bg-secondary/10" : "w-full bg-primary hover:bg-primary/90 text-black"}
                      >
                        <a href={selectedProject.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Try It Live
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default Projects;
