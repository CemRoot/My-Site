import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PERSONAL_INFO } from '../lib/constants/personal';

/**
 * Configuration
 */
const WIDGET_CONFIG = {
  showDelay: 2000, // Show widget after 2 seconds
  initialMessage: `👋 Hey! I'm Cem's AI assistant. Ask me anything about Cem's experience, skills, availability, or projects!`,
} as const;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * AI-Powered Chat Widget Component
 * Provides intelligent responses about Cem Koyluoglu
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: WIDGET_CONFIG.initialMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show widget after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), WIDGET_CONFIG.showDelay);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Failed to send message', {
        description: 'Please try again or contact directly via WhatsApp',
      });
      
      // Add fallback message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting right now. Please reach out directly:\n📧 ${PERSONAL_INFO.email}\n📱 WhatsApp: +353 87 344 5918`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showWidget) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 sm:from-primary/30 sm:via-secondary/30 sm:to-accent/30 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-40 sm:opacity-50" />
            
            {/* Main container */}
            <div className="relative bg-background/98 backdrop-blur-2xl border border-primary/30 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-white/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-black" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">AI Assistant</h3>
                      <p className="text-xs text-green-500">● Powered by Groq AI</p>
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
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      {msg.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-black" />
                      ) : (
                        <User className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 ${
                        msg.role === 'assistant' 
                          ? 'bg-primary/10 border border-primary/20 rounded-tl-sm' 
                          : 'bg-accent/10 border border-accent/20 rounded-tr-sm'
                      }`}>
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl rounded-tl-sm p-2.5 sm:p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="border-t border-white/10 p-3 sm:p-4 bg-background/50">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask me anything about Cem..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    disabled={isLoading}
                    rows={2}
                    className="bg-input-background border-primary/20 focus:border-primary/40 rounded-xl resize-none text-sm leading-relaxed"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-primary hover:bg-primary/90 text-black rounded-xl h-auto w-10 sm:w-11 self-end flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
                  Powered by <span className="text-primary">Groq AI</span> • Free & Fast
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-24 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20 group"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {/* Pulse ring */}
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

          {/* Tooltip */}
          {!isOpen && (
            <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              <div className="px-3 py-2 rounded-xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-xl">
                <p className="text-xs text-white">🤖 AI Assistant - Ask me anything!</p>
              </div>
            </div>
          )}
        </Button>
      </div>
    </>
  );
}
