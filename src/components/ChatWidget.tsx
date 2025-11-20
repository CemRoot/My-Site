import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { PERSONAL_INFO } from '../lib/constants/personal';
import { usePageContext } from '../lib/context/PageContext';

/**
 * Configuration
 */
const WIDGET_CONFIG = {
  showDelay: 2000, // Show widget after 2 seconds
  initialMessage: `👋 Hey! I'm Cem's AI assistant. Ask me anything about Cem, his work, or this website!`,
  offTopicThreshold: 5, // Allow 5 off-topic questions before warning
} as const;

const BLOCK_DURATION_MS = 5 * 60 * 1000;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type TopicTag = 'cem' | 'off_topic';

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseAssistantReply = (reply: string): { topic: TopicTag; content: string } => {
  const topicPattern = /^\s*\[TOPIC:(CEM|OFF_TOPIC)\]\s*/i;
  const match = reply.match(topicPattern);

  if (!match) {
    return {
      topic: 'cem',
      content: reply.trim(),
    };
  }

  const topic = match[1].toUpperCase() === 'OFF_TOPIC' ? 'off_topic' : 'cem';
  const content = reply.replace(topicPattern, '').trimStart();

  return { topic, content };
};

interface ChatWidgetProps {
  showNewsNotification?: boolean;
}

/**
 * AI-Powered Chat Widget Component
 * Provides intelligent responses about Cem Koyluoglu
 */
function ChatWidget({ showNewsNotification = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
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
  const { pageInfo } = usePageContext();
  const [offTopicCount, setOffTopicCount] = useState(0);
  const [awaitingRelevantQuestion, setAwaitingRelevantQuestion] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const now = Date.now();
  const isChatBlocked = blockedUntil !== null && blockedUntil > now;
  const remainingBlockMinutes = isChatBlocked
    ? Math.max(1, Math.ceil((blockedUntil - now) / 60000))
    : 0;

  // Show widget after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), WIDGET_CONFIG.showDelay);
    return () => clearTimeout(timer);
  }, []);

  // News notification timing logic
  useEffect(() => {
    if (!showNewsNotification) return;

    // Show notification after 4 seconds
    const showTimer = setTimeout(() => {
      setShowNotification(true);
    }, 4000);

    // Hide notification after 24 seconds (4s delay + 20s display)
    const hideTimer = setTimeout(() => {
      setShowNotification(false);
    }, 24000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [showNewsNotification]);

  // Hide notification when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowNotification(false);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when messages change (like Deep Chat)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-focus textarea when chat opens
  useEffect(() => {
    if (isOpen && !isChatBlocked) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isChatBlocked]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const attemptTimestamp = Date.now();
    if (blockedUntil && attemptTimestamp >= blockedUntil) {
      setBlockedUntil(null);
      setOffTopicCount(0);
      setAwaitingRelevantQuestion(false);
    } else if (blockedUntil && attemptTimestamp < blockedUntil) {
      toast.warning('Chat temporarily closed', {
        description: 'Please wait a few minutes or ask about Cem\'s work.',
      });
      // Refocus after showing error
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return;
    }

    const userMessage: Message = {
      id: createMessageId(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    };

    // Clear input immediately for better UX
    setInputMessage('');
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          pageContext: pageInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const rawReply = typeof data.reply === 'string' ? data.reply : '';
      const { topic, content } = parseAssistantReply(rawReply);

      const assistantMessage: Message = {
        id: createMessageId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      let nextOffTopicCount = offTopicCount;
      let issueWarning = false;
      let enforceBlock = false;

      if (topic === 'off_topic') {
        const potentialCount = offTopicCount + 1;
        if (awaitingRelevantQuestion) {
          enforceBlock = true;
          nextOffTopicCount = 0;
        } else {
          nextOffTopicCount = potentialCount;
          if (potentialCount >= WIDGET_CONFIG.offTopicThreshold) {
            issueWarning = true;
          }
        }
      } else {
        nextOffTopicCount = 0;
      }

      const outgoingMessages: Message[] = [assistantMessage];

      if (issueWarning) {
        outgoingMessages.push({
          id: createMessageId(),
          role: 'assistant',
          content:
            "⚠️ Friendly reminder: I'm specifically designed to help with questions about Cem Koyluoglu and this website. Please ask relevant questions or I'll need to temporarily close the chat. Thanks for understanding! 😊",
          timestamp: new Date(),
        });
      }

      if (enforceBlock) {
        const blockTimestamp = Date.now() + BLOCK_DURATION_MS;
        setBlockedUntil(blockTimestamp);
        outgoingMessages.push({
          id: createMessageId(),
          role: 'assistant',
          content:
            '🔒 Chat temporarily closed due to off-topic questions. Please come back in 5 minutes or ask questions about Cem Koyluoglu and his work. Thanks!',
          timestamp: new Date(),
        });
        toast.warning('Chat temporarily closed', {
          description: 'Come back in 5 minutes or ask about Cem\'s work to continue chatting.',
        });
      }

      setMessages((prev) => [...prev, ...outgoingMessages]);
      setOffTopicCount(nextOffTopicCount);

      if (topic === 'off_topic') {
        if (issueWarning) {
          setAwaitingRelevantQuestion(true);
        } else if (enforceBlock) {
          setAwaitingRelevantQuestion(false);
        }
      } else {
        if (blockedUntil && Date.now() >= blockedUntil) {
          setBlockedUntil(null);
        }
        setAwaitingRelevantQuestion(false);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Failed to send message', {
        description: 'Please try again or contact directly via WhatsApp',
      });
      
      const fallbackMessage: Message = {
        id: createMessageId(),
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting right now. Please reach out directly:\n📧 ${PERSONAL_INFO.email}\n📱 WhatsApp: +353 87 344 5918`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      // Focus textarea after message is sent - increased timeout for reliability on both desktop and mobile
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  };

  const handleToggleChat = () => {
    const toggleTimestamp = Date.now();

    if (!isOpen) {
      if (blockedUntil && toggleTimestamp >= blockedUntil) {
        setBlockedUntil(null);
        setOffTopicCount(0);
        setAwaitingRelevantQuestion(false);
      }

      if (blockedUntil && toggleTimestamp < blockedUntil) {
        toast.warning('Chat temporarily closed', {
          description: 'Come back in a few minutes or ask about Cem\'s work.',
        });
        return;
      }
    }

    setIsOpen((prev) => !prev);
  };

  if (!showWidget) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 z-50 animate-in slide-in-from-bottom-5 duration-300"
          style={{
            width: window.innerWidth >= 640 ? '400px' : 'calc(100vw - 32px)',
            maxWidth: '400px'
          }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 sm:from-primary/30 sm:via-secondary/30 sm:to-accent/30 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-40 sm:opacity-50" />
            
            {/* Main container */}
            <div className="relative bg-background/98 backdrop-blur-2xl border border-primary/30 rounded-2xl sm:rounded-3xl shadow-2xl" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-white/10 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-black" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base truncate font-[Hobo_BT]">AI Assistant</h3>
                      <p className="text-xs text-green-500 truncate font-[Hobo_BT]">● Powered by Cem Koyluoglu</p>
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
              <div 
                ref={messagesContainerRef}
                className="p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 overflow-y-auto overflow-x-hidden overscroll-contain"
                style={{ 
                  height: '350px',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y'
                }}
              >
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
                    <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
                      <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 ${
                        msg.role === 'assistant' 
                          ? 'bg-primary/10 border border-primary/20 rounded-tl-sm' 
                          : 'bg-accent/10 border border-accent/20 rounded-tr-sm'
                      }`}>
                        <p
                          className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words font-[Hobo_BT]"
                          style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {msg.content}
                        </p>
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
                    <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
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
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="border-t border-white/10 p-2 sm:p-4 bg-background/50">
                <div className="flex gap-1.5 sm:gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    placeholder={isChatBlocked ? 'Chat temporarily closed...' : 'Ask me about Cem or this website...'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    disabled={isLoading || isChatBlocked}
                    rows={2}
                    className="flex-1 min-w-0 bg-input-background border-primary/20 focus:border-primary/40 rounded-xl resize-none text-base leading-relaxed py-2 px-3 font-[Hobo_BT]"
                    style={{ 
                      fontSize: '16px'
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || isChatBlocked || !inputMessage.trim()}
                    className="bg-primary hover:bg-primary/90 text-black rounded-xl h-[42px] w-[42px] sm:h-11 sm:w-11 flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
                {isChatBlocked && (
                  <p className="text-xs text-destructive text-center mt-2 leading-relaxed font-[Hobo_BT]">
                    Chat reopens in {remainingBlockMinutes} minute{remainingBlockMinutes > 1 ? 's' : ''}. Ask about Cem's work to chat again!
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed font-[Hobo_BT]">
                  <span className="text-primary">🛠️ Hand made</span> by Cem Koyluoglu
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-24 z-50">
        {/* News Summary Notification */}
        {showNotification && !isOpen && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-3 fade-in duration-500">
            <div className="relative group/notification">
              {/* Super bright glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-75 animate-pulse" />
              <div className="absolute -inset-3 bg-primary/60 rounded-3xl blur-xl animate-pulse" />

              {/* Notification content - Much brighter and more visible */}
              <div className="relative bg-white backdrop-blur-xl border-4 border-primary rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 font-[Hobo_BT]">
                      Want a quick summary? Ask me! 🤖
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ml-1"
                    aria-label="Close notification"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
                  </button>
                </div>

                {/* Pointer arrow - pointing down to the button */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-4 border-b-4 border-primary" />
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleToggleChat}
          size="icon"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20 group"
          aria-label={
            isChatBlocked
              ? 'Assistant temporarily disabled'
              : isOpen
                ? 'Close chat'
                : 'Open chat'
          }
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
          {!isOpen && !showNotification && (
            <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              <div className="px-3 py-2 rounded-xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-xl">
                <p className="text-xs text-white font-[Hobo_BT]">🤖 AI Assistant - Ask me anything!</p>
              </div>
            </div>
          )}
        </Button>
      </div>
    </>
  );
}

export default ChatWidget;
