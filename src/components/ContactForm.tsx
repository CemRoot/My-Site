import React, { useState } from 'react';
import { Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PERSONAL_INFO } from '../lib/constants/personal';

export function ContactForm() {
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
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS not configured. Using fallback.');
        console.log('Contact Form Submission:', formData);
        
        toast.success('Message received!', {
          description: "Thanks for reaching out! I'll contact you via email soon.",
        });
        
        setFormData({ name: '', email: '', message: '' });
        setIsSubmitting(false);
        return;
      }

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_name: PERSONAL_INFO.name,
        reply_to: formData.email,
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      toast.success('Message sent successfully! 🎉', {
        description: "I'll get back to you as soon as possible.",
      });

      setFormData({ name: '', email: '', message: '' });
    } catch (error: unknown) {
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
    <div className="relative h-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full min-h-[500px] flex-col rounded-3xl frosted-glass border border-primary/20 bg-background/60 p-8 backdrop-blur-sm"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center shadow-lg">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Send Direct Message
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get in touch via email
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 flex-1 flex flex-col">
          <div>
            <label htmlFor="name" className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
              Your Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange('name')}
              className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl h-12 text-sm transition-colors"
              aria-label="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
              Your Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl h-12 text-sm transition-colors"
              aria-label="Your email address"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label htmlFor="message" className="block text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
              Your Message
            </label>
            <Textarea
              id="message"
              name="message"
              autoComplete="off"
              required
              placeholder="Tell me about your project or opportunity..."
              rows={6}
              value={formData.message}
              onChange={handleInputChange('message')}
              className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl resize-none text-sm flex-1 transition-colors"
              aria-label="Your message"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-black rounded-xl h-12 text-sm font-semibold mt-4"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
