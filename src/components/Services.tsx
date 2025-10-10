import { Brain, Cloud, Cpu, Database, Bot, BarChart3 } from 'lucide-react';
import { SERVICES } from '../lib/constants/services';
import { getColorClasses } from '../lib/utils/classNames';
import type { ServiceItem } from '../lib/types';

/**
 * Service Card Component
 * Displays individual service offering with skills
 */
interface ServiceCardProps extends ServiceItem {
  icon: React.ElementType;
}

function ServiceCard({ icon: Icon, title, description, skills, color, featured }: ServiceCardProps) {
  const colors = getColorClasses(color);

  return (
    <div className={`group relative ${featured ? 'lg:col-span-2' : ''}`}>
      {featured && (
        <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 liquid-pulse" />
      )}
      <div className={`relative p-8 rounded-3xl liquid-glass-strong border ${colors.border} transition-all duration-300 hover:scale-105 liquid-shimmer h-full`}>
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-2xl ${colors.text}`}>{title}</h3>
              {featured && (
                <span className="px-2 py-1 rounded-lg bg-accent/20 text-accent text-xs border border-accent/30">
                  Featured
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className={`px-3 py-1.5 rounded-lg text-xs border ${colors.badge} transition-transform duration-200 hover:scale-105`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Services Section Component
 * Showcases all service offerings and expertise areas
 */
export function Services() {
  const servicesWithIcons = [
    { ...SERVICES[0], icon: Brain },
    { ...SERVICES[1], icon: Cloud },
    { ...SERVICES[2], icon: Cpu },
    { ...SERVICES[3], icon: Bot },
    { ...SERVICES[4], icon: Database },
    { ...SERVICES[5], icon: BarChart3 },
  ];

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-accent to-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-secondary/30 liquid-shimmer">
                <span className="text-sm font-mono text-secondary tracking-wider">SERVICES & EXPERTISE</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-secondary to-foreground bg-clip-text text-transparent">
              What I Offer
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI and cloud solutions tailored to your business needs - from concept to deployment
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {servicesWithIcons.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="relative group max-w-4xl mx-auto">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="relative p-8 rounded-3xl liquid-glass-strong border border-primary/30 text-center">
            <h3 className="text-2xl mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Ready to Build Something Amazing?
            </h3>
            <p className="text-muted-foreground mb-6">
              Whether you need a custom AI solution, cloud migration, or system automation - I'm here to help turn your vision into reality.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#contact"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
              >
                Start a Project
              </a>
              <a
                href="https://wa.me/353873445918"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl liquid-glass-strong border border-accent/30 text-accent hover:border-accent/50 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
              >
                Quick Consultation
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
