'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Magnetic } from './';

gsap.registerPlugin(ScrollTrigger, SplitText);

const INDUSTRIES = [
  {
    name: 'Wholesale & Distribution',
    desc: 'Verified pools for loading, unloading, and warehouse ops.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    name: 'Manufacturing',
    desc: 'Rapid scaling for seasonal demand and multi-facility shifts.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: 'Retail & Services',
    desc: 'Reliability-scored workers for customer-facing roles.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    name: 'Logistics & Delivery',
    desc: 'Real-time GPS tracking of riders with instant payment.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    name: 'Construction',
    desc: 'Skilled and unskilled labor matching for project-based work.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: 'Agriculture',
    desc: 'Seasonal labor management for harvesting and processing.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const MARQUEE_ITEMS = [
  'Wholesale', 'Manufacturing', 'Retail', 'Logistics',
  'Construction', 'Agriculture', 'Hospitality', 'Events',
];

export default function Industries() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReduced) return;

      // Grid cards sophisticated animation
      const cards = gsap.utils.toArray<HTMLElement>('.industry-card');
      gsap.set(cards, { 
        y: 100, 
        opacity: 0, 
        rotationX: -15,
        transformOrigin: 'top center'
      });
      
      gsap.to(cards, {
        y: 0,
        opacity: 1,
        rotationX: 0,
        stagger: 0.15,
        duration: 1.5,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: section.querySelector('.industry-grid'),
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });


    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="industries"
      className="relative bg-black py-24 md:py-40 overflow-hidden"
    >
      {/* Marquee — counter-scrolling outlined text */}
      <div className="section-container relative z-10 mb-14 md:mb-24 space-y-3 md:space-y-4 select-none pointer-events-none overflow-hidden">
        {/* Row 1 — left */}
          <div className="overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee" style={{ width: 'max-content' }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={`r1-${i}`}
                className="text-[clamp(2rem,8vw,5rem)] font-bold uppercase tracking-tight mx-4 md:mx-8"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        {/* Row 2 — right (reversed) */}
        <div className="overflow-hidden">
          <div
            className="flex whitespace-nowrap"
            style={{
              width: 'max-content',
              animation: 'marquee-reverse 30s linear infinite',
            }}
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={`r2-${i}`}
                className="text-[clamp(2rem,8vw,5rem)] font-bold uppercase tracking-tight mx-4 md:mx-8"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.4)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section heading */}
      <div className="section-container relative z-10 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-[#FF4D00]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#FF4D00]">
            Industries
          </span>
        </div>
        <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight text-white mb-16 md:mb-24">
          Sectors we <span className="text-white/30">serve</span>
        </h2>

        {/* Grid */}
        <AnimatePresence>
          <motion.div
            layout
            className="industry-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {INDUSTRIES.map((item, index) => (
              <div
                key={item.name}
                className="industry-card group relative block h-full p-2"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                {hoveredIndex === index ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 block h-full w-full z-10"
                    style={{ background: 'rgba(255, 77, 0, 0.14)' }}
                    layoutId="industryHoverBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  />
                ) : null}

                <div className="relative z-50 flex h-full min-h-[400px] flex-col justify-between overflow-hidden border border-white/5 bg-[#000000] p-8 transition-all duration-700 group-hover:border-[#FF4D00]/30  md:p-12">
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D00]/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF4D00]/5 blur-[100px] translate-y-1/2 -translate-x-1/2" />
                  </div>

                  {/* Internal Border/Stroke for Depth */}
                  <div className="absolute inset-[1px] border border-white/[0.03] pointer-events-none" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-16">
                      {/* Technical Icon Frame with Magnetic Effect */}
                      <Magnetic>
                        <div className="relative">
                          <div className="industry-icon w-16 h-16 bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#FF4D00] group-hover:border-[#FF4D00]/30 transition-[color,border-color,background-color,opacity] duration-500 group-hover:scale-110">
                            {item.icon}
                          </div>
                          {/* Decorative Corner Accents */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-[#FF4D00] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-[#FF4D00] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" />
                        </div>
                      </Magnetic>

                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black tracking-[0.4em] text-white/20 uppercase mb-1">Sector Verified</span>
                        <div className="w-8 h-[1px] bg-[#FF4D00]/30" />
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] group-hover:animate-pulse" />
                        <h3 className="industry-text text-2xl md:text-3xl font-medium text-white tracking-tight transition-colors duration-500">
                          {item.name}
                        </h3>
                      </div>

                      <p className="industry-text text-base text-white/40 leading-relaxed group-hover:text-white/70 transition-colors duration-700 max-w-[280px]">
                        {item.desc}
                      </p>

                      <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#FF4D00] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        Explore Solution
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Geometric Background Detail */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                      <path d="M0 0h100v100H0z" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
