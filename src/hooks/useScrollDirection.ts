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
    let timeoutId: NodeJS.Timeout | null = null;

    const updateScrollDirection = () => {
      const currentScrollY = getScrollY();
      const difference = currentScrollY - lastY;

      console.log('[ScrollDirection] Y:', currentScrollY, 'Diff:', difference, 'Threshold:', threshold);

      if (Math.abs(difference) < threshold) {
        return;
      }

      if (currentScrollY < 30) {
        console.log('[ScrollDirection] At top - showing header/footer');
        setScrollDirection('none');
        setShowHeaderFooter(true);
      } else if (difference > 0) {
        console.log('[ScrollDirection] Scrolling down - hiding header/footer');
        setScrollDirection('down');
        setShowHeaderFooter(false);
      } else {
        console.log('[ScrollDirection] Scrolling up - showing header/footer');
        setScrollDirection('up');
        setShowHeaderFooter(true);
      }

      lastY = currentScrollY;
      setLastScrollY(currentScrollY);
    };

    const handleScroll = () => {
      console.log('[ScrollDirection] Scroll event triggered');

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        updateScrollDirection();
        timeoutId = null;
      }, 10);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true } as any);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [threshold, scrollableRef?.current, getScrollY]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
