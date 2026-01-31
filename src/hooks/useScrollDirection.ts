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
      console.log('[ScrollDirection] No scroll element found');
      return;
    }

    console.log('[ScrollDirection] Element found:', {
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollTop: element.scrollTop,
      overflow: window.getComputedStyle(element).overflow,
      overflowY: window.getComputedStyle(element).overflowY
    });

    let lastY = element.scrollTop;

    const handleScroll = () => {
      const currentY = element.scrollTop;
      const diff = currentY - lastY;

      console.log('[Scroll] Current:', currentY, 'Last:', lastY, 'Diff:', diff);

      if (Math.abs(diff) < threshold) {
        lastY = currentY;
        return;
      }

      if (currentY < 50) {
        console.log('[Scroll] Near top - SHOW');
        setScrollDirection('none');
        setShowHeaderFooter(true);
      } else if (diff > 0) {
        console.log('[Scroll] Scrolling DOWN - HIDE');
        setScrollDirection('down');
        setShowHeaderFooter(false);
      } else {
        console.log('[Scroll] Scrolling UP - SHOW');
        setScrollDirection('up');
        setShowHeaderFooter(true);
      }

      lastY = currentY;
      setLastScrollY(currentY);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    console.log('[ScrollDirection] Listener attached to element');

    return () => {
      element.removeEventListener('scroll', handleScroll);
      console.log('[ScrollDirection] Listener removed');
    };
  }, [threshold, scrollableRef]);

  return { scrollDirection, showHeaderFooter, lastScrollY };
}
