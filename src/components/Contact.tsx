import { useState } from 'react';
import { Mail, Send, MessageCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { CONTACT_METHODS, AVAILABILITY_STATUS } from '../lib/constants/contact';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../lib/constants/personal';
import { getColorClasses } from '../lib/utils/classNames';

/**
 * Contact Section Component
 * Provides multiple ways to get in touch
 */
export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // EmailJS configuration
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      // Check if EmailJS is configured
      if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS not configured. Using fallback.');
        
        // Fallback: Log to console (for testing)
        console.log('Contact Form Submission:', formData);
        
        toast.success('Message received!', {
          description: "Thanks for reaching out! I'll contact you via email soon.",
        });
        
        setFormData({ name: '', email: '', message: '' });
        setIsSubmitting(false);
        return;
      }

      // Send email via EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_name: PERSONAL_INFO.name,
        reply_to: formData.email,
      };

      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      toast.success('Message sent successfully! 🎉', {
        description: "I'll get back to you as soon as possible.",
      });

      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      console.error('EmailJS Error:', error);
      toast.error('Failed to send message', {
        description: 'Please try again or contact me via WhatsApp.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <section id="contact" className="relative py-16 sm:py-24 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="px-4 py-1.5 rounded-full frosted-glass border border-accent/20">
              <span className="text-xs font-mono text-accent tracking-wider">LET'S CONNECT</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4 text-foreground font-semibold">
            Start a Conversation
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-3">
            Whether you have a freelance project, full-time opportunity, or just want to chat about tech - 
            I'm here and ready to connect
          </p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500">
              Available for freelance projects & full-time opportunities
            </span>
          </div>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(0,_1fr)] items-stretch mb-12">
          {CONTACT_METHODS.map((method, index) => {
            const Icon = method.icon;
            const colors = getColorClasses(method.color);

            return (
              <a
                key={index}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group relative h-full"
              >
                {method.featured && (
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-accent via-primary to-secondary opacity-30 blur-[18px] transition-opacity duration-500 group-hover:opacity-60" />
                )}
                <div
                  className={`relative flex h-full flex-col justify-between rounded-2xl p-5 border ${colors.border} frosted-glass transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {method.label}
                        </h3>
                        <p className={`text-sm font-semibold leading-relaxed ${colors.text} break-words`}>
                          {method.value}
                        </p>
                      </div>
                    </div>
                    {method.featured && (
                      <span className="px-2 py-1 rounded-full bg-accent/15 text-accent text-[10px] font-semibold tracking-wide">
                        Fast
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.618fr_1fr] items-stretch">
          {/* Contact Form */}
          <div className="relative group h-full">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <form onSubmit={handleSubmit} className="relative p-6 rounded-2xl liquid-glass-strong liquid-border h-full flex flex-col">
              <h3 className="text-xl mb-4 text-foreground font-medium">
                Send Direct Message
              </h3>
              <div className="space-y-3 flex-1">
                <div>
                  <label htmlFor="name" className="block text-xs mb-1.5 text-muted-foreground">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-lg h-10 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs mb-1.5 text-muted-foreground">
                    Your Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-lg h-10 text-sm"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="message" className="block text-xs mb-1.5 text-muted-foreground">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    required
                    placeholder="Tell me about your project or opportunity..."
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-lg resize-none text-sm flex-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-black rounded-lg h-10 text-sm group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Connect Column */}
          <div className="flex h-full flex-col gap-4">
            {/* WhatsApp CTA */}
            <div className="relative group flex-[1.618] min-h-[220px]">
              <div className="absolute -inset-1 bg-gradient-to-br from-accent/30 via-primary/30 to-secondary/30 rounded-2xl blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative flex h-full flex-col rounded-2xl liquid-glass-strong border border-accent/30 liquid-shimmer p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium">Quick Response</h3>
                    <p className="text-xs text-muted-foreground">Reply within 1 hour</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  Need an immediate response? Chat with me directly on WhatsApp. Perfect for quick questions 
                  or urgent inquiries.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-black rounded-lg h-10 text-sm"
                >
                  <a href={SOCIAL_LINKS.whatsapp.url} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Availability Card */}
            <div className="relative group flex-1 min-h-[200px]">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative flex h-full flex-col rounded-2xl liquid-glass-strong border border-primary/20 p-6">
                <h3 className="text-base font-medium mb-3">Current Availability</h3>
                <div className="space-y-2 flex-1">
                  {AVAILABILITY_STATUS.map((status, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        index === 0 ? 'bg-green-500 animate-pulse' :
                        index === 1 ? 'bg-primary' :
                        index === 2 ? 'bg-secondary' :
                        'bg-accent'
                      }`} />
                      <span className="text-xs">{status.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-muted-foreground leading-relaxed space-y-1">
                  <p>📍 Based in {PERSONAL_INFO.location} (EU timezone)</p>
                  <p>⏰ Response time: Usually within {PERSONAL_INFO.availability.responseTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
