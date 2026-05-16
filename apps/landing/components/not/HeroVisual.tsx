'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Hero Visual Background
 * Mimics a "data flow" or "liquid motion" effect behind the Hero text.
 */
export default function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create floating blobs/shapes that move organically
      gsap.to('.hero-blob', {
        x: 'random(-100, 100)',
        y: 'random(-100, 100)',
        duration: 'random(10, 20)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: {
          each: 2,
          from: 'random',
        },
      });

      // Subtle rotation for the whole container
      gsap.to(containerRef.current, {
        rotation: 360,
        duration: 100,
        repeat: -1,
        ease: 'none',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none z-0 opacity-20 blur-[100px]"
      aria-hidden="true"
    >
      <div className="hero-blob absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-forge-accent/40" />
      <div className="hero-blob absolute bottom-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-forge-accent/20" />
      <div className="hero-blob absolute top-[40%] right-[30%] w-[35%] h-[35%] rounded-full bg-white/5" />
    </div>
  );
}
