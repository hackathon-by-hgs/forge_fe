'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ParallaxOptions {
  /** Speed multiplier — 0.5 = moves at half scroll speed (default 0.3) */
  speed?: number;
  /** Direction: 'y' for vertical parallax, 'x' for horizontal */
  direction?: 'y' | 'x';
}

/**
 * Parallax scroll effect. The element moves slower or faster than
 * the natural scroll speed, creating a depth illusion.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {},
) {
  const ref = useRef<T>(null);
  const { speed = 0.3, direction = 'y' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        [direction]: () => speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [speed, direction]);

  return ref;
}
