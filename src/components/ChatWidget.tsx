import { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../lib/constants/personal';

/**
 * Configuration
 */
const WIDGET_CONFIG = {
  showDelay: 2000, // Show widget after 2 seconds
  simulatedSendDelay: 1500, // Simulate message sending delay
  initialMessages: [
    `👋 Hey! I'm ${PERSONAL_INFO.name.split(' ')[0]}, an AI Engineer and System Operations specialist based in ${PERSONAL_INFO.location.split(',')[0]}.`,
    "Looking for freelance help or want to discuss a full-time opportunity? Drop me a message below and I'll get back to you ASAP! 🚀",
  ],
} as const;

/**
 * Chat Widget Component
 * Provides a floating chat interface for quick communication
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);

  // Show widget after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), WIDGET_CONFIG.showDelay);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, WIDGET_CONFIG.simulatedSendDelay));

    toast.success('Message sent!', {
      description: "I'll respond to you as soon as possible. Check WhatsApp for faster replies!",
    });

    setFormData({ name: '', email: '', message: '' });
    setIsSending(false);
    setIsOpen(false);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (!showWidget) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="relative group">
            {/* Glow effect - reduced on mobile */}
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 sm:from-primary/30 sm:via-secondary/30 sm:to-accent/30 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-40 sm:opacity-50" />
            
            {/* Main container - much more opaque for readability */}
            <div className="relative bg-background/98 backdrop-blur-2xl border border-primary/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-white/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-mono text-black">{PERSONAL_INFO.initials}</span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{PERSONAL_INFO.name}</h3>
                      <p className="text-xs text-green-500">● Online - Usually replies in 1 hour</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/10 flex-shrink-0"
                    aria-label="Close chat"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {WIDGET_CONFIG.initialMessages.map((message, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono text-black">{PERSONAL_INFO.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl rounded-tl-sm p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm leading-relaxed">{message}</p>
                      </div>
                      {index === 0 && <p className="text-xs text-muted-foreground mt-1 ml-1">Just now</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Form */}
              <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-background/50">
                <Input
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl h-9 sm:h-10 text-sm"
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl h-9 sm:h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Your message..."
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    required
                    rows={2}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl resize-none text-sm leading-relaxed"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSending}
                    className="bg-primary hover:bg-primary/90 text-black rounded-xl h-auto w-10 sm:w-11 self-end flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Or reach me on{' '}
                  <a 
                    href={SOCIAL_LINKS.whatsapp.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    WhatsApp
                  </a>
                  {' '}for instant reply
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button - adjusted position for mobile */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-24 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20 group"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {/* Pulse ring - reduced on mobile */}
          <div className="absolute inset-0 rounded-full bg-primary/20 sm:bg-primary/30 animate-ping" />
          
          {/* Icon */}
          <div className="relative">
            {isOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            ) : (
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            )}
          </div>

          {/* Online indicator */}
          {!isOpen && (
            <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}

          {/* Tooltip - hidden on mobile, shown on desktop */}
          {!isOpen && (
            <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              <div className="px-3 py-2 rounded-xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-xl">
                <p className="text-xs text-white">💬 Chat with me - I'm online!</p>
              </div>
            </div>
          )}
        </Button>
      </div>
    </>
  );
}
