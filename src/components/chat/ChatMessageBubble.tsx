import type { ChatMessage } from '../../lib/types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[88%] border px-3 py-2.5 ${
          isAssistant
            ? 'border-hairline bg-background'
            : 'border-[rgba(255,74,28,0.35)] bg-[rgba(255,74,28,0.08)]'
        }`}
      >
        <p
          className="m-0 whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.6] text-ink-90"
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}
