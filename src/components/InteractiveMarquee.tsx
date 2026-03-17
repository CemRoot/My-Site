import React, { useEffect, useRef, useState, useCallback } from 'react';

interface InteractiveMarqueeProps {
  children: React.ReactNode;
  speed?: number; // Pixels per frame
  className?: string;
}

export function InteractiveMarquee({
  children,
  speed = 1.2,
  className = '',
}: InteractiveMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  const isDragging = useRef(false);
  const isHovered = useRef(false);

  const initialX = useRef(0);
  const initialY = useRef(0);
  const startX = useRef(0);
  const isHorizontalDrag = useRef<boolean | null>(null);

  const currentTranslate = useRef(0);
  const contentWidth = useRef(0);

  useEffect(() => {
    if (!contentRef.current) return;
    const firstSet = contentRef.current.children[0] as HTMLElement;

    const observer = new ResizeObserver(() => {
      contentWidth.current = firstSet.offsetWidth;
    });

    observer.observe(firstSet);
    return () => observer.disconnect();
  }, []);

  const animate = useCallback(() => {
    if (!isPaused && !isDragging.current && !isHovered.current && contentWidth.current > 0) {
      currentTranslate.current -= speed;

      if (Math.abs(currentTranslate.current) >= contentWidth.current) {
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

  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pauseAutoScroll = () => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const resumeAutoScroll = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    pauseAutoScroll();
    isDragging.current = true;
    initialX.current = clientX;
    initialY.current = clientY;
    startX.current = clientX;
    isHorizontalDrag.current = null;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;

    const totalDx = clientX - initialX.current;
    const totalDy = clientY - initialY.current;

    // Determine if it's a horizontal swipe or vertical scroll
    if (isHorizontalDrag.current === null) {
        if (Math.abs(totalDx) > 5 && Math.abs(totalDx) > Math.abs(totalDy)) {
            isHorizontalDrag.current = true;
        } else if (Math.abs(totalDy) > 5) {
            isHorizontalDrag.current = false;
        }
    }

    // If it's a vertical scroll, stop dragging and resume animation immediately
    if (isHorizontalDrag.current === false) {
       isDragging.current = false;
       resumeAutoScroll();
       return;
    }

    // Still trying to figure out direction
    if (isHorizontalDrag.current === null) return;

    // Normal horizontal drag
    const dx = clientX - startX.current;
    let newTranslate = currentTranslate.current + dx;

    if (contentWidth.current > 0) {
        if (newTranslate > 0) {
            newTranslate = -contentWidth.current + (newTranslate % contentWidth.current);
        } else {
            newTranslate = newTranslate % contentWidth.current;
        }
    }

    currentTranslate.current = newTranslate;
    startX.current = clientX;

    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${currentTranslate.current}px, 0, 0)`;
    }
  };

  const handleDragEnd = () => {
    if (isDragging.current) {
        isDragging.current = false;
        resumeAutoScroll();
    }
  };

  return (
    <div
      className={`marquee-mask overflow-hidden touch-pan-y select-none ${className}`}
      ref={containerRef}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        isHovered.current = false;
        handleDragEnd();
      }}
      onMouseEnter={() => {
        isHovered.current = true;
      }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      <div
        ref={contentRef}
        className="flex w-max will-change-transform"
      >
        <div className="flex gap-2.5 pr-2.5">{children}</div>
        <div className="flex gap-2.5 pr-2.5" aria-hidden="true">{children}</div>
        <div className="flex gap-2.5 pr-2.5" aria-hidden="true">{children}</div>
        <div className="flex gap-2.5 pr-2.5" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
