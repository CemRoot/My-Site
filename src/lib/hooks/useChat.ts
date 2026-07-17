import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PERSONAL_INFO } from '../constants/personal';
import { CHAT_BLOCK_DURATION_MS, OFF_TOPIC_THRESHOLD } from '../constants/animation';
import type { ChatMessage, TopicTag } from '../types';

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseAssistantReply = (
  reply: string,
): { topic: TopicTag; content: string } => {
  const topicPattern = /^\s*\[TOPIC:(CEM|OFF_TOPIC)\]\s*/i;
  const match = reply.match(topicPattern);

  if (!match) {
    return { topic: 'cem', content: reply.trim() };
  }

  const topic = match[1].toUpperCase() === 'OFF_TOPIC' ? 'off_topic' : 'cem';
  const content = reply.replace(topicPattern, '').trimStart();
  return { topic, content };
};

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: `👋 Hey! I'm ${PERSONAL_INFO.name.split(' ')[0]}'s AI assistant. Ask me anything about ${PERSONAL_INFO.name.split(' ')[0]}, his work, or this website!`,
  timestamp: new Date(),
};

interface PageInfo {
  path: string;
  title: string;
  summary?: string;
  highlights?: string[];
  lastUpdated?: string;
}

export function useChat(pageInfo: PageInfo | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [offTopicCount, setOffTopicCount] = useState(0);
  const [awaitingRelevantQuestion, setAwaitingRelevantQuestion] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const now = Date.now();
  const isChatBlocked = blockedUntil !== null && blockedUntil > now;
  const remainingBlockMinutes = isChatBlocked
    ? Math.max(1, Math.ceil((blockedUntil - now) / 60000))
    : 0;

  const checkAndClearBlock = useCallback(() => {
    const ts = Date.now();
    if (blockedUntil && ts >= blockedUntil) {
      setBlockedUntil(null);
      setOffTopicCount(0);
      setAwaitingRelevantQuestion(false);
      return true;
    }
    return false;
  }, [blockedUntil]);

  const sendMessage = useCallback(
    async (trimmedMessage: string) => {
      if (!trimmedMessage || isLoading) return;

      checkAndClearBlock();

      if (blockedUntil && Date.now() < blockedUntil) {
        toast.warning('Chat temporarily closed', {
          description: "Please wait a few minutes or ask about Cem's work.",
        });
        return false;
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmedMessage,
        timestamp: new Date(),
      };

      setInputMessage('');
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const recentHistory = messages
          .filter(m => m.id !== '1')
          .slice(-12)
          .map(m => ({ role: m.role, content: m.content }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmedMessage, pageContext: pageInfo, history: recentHistory }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        const rawReply = typeof data.reply === 'string' ? data.reply : '';
        const { topic, content } = parseAssistantReply(rawReply);

        const assistantMessage: ChatMessage = {
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
            if (potentialCount >= OFF_TOPIC_THRESHOLD) {
              issueWarning = true;
            }
          }
        } else {
          nextOffTopicCount = 0;
        }

        const outgoingMessages: ChatMessage[] = [assistantMessage];

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
          const blockTimestamp = Date.now() + CHAT_BLOCK_DURATION_MS;
          setBlockedUntil(blockTimestamp);
          outgoingMessages.push({
            id: createMessageId(),
            role: 'assistant',
            content:
              '🔒 Chat temporarily closed due to off-topic questions. Please come back in 5 minutes or ask questions about Cem Koyluoglu and his work. Thanks!',
            timestamp: new Date(),
          });
          toast.warning('Chat temporarily closed', {
            description:
              "Come back in 5 minutes or ask about Cem's work to continue chatting.",
          });
        }

        setMessages((prev) => [...prev, ...outgoingMessages]);
        setOffTopicCount(nextOffTopicCount);

        if (topic === 'off_topic') {
          if (issueWarning) setAwaitingRelevantQuestion(true);
          else if (enforceBlock) setAwaitingRelevantQuestion(false);
        } else {
          if (blockedUntil && Date.now() >= blockedUntil) setBlockedUntil(null);
          setAwaitingRelevantQuestion(false);
        }
      } catch (error: unknown) {
        console.error('Chat error:', error);
        toast.error('Failed to send message', {
          description: 'Please try again or contact directly via WhatsApp',
        });

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: 'assistant',
            content: `Sorry, I'm having trouble connecting right now. Please reach out directly:\n📧 ${PERSONAL_INFO.email}\n📱 WhatsApp: ${PERSONAL_INFO.phone}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [
      isLoading,
      messages,
      pageInfo,
      offTopicCount,
      awaitingRelevantQuestion,
      blockedUntil,
      checkAndClearBlock,
    ],
  );

  const canToggleChat = useCallback(() => {
    const ts = Date.now();
    if (blockedUntil && ts >= blockedUntil) {
      setBlockedUntil(null);
      setOffTopicCount(0);
      setAwaitingRelevantQuestion(false);
      return true;
    }
    if (blockedUntil && ts < blockedUntil) {
      toast.warning('Chat temporarily closed', {
        description: "Come back in a few minutes or ask about Cem's work.",
      });
      return false;
    }
    return true;
  }, [blockedUntil]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    isChatBlocked,
    remainingBlockMinutes,
    sendMessage,
    canToggleChat,
  };
}
