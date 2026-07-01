import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Github } from './icons/brand-icons';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SOCIAL_LINKS } from '../lib/constants/personal';
import { PROJECTS } from '../lib/constants/projects';
import { ProjectDetailModal } from './ProjectDetailModal';

function Projects() {
  const [selectedProject, setSelectedProject] = useState<typeof PROJECTS[number] | null>(null);

  return (
    <section id="projects" className="relative py-16 sm:py-20 md:py-32 overflow-x-hidden px-4 sm:px-6 lg:px-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 items-stretch">
          {PROJECTS.map((project, index) => {
            const Icon = project.icon;
            const colorClasses = {
              primary: 'from-primary/20 to-primary/5 border-primary/20 group-hover:border-primary/40 text-primary',
              secondary: 'from-secondary/20 to-secondary/5 border-secondary/20 group-hover:border-secondary/40 text-secondary',
              accent: 'from-accent/20 to-accent/5 border-accent/20 group-hover:border-accent/40 text-accent',
            };

            return (
              <div
                key={index}
                className="group relative liquid-glow cursor-pointer h-full min-h-0 flex flex-col"
                onClick={() => setSelectedProject(project)}
              >
                {/* Glow effect */}
                <div className={`absolute -inset-2 bg-gradient-to-br ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[0]} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Card — uniform min-height so short copy (e.g. thesis card) aligns with peers in the row */}
                <div
                  className={`relative p-5 sm:p-8 rounded-2xl sm:rounded-3xl frosted-glass transition-all duration-500 min-h-[22rem] md:min-h-[24rem] flex flex-col flex-1 liquid-border liquid-shimmer hover:scale-[1.02] ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[1]} ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[2]}`}
                >
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[0]} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg flex-shrink-0`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[3]}`} />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="text-xl sm:text-2xl mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-none flex-1 min-h-[4.5rem] sm:min-h-0">
                    {project.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                    {project.stats.map((stat, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 sm:px-3 py-1 rounded-full liquid-glass ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[3]}`}
                      >
                        {stat}
                      </span>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
                    {project.tags.slice(0, 5).map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-muted-foreground/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 5 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-muted-foreground/20"
                      >
                        +{project.tags.length - 5}
                      </Badge>
                    )}
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
            <a href={SOCIAL_LINKS.github.url} target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2" />
              View All Projects on GitHub
            </a>
          </Button>
        </div>
      </div>

      <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}

export default Projects;
