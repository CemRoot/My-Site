import { Download, FileText, Award, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

export function CV() {
  const cvHighlights = [
    {
      icon: Award,
      title: 'MSc AI - First Class',
      description: 'Advanced degree with distinction',
      color: 'primary',
    },
    {
      icon: Briefcase,
      title: '97% ML Accuracy',
      description: 'Industry-leading performance',
      color: 'secondary',
    },
    {
      icon: FileText,
      title: 'Production Systems',
      description: 'Real-world impact & deployment',
      color: 'accent',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Main Card */}
        <div className="group relative liquid-glow">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 liquid-pulse" />

          {/* Card */}
          <div className="relative p-8 sm:p-12 rounded-3xl liquid-glass-strong liquid-border">
            <div className="text-center space-y-8">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">
                  <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Download My CV
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get a detailed overview of my experience, education, skills, and projects. 
                  Available in PDF format for easy viewing and sharing.
                </p>
              </div>

              {/* Highlights */}
              <div className="grid sm:grid-cols-3 gap-4 py-6">
                {cvHighlights.map((highlight, index) => {
                  const Icon = highlight.icon;
                  const colorClasses = {
                    primary: 'text-primary bg-primary/10 border-primary/20',
                    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
                    accent: 'text-accent bg-accent/10 border-accent/20',
                  };

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-background/30 border border-white/5 backdrop-blur-sm"
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${colorClasses[highlight.color as keyof typeof colorClasses]}`} />
                      <div className="text-sm mb-1">{highlight.title}</div>
                      <div className="text-xs text-muted-foreground">{highlight.description}</div>
                    </div>
                  );
                })}
              </div>

              {/* Download Button */}
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-black rounded-2xl px-12 py-6 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Download CV (PDF)
              </Button>

              <p className="text-xs text-muted-foreground">
                Last updated: October 2025 • Size: ~250 KB
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
