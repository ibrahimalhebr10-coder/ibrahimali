import { useState, useEffect, RefObject } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number;
  scrollableRef?: RefObject<HTMLElement>;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, scrollableRef } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const element = scrollableRef?.current;

    if (!element) {
      return;
    }

    let lastY = element.scrollTop;
    let touchStartY = 0;
    let lastTouchY = 0;

    const handleScroll = () => {
      const currentY = element.scrollTop;
      const diff = currentY - lastY;

      if (Math.abs(diff) < threshold) {
        lastY = currentY;
        return;
      }

      if (currentY < 50) {
        setScrollDirection('none');
        setShowHeaderFooter(true);
      } else if (diff > 0) {
        setScrollDirection('down');
        setShowHeaderFooter(false);
      } else {
        setScrollDirection('up');
        setShowHeaderFooter(true);
      }

      lastY = currentY;
      setLastScrollY(currentY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0].clientY;
      const diff = lastTouchY - currentTouchY;
      lastTouchY = currentTouchY;

      const currentScrollY = element.scrollTop;

      if (Math.abs(diff) < threshold) {
        return;
      }

      if (currentScrollY < 50) {
        setScrollDirection('none');
        setShowHeaderFooter(true);
      } else if (diff > 0) {
        setScrollDirection('down');
        setShowHeaderFooter(false);
      } else {
        setScrollDirection('up');
        setShowHeaderFooter(true);
      }

      setLastScrollY(currentScrollY);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [threshold, scrollableRef]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
