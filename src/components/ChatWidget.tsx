import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { usePageContext } from '../lib/context/PageContext';
import {
  WIDGET_SHOW_DELAY_MS,
  NEWS_NOTIFICATION_SHOW_DELAY_MS,
  NEWS_NOTIFICATION_HIDE_DELAY_MS,
} from '../lib/constants/animation';
import { ChatMessageBubble } from './chat/ChatMessageBubble';
import { TypingIndicator } from './chat/TypingIndicator';
import { useChat } from '../lib/hooks/useChat';
import { useI18n } from '../features/i18n';

interface ChatWidgetProps {
  showNewsNotification?: boolean;
}

const MONO_LABEL = 'font-mono text-[10.5px] font-medium leading-none tracking-[0.12em]';

/**
 * "Ask my portfolio" chat — the same Groq/Vercel-backed assistant as before,
 * reskinned to the editorial design language. All conversation logic lives in
 * useChat and is untouched.
 */
function ChatWidget({ showNewsNotification = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const { pageInfo } = usePageContext();
  const { t } = useI18n();
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

    await sendMessage(trimmedMessage);
    setTimeout(() => textareaRef.current?.focus(), 150);
  };

  const handleToggleChat = () => {
    if (!isOpen && !canToggleChat()) return;
    setIsOpen((prev) => !prev);
  };

  if (!showWidget) return null;

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          data-site-fab
          className="anim-rise fixed bottom-[var(--chat-panel-bottom)] right-[clamp(14px,2vw,26px)] z-[70] w-[min(380px,calc(100vw-28px))] border border-hairline-strong bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.6)] [animation-duration:0.28s]"
        >
          {/* Header */}
          <div className={`${MONO_LABEL} flex items-center justify-between border-b border-hairline px-4 py-3.5 text-ink-55`}>
            <span className="flex items-center gap-[7px]">
              <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-live [animation-duration:2s]" />
              {t({ en: 'ASK MY PORTFOLIO', tr: "AI'YA SOR" })}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer border-none bg-transparent font-mono text-xs text-ink-55 hover:text-foreground"
              aria-label={t({ en: 'Close chat', tr: 'Sohbeti kapat' })}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex h-[350px] flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain p-4"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && <TypingIndicator />}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-hairline p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder={
                  isChatBlocked
                    ? t({ en: 'Chat temporarily closed…', tr: 'Sohbet geçici olarak kapalı…' })
                    : t({ en: 'Type a question…', tr: 'Bir soru yaz…' })
                }
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
                className="min-w-0 flex-1 resize-none rounded-none border-hairline-strong bg-background px-3 py-2 font-sans text-[16px] leading-relaxed focus:border-signal"
              />
              <button
                type="submit"
                disabled={isLoading || isChatBlocked || !inputMessage.trim()}
                className="h-[42px] w-[42px] flex-shrink-0 cursor-pointer border-none bg-signal font-mono text-sm text-background hover:bg-signal-hover disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t({ en: 'Send message', tr: 'Mesaj gönder' })}
              >
                →
              </button>
            </div>
            {isChatBlocked && (
              <p className="mt-2 text-center font-mono text-[10.5px] leading-relaxed text-destructive">
                {t({
                  en: `Chat reopens in ${remainingBlockMinutes} minute${remainingBlockMinutes > 1 ? 's' : ''}.`,
                  tr: `Sohbet ${remainingBlockMinutes} dakika içinde yeniden açılır.`,
                })}
              </p>
            )}
            <p className={`${MONO_LABEL} mt-2 text-center text-ink-38`}>
              GROQ · VERCEL · SUPABASE
            </p>
          </form>
        </div>
      )}

      {/* Floating button + notification */}
      <div
        data-site-fab
        className="fixed bottom-[var(--fab-bottom)] right-[clamp(14px,2vw,26px)] z-[70]"
      >
        {showNotification && !isOpen && (
          <div className="anim-rise absolute bottom-full right-0 mb-3 [animation-duration:0.3s]">
            <div className="flex min-w-max items-center gap-3 border border-hairline-strong bg-surface px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
              <span className="anim-pulse h-1.5 w-1.5 flex-shrink-0 rounded-full bg-signal" />
              <p className={`${MONO_LABEL} m-0 whitespace-nowrap text-foreground`}>
                {t({
                  en: 'WANT A QUICK SUMMARY? ASK ME',
                  tr: "HIZLI ÖZET İSTER MİSİN? AI'YA SOR",
                })}
              </p>
              <button
                type="button"
                onClick={() => setShowNotification(false)}
                className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-ink-55 hover:text-foreground"
                aria-label={t({ en: 'Close notification', tr: 'Bildirimi kapat' })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleChat}
          className={`${MONO_LABEL} flex cursor-pointer items-center gap-[9px] border-none bg-foreground px-[18px] py-3.5 tracking-[0.1em] text-background shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:bg-white`}
          aria-label={
            isChatBlocked
              ? t({ en: 'Assistant temporarily disabled', tr: 'Asistan geçici olarak kapalı' })
              : isOpen
                ? t({ en: 'Close chat', tr: 'Sohbeti kapat' })
                : t({ en: 'Open chat', tr: 'Sohbeti aç' })
          }
        >
          <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-signal [animation-duration:2s]" />
          <span>
            {isOpen
              ? t({ en: 'CLOSE', tr: 'KAPAT' })
              : t({ en: 'ASK MY PORTFOLIO', tr: "AI'YA SOR" })}
          </span>
        </button>
      </div>
    </>
  );
}

export default ChatWidget;
