import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../lib/types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  return (
    <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
        {message.role === 'assistant' ? (
          <Bot className="w-4 h-4 text-black" />
        ) : (
          <User className="w-4 h-4 text-black" />
        )}
      </div>
      <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
        <div className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 ${
          message.role === 'assistant' 
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
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
