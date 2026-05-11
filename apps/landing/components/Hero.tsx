'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Magnetic, HeroVisual } from './';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 });

      // Eyebrow
      tl.from('.hero-eyebrow', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
      });

      // Line-by-line heading reveal
      tl.from('.hero-line', {
        y: '110%',
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
      }, '-=0.3');

      // Subtext
      tl.from('.hero-sub', {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power3.out',
      }, '-=0.5');

      // CTAs
      tl.from('.hero-cta', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      }, '-=0.4');

      // Scroll indicator
      tl.from('.hero-scroll', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, '-=0.2');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex items-end pb-16 md:pb-24 overflow-hidden bg-black"
    >
      <HeroVisual />

      <div className="section-container relative z-10 w-full pt-32 md:pt-40">
        {/* Eyebrow — Phenomenon style: plain uppercase label */}
        <p className="hero-eyebrow eyebrow mb-8 md:mb-12">
          Workforce Management &amp; Credit Platform
        </p>

        {/* Main headline — LEFT-ALIGNED, massive, Phenomenon scale */}
        <h1 className="text-hero mb-12 md:mb-16 max-w-[1200px]">
          <span className="line-mask">
            <span className="hero-line">Hire Workers.</span>
          </span>
          <span className="line-mask">
            <span className="hero-line">Manage Payroll.</span>
          </span>
          <span className="line-mask">
            <span className="hero-line">
              Unlock <span className="text-forge-accent">Credit.</span>
            </span>
          </span>
        </h1>

        {/* Asymmetric layout — CTAs left, subtitle right */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-end">
          {/* CTAs — left aligned */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Magnetic>
              <a href="#contact" className="hero-cta btn-primary group">
                Start Hiring
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#cases" className="hero-cta btn-secondary group">
                View Cases
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </Magnetic>
          </div>

          {/* Subtitle — right aligned, offset lower */}
          <p className="hero-sub text-body-lg text-white/40 max-w-md">
            The all-in-one platform connecting employers with reliable
            informal workers, automating payments, and building credit
            histories — built for Nigeria&apos;s real economy.
          </p>
        </div>

        {/* Scroll indicator — bottom left, Phenomenon style */}
        <div className="hero-scroll absolute bottom-6 right-6 md:right-20 flex items-center gap-3 text-white/25">
          <span className="text-[11px] tracking-[0.15em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-white/15 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-white/40 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
