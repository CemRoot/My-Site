import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-black" />
      </div>
      <div className="flex-1 min-w-0 max-w-[calc(100%-2.5rem)]">
        <div className="bg-primary/10 border border-primary/20 rounded-xl sm:rounded-2xl rounded-tl-sm p-2.5 sm:p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-primary/80 font-medium font-[Hobo_BT]">
              Typing
            </span>
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
              <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
              <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
