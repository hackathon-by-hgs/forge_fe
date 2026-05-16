'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WORDS = [
  'Hire Workers',
  'Manage Payroll',
  'Unlock Credit',
  'Build Scores',
  'Scale Teams',
  'Track Attendance',
  'Automate Payments',
  'Reduce Risk',
];

export default function Marquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const ctx = gsap.context(() => {
      const loop = gsap.to(marquee, {
        xPercent: -50,
        repeat: -1,
        duration: 20,
        ease: 'none',
      });

      ScrollTrigger.create({
        onUpdate: (self) => {
          const velocity = Math.abs(self.getVelocity() / 100);
          gsap.to(loop, {
            timeScale: Math.max(1, velocity),
            duration: 0.5,
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative bg-black py-12 md:py-16 overflow-hidden border-y border-white/[0.08]"
    >
      {/* SVG hairline-grid on dark */}
      <div className="pointer-events-none absolute inset-0 bg-line-grid" />
      <div ref={marqueeRef} className="flex whitespace-nowrap will-change-transform">
        {[...WORDS, ...WORDS, ...WORDS].map((word, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="text-3xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white/[0.07] mx-6 md:mx-10 uppercase">
              {word}
            </span>
            <span className="w-3 h-3 rounded-full bg-forge-accent/30 shrink-0" />
          </span>
        ))}
      </div>
    </section>
  );
}
