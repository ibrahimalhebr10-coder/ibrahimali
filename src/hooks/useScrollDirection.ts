import { useState, useEffect, useCallback, RefObject } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number;
  scrollableRef?: RefObject<HTMLElement>;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 5, scrollableRef } = options;
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);

  const getScrollY = useCallback(() => {
    if (scrollableRef?.current) {
      return scrollableRef.current.scrollTop;
    }
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  }, [scrollableRef]);

  useEffect(() => {
    const scrollElement = scrollableRef?.current || window;

    if (!scrollElement) {
      return;
    }

    let lastY = getScrollY();
    setLastScrollY(lastY);
    let ticking = false;
    let rafId: number | null = null;

    const updateScrollDirection = () => {
      const currentScrollY = getScrollY();
      const difference = currentScrollY - lastY;

      if (Math.abs(difference) < threshold) {
        ticking = false;
        rafId = null;
        return;
      }

      if (currentScrollY < 30) {
        setScrollDirection('none');
        setShowHeaderFooter(true);
      } else if (difference > 0) {
        setScrollDirection('down');
        setShowHeaderFooter(false);
      } else {
        setScrollDirection('up');
        setShowHeaderFooter(true);
      }

      lastY = currentScrollY;
      setLastScrollY(currentScrollY);
      ticking = false;
      rafId = null;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(updateScrollDirection);
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true } as any);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold, scrollableRef?.current, getScrollY]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
