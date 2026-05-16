'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Initializes Lenis smooth-scroll on mount. Returns the instance ref
 * so GSAP ScrollTrigger can sync with it if needed.
 */
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;
    lenis.scrollTo(0, { immediate: true, force: true });

    // Sync ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Global click listener for smooth scroll on all # links
    const handleAnchorClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      
      // Only handle internal links that aren't just '#'
      if (href && href.startsWith('#') && href.length > 1) {
        const targetEl = document.querySelector(href) as HTMLElement;
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, {
            duration: 1.5,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
    };

    window.addEventListener('click', handleAnchorClick);

    return () => {
      lenis.destroy();
      window.removeEventListener('click', handleAnchorClick);
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
