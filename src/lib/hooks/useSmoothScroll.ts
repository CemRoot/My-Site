import { useEffect } from 'react';

/**
 * Custom hook to enable smooth scrolling behavior
 */
export function useSmoothScroll() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);
}
