import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounceMs?: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, debounceMs = 50 } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastY = window.scrollY;
    setLastScrollY(lastY);

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastY;

      if (Math.abs(difference) < threshold) {
        return;
      }

      if (currentScrollY < 50) {
        setScrollDirection('none');
        setShowHeaderFooter(true);
        console.log('🔓 SHOWING header/footer (at top)');
      } else if (difference > 0) {
        setScrollDirection('down');
        setShowHeaderFooter(false);
        console.log('🔒 HIDING header/footer (scrolling down)');
      } else {
        setScrollDirection('up');
        setShowHeaderFooter(true);
        console.log('🔓 SHOWING header/footer (scrolling up)');
      }

      lastY = currentScrollY;
      setLastScrollY(currentScrollY);
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollDirection, debounceMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [threshold, debounceMs]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
