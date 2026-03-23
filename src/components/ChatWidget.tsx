import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { PERSONAL_INFO } from '../lib/constants/personal';
import { usePageContext } from '../lib/context/PageContext';
import {
  WIDGET_SHOW_DELAY_MS,
  NEWS_NOTIFICATION_SHOW_DELAY_MS,
  NEWS_NOTIFICATION_HIDE_DELAY_MS,
} from '../lib/constants/animation';
import { ChatMessageBubble } from './chat/ChatMessageBubble';
import { TypingIndicator } from './chat/TypingIndicator';
import { useChat } from '../lib/hooks/useChat';

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
  const { pageInfo } = usePageContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    isChatBlocked,
    remainingBlockMinutes,
    sendMessage,
    canToggleChat,
  } = useChat(pageInfo);

  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), WIDGET_SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showNewsNotification) return;

    const showTimer = setTimeout(() => {
      setShowNotification(true);
    }, NEWS_NOTIFICATION_SHOW_DELAY_MS);

    const hideTimer = setTimeout(() => {
      setShowNotification(false);
    }, NEWS_NOTIFICATION_HIDE_DELAY_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [showNewsNotification]);

  useEffect(() => {
    if (isOpen) setShowNotification(false);
  }, [isOpen]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isChatBlocked) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isChatBlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    const sent = await sendMessage(trimmedMessage);
    if (!sent) {
      setTimeout(() => textareaRef.current?.focus(), 150);
      return;
    }
    setTimeout(() => textareaRef.current?.focus(), 150);
  };

  const handleToggleChat = () => {
    if (!isOpen && !canToggleChat()) return;
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
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
                
                {isLoading && <TypingIndicator />}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="border-t border-white/10 p-2 sm:p-4 bg-background/50">
                <div className="flex gap-1.5 sm:gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    placeholder={isChatBlocked ? 'Chat temporarily closed...' : 'Ask me about Cem or this website...'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
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
                  <span className="text-primary">🛠️ Hand made</span> by {PERSONAL_INFO.name}
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
          <div className="absolute bottom-full mb-6 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:[left:-12px] sm:[top:-62px] animate-in slide-in-from-bottom-3 fade-in duration-500 z-10">
            <div className="relative group/notification">
              {/* Optimized glow effect - single, cleaner glow */}
              <div className="absolute -inset-2 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl blur-lg opacity-50 animate-pulse" />

              {/* Notification content - Clean and professional */}
              <div className="relative bg-white backdrop-blur-xl border-2 border-primary/80 rounded-xl shadow-2xl min-w-max">
                <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 font-[Hobo_BT] leading-tight whitespace-nowrap">
                      Want a quick summary? Ask me! 🤖
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Pointer arrow - pointing down to the button */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-2 border-b-2 border-primary/80" />
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleToggleChat}
          size="icon"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-accent hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20 group overflow-hidden"
          aria-label={
            isChatBlocked
              ? 'Assistant temporarily disabled'
              : isOpen
                ? 'Close chat'
                : 'Open chat'
          }
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 sm:bg-primary/30 animate-pulse" />

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
