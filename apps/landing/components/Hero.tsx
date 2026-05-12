'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Magnetic } from './';

/**
 * Hero — Section 1 (Light)
 * Clean white background with high-contrast black typography.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });

      tl.from('.hero-eyebrow', {
        opacity: 0,
        x: -30,
        duration: 0.8,
        ease: 'power4.out',
      });

      tl.from(
        '.hero-title span',
        { 
          opacity: 0, 
          y: 60, 
          stagger: 0.1,
          duration: 1, 
          ease: 'expo.out' 
        },
        '-=0.6',
      );

      tl.from(
        '.hero-cta-group',
        { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' },
        '-=0.4',
      );

      tl.from(
        '.hero-demo-box',
        { 
          opacity: 0, 
          scale: 0.95,
          rotateX: 10,
          duration: 1.2, 
          ease: 'power2.out' 
        },
        '-=0.8',
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-white pt-32 pb-16 text-black md:pb-24"
    >
      <div className="section-container relative z-10 w-full">
        {/* Eyebrow */}
        <p className="hero-eyebrow mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] md:mb-12">
          FORGE — B2B WORKFORCE & CREDIT
        </p>

        {/* Heading */}
        <h1 className="hero-title mb-12 max-w-[1200px] text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[1.05] tracking-tight md:mb-16">
          <span className="inline-block">Bridging the gap</span>{' '}
          <span className="inline-block">between talent,</span>{' '}
          <span className="inline-block">employment, and</span>{' '}
          <span className="inline-block font-bold">financial access.</span>
        </h1>

        {/* CTAs */}
        <div className="hero-cta-group mb-24 flex flex-col gap-6 sm:flex-row md:mb-32">
          <Magnetic>
            <a
              href="#contact"
              className="inline-flex items-center gap-4 rounded-xl bg-black px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              GET STARTED
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#cases"
              className="inline-flex items-center gap-4 rounded-xl border border-black/10 bg-black/5 px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-black/10"
            >
              VIEW CASES
            </a>
          </Magnetic>
        </div>

        {/* Bottom Split */}
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-24">
          {/* Showreel box */}
          <div className="hero-demo-box group relative aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100 shadow-2xl">
            <div className="absolute inset-0 bg-dot-grid opacity-20" />
            <div className="flex h-full w-full items-center justify-center">
               <div className="relative z-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-110 mx-auto shadow-lg">
                  <svg className="ml-1 h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">
                  WATCH SHOWREEL — 01:24
                </span>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="max-w-xl text-xl font-light leading-relaxed text-black/70 md:text-2xl">
            Forge empowers Nigerian businesses with verified on-demand labor while providing workers with embedded financial services and credit scores based on their real performance.
          </p>
        </div>
      </div>
    </section>
  );
}
