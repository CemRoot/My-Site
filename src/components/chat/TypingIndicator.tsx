export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 border border-hairline bg-background px-3 py-2.5">
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-ink-45">TYPING</span>
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1 w-1 animate-bounce rounded-full bg-signal"
              style={{ animationDelay: `${delay}ms`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
