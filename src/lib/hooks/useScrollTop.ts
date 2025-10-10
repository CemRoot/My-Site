import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage scroll-to-top button visibility and functionality
 * @param threshold - Scroll position threshold to show the button (default: 500px)
 */
export function useScrollTop(threshold = 500) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { showScrollTop, scrollToTop };
}
