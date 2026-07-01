import { ExternalLink } from 'lucide-react';
import { Github } from './icons/brand-icons';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import type { ProjectData } from '../lib/types';

interface ProjectDetailModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  return (
    <Dialog open={!!project} onOpenChange={() => onClose()}>
      <DialogContent className="flex max-h-dialog-viewport max-w-3xl w-[calc(100%-1rem)] flex-col overflow-hidden p-0 sm:w-[calc(100%-2rem)] bg-background/95 backdrop-blur-2xl border-primary/20 shadow-2xl">
        {project && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 sm:p-6">
            <DialogHeader>
              <div className="flex items-start gap-3 sm:gap-4 mb-4 pr-8">
                {(() => {
                  const Icon = project.icon;
                  const colorClasses = {
                    primary: 'from-primary/20 to-primary/5 text-primary',
                    secondary: 'from-secondary/20 to-secondary/5 text-secondary',
                    accent: 'from-accent/20 to-accent/5 text-accent',
                  };
                  return (
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[0]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${colorClasses[project.color as keyof typeof colorClasses].split(' ')[2]}`} />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl mb-1.5 sm:mb-2 leading-tight">{project.title}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base leading-relaxed">
                    {project.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                {project.stats.map((stat, idx) => {
                  const colorClasses = {
                    primary: 'text-primary bg-primary/10 border-primary/20',
                    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
                    accent: 'text-accent bg-accent/10 border-accent/20',
                  };
                  return (
                    <span
                      key={idx}
                      className={`px-4 py-2 rounded-xl border ${colorClasses[project.color as keyof typeof colorClasses]}`}
                    >
                      {stat}
                    </span>
                  );
                })}
              </div>

              {/* Details */}
              <div>
                <h4 className="text-lg mb-3">Overview</h4>
                <p className="text-muted-foreground leading-relaxed">{project.details}</p>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-lg mb-3">Key Highlights</h4>
                <ul className="space-y-2">
                  {project.highlights.map((highlight, idx) => (
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
                  {project.tags.map((tag, idx) => (
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
              {(project.github || project.link) && (
                <div className="pt-4 space-y-3">
                  {project.github && (
                    <Button
                      size="lg"
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-black"
                    >
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-2" />
                        View on GitHub
                      </a>
                    </Button>
                  )}
                  {project.link && (
                    <Button
                      size="lg"
                      asChild
                      variant={project.github ? "outline" : "default"}
                      className={project.github ? "w-full border-secondary/40 hover:bg-secondary/10" : "w-full bg-primary hover:bg-primary/90 text-black"}
                    >
                      <a href={project.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {project.linkLabel ?? 'Try It Live'}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
