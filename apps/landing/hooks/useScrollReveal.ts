'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  /** Starting Y offset in px (default 40) */
  y?: number;
  /** Starting X offset in px (default 0) */
  x?: number;
  /** Starting opacity (default 0) */
  fromOpacity?: number;
  /** Starting scale (default 1) */
  fromScale?: number;
  /** Animation duration in seconds (default 0.8) */
  duration?: number;
  /** Stagger delay between children in seconds (default 0) */
  stagger?: number;
  /** Delay before animation starts in seconds (default 0) */
  delay?: number;
  /** ScrollTrigger start position (default "top 85%") */
  start?: string;
  /** Whether to animate children instead of the element itself */
  children?: boolean;
}

/**
 * Scroll-triggered fade-in animation. Attach the returned ref to a
 * container element. Supports fade-up, fade-right, scale-in, and
 * staggered children reveals.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
) {
  const ref = useRef<T>(null);
  const {
    y = 40,
    x = 0,
    fromOpacity = 0,
    fromScale = 1,
    duration = 0.8,
    stagger = 0,
    delay = 0,
    start = 'top 85%',
    children = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = children ? el.children : el;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        x,
        opacity: fromOpacity,
        scale: fromScale,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none none',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [y, x, fromOpacity, fromScale, duration, stagger, delay, start, children]);

  return ref;
}
