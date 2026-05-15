'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface CounterOptions {
  /** Final value to count up to */
  end: number;
  /** Duration in milliseconds (default 2000) */
  duration?: number;
  /** Decimal precision (default 0) */
  decimals?: number;
  /** Start counting threshold — ratio of element visible (default 0.5) */
  threshold?: number;
}

/**
 * Counts a number from 0 → end with deceleration easing.
 * Triggered when the element scrolls into view.
 */
export function useCounter({ end, duration = 2000, decimals = 0, threshold = 0.5 }: CounterOptions) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // power2.out easing (deceleration)
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = eased * end;

      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [end, duration, decimals]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, threshold]);

  return { ref, value };
}
