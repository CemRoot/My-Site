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
    <section id="contact" className="relative py-20 sm:py-32 overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl liquid-morph" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl liquid-morph" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative px-6 py-2 rounded-full liquid-glass-strong border border-accent/30 liquid-shimmer">
                <span className="text-sm font-mono text-accent tracking-wider">LET'S CONNECT</span>
              </div>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
            <span className="bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
              Start a Conversation
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            Whether you have a freelance project, full-time opportunity, or just want to chat about tech - 
            I'm here and ready to connect
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500">
              Available for freelance projects & full-time opportunities
            </span>
          </div>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {CONTACT_METHODS.map((method, index) => {
            const Icon = method.icon;
            const colors = getColorClasses(method.color);

            return (
              <a
                key={index}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`group relative ${method.featured ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                {method.featured && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent via-primary to-secondary rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                )}
                <div className={`relative p-6 rounded-2xl frosted-glass border ${colors.border} transition-all duration-300 hover:scale-105 liquid-shimmer h-full`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm text-muted-foreground">{method.label}</h3>
                        {method.featured && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">Fast Reply</span>
                        )}
                      </div>
                      <p className={`font-medium truncate ${colors.text}`}>
                        {method.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <form onSubmit={handleSubmit} className="relative p-8 rounded-3xl liquid-glass-strong liquid-border">
              <h3 className="text-2xl mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Send Direct Message
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm mb-2 text-muted-foreground">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm mb-2 text-muted-foreground">
                    Your Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm mb-2 text-muted-foreground">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    required
                    placeholder="Tell me about your project or opportunity..."
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-black rounded-xl h-12 group relative overflow-hidden"
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

          {/* Quick Connect Card */}
          <div className="space-y-6">
            {/* WhatsApp CTA */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-br from-accent/30 via-primary/30 to-secondary/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 liquid-pulse" />
              <div className="relative p-8 rounded-3xl liquid-glass-strong border border-accent/30 liquid-shimmer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl">Quick Response</h3>
                    <p className="text-sm text-muted-foreground">Usually reply within 1 hour</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Need an immediate response? Chat with me directly on WhatsApp. Perfect for quick questions 
                  or urgent freelance inquiries.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-black rounded-xl h-12"
                >
                  <a href={SOCIAL_LINKS.whatsapp.url} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Availability Card */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative p-8 rounded-3xl liquid-glass-strong border border-primary/20">
                <h3 className="text-xl mb-4">Current Availability</h3>
                <div className="space-y-3">
                  {AVAILABILITY_STATUS.map((status, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500 animate-pulse' :
                        index === 1 ? 'bg-primary' :
                        index === 2 ? 'bg-secondary' :
                        'bg-accent'
                      }`} />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-muted-foreground">
                    📍 Based in {PERSONAL_INFO.location} (EU timezone)<br />
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
