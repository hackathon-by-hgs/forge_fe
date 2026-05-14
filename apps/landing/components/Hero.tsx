'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Magnetic from './Magnetic';
import Odometer from './Odometer';
import { STATS } from './Stats';
import { PARTNERS } from './TrustStrip';

/**
 * Hero - Section 1 (Light)
 * Clean white background with high-contrast black typography.
 * Combines Headline, CTAs, and Details (Showreel + Subtitle/Trust/Stats).
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
          ease: 'expo.out',
        },
        '-=0.6',
      );

      tl.from(
        '.hero-cta-group',
        { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' },
        '-=0.4',
      );
      tl.from(
        '.hero-detail-card',
        { opacity: 0, y: 24, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
        '-=0.2',
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex flex-col justify-center bg-white pt-32 pb-24 text-black"
    >
      <div className="section-container relative z-10 w-full">
        {/* Top: Headline & CTAs */}
        <div className="mb-24 md:mb-32">
          {/* Eyebrow */}
          <p className="hero-eyebrow mb-8 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] md:mb-12">
            FORGE - B2B WORKFORCE & CREDIT
          </p>

          {/* Heading */}
          <h1 className="hero-title mb-12 max-w-[1200px] text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[1.05] tracking-tight md:mb-16">
            <span className="inline-block">Bridging the gap</span>{' '}
            <span className="inline-block">between talent,</span>{' '}
            <span className="inline-block">employment, and</span>{' '}
            <span className="inline-block font-bold">financial access.</span>
          </h1>

          {/* CTAs */}
          <div className="hero-cta-group flex flex-col gap-6 sm:flex-row">
            <Magnetic>
              <a
                href="#contact"
                className="inline-flex items-center gap-4 bg-black px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
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
                className="inline-flex items-center gap-4 border border-black/10 bg-black/5 px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-black/10"
              >
                VIEW CASES
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Bottom Details Section */}
        <div className="grid min-h-[60vh] items-start gap-12 md:grid-cols-2 md:gap-24">
          {/* Left: Showreel box */}
          <div className="hero-demo-box group relative aspect-video w-full mx-auto overflow-hidden bg-neutral-100 shadow-2xl md:sticky md:top-32 rounded-2xl">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src="/videos/hero-showreel.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-dot-grid opacity-20" />

            <div className="flex h-full w-full items-center justify-center">
              <div className="relative z-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/85 text-white transition-transform group-hover:scale-110">
                  <svg className="ml-1 h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/80">
                  WATCH SHOWREEL - 01:24
                </span>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex flex-col gap-6">
            {/* item 1 */}
            <div className="hero-detail-card inset-0 mb-32 flex flex-col justify-center">
              <h2 className="text-2xl font-medium leading-[1.2] tracking-tight text-black md:text-4xl">
                Empowering <span className="text-black/30">Nigeria&apos;s workforce</span> with verified identity and{' '}
                <span className="font-bold underline decoration-[#FF4D00] decoration-4 underline-offset-8">
                  real-time credit.
                </span>
              </h2>
              <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-black/40">
                Forge leverages real performance data to unlock financial opportunities for millions of workers while
                streamlining operations for businesses.
              </p>
            </div>

            {/* item 2 */}
            <div className="hero-detail-card inset-0 mb-32 flex flex-col justify-center">
              <span className="mb-10 block text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00]">
                Strategic Partners
              </span>

              <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-white after:to-transparent">
                <div className="flex animate-marquee whitespace-nowrap py-4">
                  {[...PARTNERS, ...PARTNERS].map((name, i) => (
                    <div key={i} className="mx-10 flex items-center gap-3">
                      <span className="text-[#FF4D00]">*</span>
                      <span className="cursor-default text-xl font-black uppercase tracking-[0.2em] text-black transition-colors duration-500 hover:text-black/80">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-10 max-w-sm text-[13px] font-medium text-black/30">
                Connecting Nigeria&apos;s leading institutions with a verified, high-performance talent pool.
              </p>
            </div>

            <div className="hero-detail-card inset-0 flex flex-col justify-center">
              <span className="mb-10 block text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00]">
                Proven Scale & Impact
              </span>

              <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                {STATS.map((stat) => (
                  <div key={stat.label} className="group relative">
                    <div className="absolute -left-4 top-0 h-full w-[1px] bg-black/5 transition-colors group-hover:bg-[#FF4D00]/30" />
                    <span className="mb-2 block text-3xl font-medium tracking-tighter transition-transform group-hover:translate-x-1 md:text-5xl">
                      <Odometer value={stat.end} decimals={stat.decimals} />
                      <span className="font-bold text-[#FF4D00]">{stat.suffix}</span>
                    </span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.25em] text-black/20 transition-colors group-hover:text-black/40">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
