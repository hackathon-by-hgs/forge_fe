'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Magnetic, Odometer } from './';
import { STATS } from './Stats';
import { PARTNERS } from './TrustStrip';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero — Section 1 (Light)
 * Redesigned with a premium, sleek, and modern look.
 * Features a video showreel, bold typography, marquee partners, and odometer stats.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const detailsTriggerRef = useRef<HTMLDivElement>(null);
  const detailsWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrance Animations
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

      // 2. Details Section Pinning & Switching
      const items = gsap.utils.toArray<HTMLElement>('.hero-detail-item');
      
      // Pin the details section
      ScrollTrigger.create({
        trigger: detailsWrapperRef.current,
        start: 'top 10%',
        end: '+=200%',
        pin: true,
        scrub: true,
        pinSpacing: false,
      });

      // Handle item transitions using the NON-PINNED trigger wrapper
      items.forEach((item, i) => {
        // Set initial states: first is visible, others are hidden
        if (i > 0) {
          gsap.set(item, { opacity: 0, y: 40, scale: 0.95 });
        } else {
          gsap.set(item, { opacity: 1, y: 0, scale: 1 });
        }

        const itemTl = gsap.timeline({
          scrollTrigger: {
            trigger: detailsTriggerRef.current,
            // Calculate start/end based on percentages of the trigger container's scroll
            start: `top+=${i * 60}% 10%`,
            end: `top+=${(i + 1) * 60}% 10%`,
            scrub: true,
          }
        });

        // Entrance (except for the first one which starts visible)
        if (i > 0) {
          itemTl.to(item, { opacity: 1, y: 0, scale: 1, duration: 1 });
        }
        
        // Exit (except for the last one)
        if (i < items.length - 1) {
          itemTl.to(item, { opacity: 0, y: -40, scale: 1.05, duration: 1 }, `+=${0.5}`);
        }
      });

      // 3. Play video on mount
      if (videoRef.current) {
        videoRef.current.play().catch(() => {
          console.log("Autoplay prevented");
        });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex flex-col justify-center bg-white pt-32 pb-24 text-black md:pb-40"
    >
      <div className="section-container relative z-10 w-full">
        {/* Top: Headline & CTAs */}
        <div className="mb-24 md:mb-40">
          <p className="hero-eyebrow mb-8 text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00] md:mb-12">
            FORGE — NEXT-GEN WORKFORCE
          </p>

          <h1 className="hero-title mb-16 max-w-[1400px] text-[clamp(2.5rem,9vw,7rem)] font-medium leading-[0.95] tracking-tighter md:mb-20">
            <span className="inline-block">Bridging the gap</span>{' '}
            <span className="inline-block">between talent,</span>{' '}
            <br className="hidden lg:block" />
            <span className="inline-block">employment, and</span>{' '}
            <span className="inline-block font-bold">financial access.</span>
          </h1>

          <div className="hero-cta-group flex flex-col gap-6 sm:flex-row">
            <Magnetic>
              <a
                href="#contact"
                className="group inline-flex items-center gap-6 bg-black px-12 py-6 text-[13px] font-bold uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                GET STARTED
                <div className="relative h-5 w-5 overflow-hidden">
                  <svg className="absolute inset-0 transition-transform duration-300 group-hover:translate-x-full group-hover:-translate-y-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                   <svg className="absolute inset-0 -translate-x-full translate-y-full transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#cases"
                className="inline-flex items-center gap-6 border border-black/10 bg-black/5 px-12 py-6 text-[13px] font-bold uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-black/10"
              >
                VIEW CASES
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Bottom Details Section Wrapper */}
        <div ref={detailsTriggerRef} className="relative">
          {/* Actual Pinned Content */}
          <div ref={detailsWrapperRef} className="grid items-center gap-16 md:grid-cols-2 md:gap-32 min-h-[70vh] bg-white">
            {/* Left: Showreel Video */}
            <div className="group relative aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-neutral-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)]">
              <video
                ref={videoRef}
                src="https://player.vimeo.com/external/370331493.sd.mp4?s=7b0438b42dc943641ce754593414902d&profile_id=164&oauth2_token_id=57447761"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                muted
                loop
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              {/* Live Indicator */}
              <div className="absolute top-8 left-8 flex items-center gap-3">
                 <div className="h-2 w-2 animate-pulse rounded-full bg-[#FF4D00]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">SYSTEM ACTIVE</span>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-24 w-24 translate-y-4 scale-90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                  <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-black shadow-2xl backdrop-blur-md">
                    <svg className="ml-1 h-8 w-8 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between opacity-0 transition-all duration-500 group-hover:opacity-100">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">SHOWREEL 2026 — 01:24</span>
                 <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="h-1 w-1 rounded-full bg-white/40" />)}
                 </div>
              </div>
            </div>

            {/* Right: Switchable Content */}
            <div className="relative flex items-center py-10 h-full">
              <div className="w-full relative h-[400px]">
                {/* Item 1: Subtitle - Bold & Powerful */}
                <div className="hero-detail-item absolute inset-0 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-5xl font-medium leading-[1.1] tracking-tight text-black md:leading-[1.1]">
                    Empowering <span className="text-black/30">Nigeria&apos;s workforce</span> with verified identity and <span className="font-bold underline decoration-[#FF4D00] decoration-4 underline-offset-8">real-time credit.</span>
                  </h2>
                  <p className="mt-12 max-w-xl text-lg text-black/40 leading-relaxed font-light">
                    Forge leverages real performance data to unlock financial opportunities for millions of workers while streamlining operations for businesses.
                  </p>
                </div>

                {/* Item 2: Trusted By - Sleek Marquee */}
                <div className="hero-detail-item absolute inset-0 flex flex-col justify-center">
                   <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00] mb-12 block">Strategic Partners</span>
                   
                   <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-white after:to-transparent">
                      <div className="flex animate-marquee whitespace-nowrap py-4">
                         {[...PARTNERS, ...PARTNERS].map((name, i) => (
                           <div key={i} className="mx-12 flex items-center gap-3">
                              <span className="text-[#FF4D00] opacity-30">∗</span>
                              <span className="text-2xl font-black uppercase tracking-[0.2em] text-black/10 hover:text-black/80 transition-colors duration-500 cursor-default">
                                 {name}
                              </span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <p className="mt-12 text-[13px] font-medium text-black/30 max-w-sm">
                      Connecting Nigeria&apos;s leading institutions with a verified, high-performance talent pool.
                   </p>
                </div>

                {/* Item 3: Stats - Modern & Data-driven */}
                <div className="hero-detail-item absolute inset-0 flex flex-col justify-center">
                   <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00] mb-12 block">Proven Scale & Impact</span>
                   
                   <div className="grid grid-cols-2 gap-x-12 gap-y-16">
                      {STATS.map((stat) => (
                        <div key={stat.label} className="group relative">
                           <div className="absolute -left-6 top-0 h-full w-[1px] bg-black/5 transition-colors group-hover:bg-[#FF4D00]/30" />
                           <span className="block text-4xl md:text-6xl font-medium tracking-tighter mb-3 transition-transform group-hover:translate-x-1">
                              <Odometer value={stat.end} decimals={stat.decimals} />
                              <span className="text-[#FF4D00] font-bold">{stat.suffix}</span>
                           </span>
                           <span className="text-[10px] uppercase font-black text-black/20 tracking-[0.25em] block group-hover:text-black/40 transition-colors">
                              {stat.label}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Spacer */}
      <div className="h-[150vh] md:h-[200vh]" />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}
