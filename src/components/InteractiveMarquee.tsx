import React, { useEffect, useRef, useState, useCallback } from 'react';

interface InteractiveMarqueeProps {
  children: React.ReactNode;
  speed?: number; // Pixels per frame
  className?: string;
}

export function InteractiveMarquee({
  children,
  speed = 1,
  className = '',
}: InteractiveMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentTranslate = useRef(0);

  // Real width of one set of items
  const contentWidth = useRef(0);

  const calculateWidth = useCallback(() => {
    if (contentRef.current && contentRef.current.children.length > 0) {
      const firstSet = contentRef.current.children[0] as HTMLElement;
      contentWidth.current = firstSet.offsetWidth;
    }
  }, []);

  useEffect(() => {
    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    return () => window.removeEventListener('resize', calculateWidth);
  }, [calculateWidth, children]);

  const animate = useCallback(() => {
    if (!isPaused && !isDragging.current && contentWidth.current > 0) {
      currentTranslate.current -= speed;

      // Reset position when we've scrolled exactly one full set of items
      if (Math.abs(currentTranslate.current) >= contentWidth.current) {
        // Use modulo to handle extreme speeds
        currentTranslate.current = currentTranslate.current % contentWidth.current;
      }

      if (contentRef.current) {
         contentRef.current.style.transform = `translate3d(${currentTranslate.current}px, 0, 0)`;
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isPaused, speed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // Interaction Timeout
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = (clientX: number) => {
    setIsPaused(true);
    isDragging.current = true;
    startX.current = clientX;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    const dx = clientX - startX.current;

    // allow dragging in both directions
    let newTranslate = currentTranslate.current + dx;

    // Wrap around infinitely using modulo
    if (contentWidth.current > 0) {
        if (newTranslate > 0) {
            newTranslate = -contentWidth.current + (newTranslate % contentWidth.current);
        } else {
            newTranslate = newTranslate % contentWidth.current;
        }
    }

    currentTranslate.current = newTranslate;
    startX.current = clientX; // update startX to current for continuous diff

    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${currentTranslate.current}px, 0, 0)`;
    }
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  };

  return (
    <div
      className={`marquee-mask overflow-hidden touch-pan-y ${className}`}
      ref={containerRef}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      <div
        ref={contentRef}
        className="flex w-max will-change-transform"
      >
        <div className="flex gap-2.5 pr-2.5">{children}</div>
        <div className="flex gap-2.5 pr-2.5">{children}</div>
      </div>
    </div>
  );
}
