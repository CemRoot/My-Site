import { MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { CONTACT_METHODS, AVAILABILITY_STATUS } from '../lib/constants/contact';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../lib/constants/personal';
import { getColorClasses } from '../lib/utils/classNames';
import { ContactForm } from './ContactForm';

export function Contact() {

  return (
    <section id="contact" className="relative py-16 sm:py-24 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-accent/30 liquid-shimmer">
                <span className="text-sm font-mono text-accent tracking-wider">LET'S CONNECT</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="block bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent mb-2">
              Start a Conversation
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you have a <span className="text-primary font-medium">freelance project</span>, 
            <span className="text-secondary font-medium"> full-time opportunity</span>, or just want to 
            <span className="text-accent font-medium"> chat about tech</span> - I'm here and ready to connect.
          </p>
          
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full frosted-glass border border-green-500/20 bg-green-500/5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-400">
                Available for freelance projects & full-time opportunities
              </span>
            </div>
          </div>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,_1fr)] items-stretch mb-12">
          {CONTACT_METHODS.map((method, index) => {
            const Icon = method.icon;
            const colors = getColorClasses(method.color);

            return (
              <a
                key={index}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-label={`${method.label}: ${method.cta}`}
                className="group relative block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30"
              >
                <div
                  className={`relative flex h-full min-h-[200px] flex-col rounded-3xl frosted-glass border ${colors.border} bg-background/60 p-6 backdrop-blur-sm`}
                >
                  {/* Header with Icon and Badge */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className={`w-7 h-7 ${colors.text}`} />
                    </div>
                    {method.featured && (
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border ${colors.border} ${colors.text} bg-gradient-to-br ${colors.bg} flex-shrink-0 uppercase`}>
                        Fast lane
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {method.label}
                  </p>

                  {/* Value */}
                  <p className={`text-lg font-semibold ${colors.text} leading-tight mb-3 break-words`} title={method.value}>
                    {method.value}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                    {method.description}
                  </p>

                  {/* Footer with Meta and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-current/10">
                    <span className="text-xs text-muted-foreground">{method.meta}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide ${colors.text}`}>
                      {method.cta}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.618fr_1fr] items-stretch">
          <ContactForm />

          {/* Quick Connect Column */}
          <div className="flex h-full flex-col gap-6">
            {/* WhatsApp CTA */}
            <div className="relative flex-1 min-h-[240px]">
              <div className="relative flex h-full flex-col rounded-3xl frosted-glass border border-accent/20 bg-background/60 p-6 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/25 to-accent/5 flex items-center justify-center shadow-lg flex-shrink-0">
                    <MessageCircle className="w-7 h-7 text-accent" />
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide border border-accent/30 text-accent bg-accent/10 uppercase">
                    Fast Response
                  </span>
                </div>

                {/* Content */}
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Quick Response
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Reply within 1 hour
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                  Need an immediate response? Chat with me directly on WhatsApp. Perfect for quick questions 
                  or urgent inquiries.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-black rounded-xl h-12 text-sm font-semibold"
                >
                  <a href={SOCIAL_LINKS.whatsapp.url} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Availability Card */}
            <div className="relative flex-1 min-h-[200px]">
              <div className="relative flex h-full flex-col rounded-3xl frosted-glass border border-primary/20 bg-background/60 p-6 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Current Availability</h3>
                </div>

                {/* Status List */}
                <div className="space-y-3 flex-1 mb-4">
                  {AVAILABILITY_STATUS.map((status, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        index === 0 ? 'bg-green-500 animate-pulse' :
                        index === 1 ? 'bg-primary' :
                        index === 2 ? 'bg-secondary' :
                        'bg-accent'
                      }`} />
                      <span className="text-sm text-muted-foreground">{status.label}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Info */}
                <div className="pt-4 border-t border-current/10 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    📍 Based in {PERSONAL_INFO.location} (EU timezone)
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ⏰ Response time: Usually within {PERSONAL_INFO.availability.responseTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
