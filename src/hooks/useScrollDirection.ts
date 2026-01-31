import { useState, useEffect, useCallback, RefObject } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounceMs?: number;
  scrollableRef?: RefObject<HTMLElement>;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, debounceMs = 50, scrollableRef } = options;
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

    // تأكد من أن الـ element موجود قبل إضافة الـ listener
    if (!scrollElement) {
      console.log('⚠️ Scroll element not ready yet');
      return;
    }

    console.log('✅ Setting up scroll listener on:', scrollElement === window ? 'window' : 'custom element');

    let timeoutId: NodeJS.Timeout;
    let lastY = getScrollY();
    setLastScrollY(lastY);

    const updateScrollDirection = () => {
      const currentScrollY = getScrollY();
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

    scrollElement.addEventListener('scroll', handleScroll, { passive: true } as any);

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [threshold, debounceMs, scrollableRef?.current, getScrollY]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
