'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReduced) return;

      // Grid cards stagger in
      const cards = gsap.utils.toArray<HTMLElement>('.industry-card');
      gsap.set(cards, { y: 60, opacity: 0 });
      gsap.to(cards, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section.querySelector('.industry-grid'),
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // GSAP hover for cards (interruptible)
      cards.forEach((card) => {
        const icon = card.querySelector('.industry-icon');
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            backgroundColor: '#FF4D00',
            borderColor: '#FF4D00',
            duration: 0.35,
            ease: 'power2.out',
            overwrite: true,
          });
          gsap.to(card.querySelectorAll('.industry-text'), {
            color: '#000000',
            duration: 0.25,
            overwrite: true,
          });
          if (icon) {
            gsap.to(icon, {
              scale: 1.15,
              rotation: 8,
              color: '#000000',
              duration: 0.35,
              ease: 'power2.out',
              overwrite: true,
            });
          }
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            backgroundColor: '#0a0a0a',
            borderColor: 'rgba(255,255,255,0.08)',
            duration: 0.35,
            ease: 'power2.out',
            overwrite: true,
          });
          gsap.to(card.querySelectorAll('.industry-text'), {
            color: '',
            duration: 0.25,
            overwrite: true,
          });
          if (icon) {
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              color: '',
              duration: 0.35,
              ease: 'power2.out',
              overwrite: true,
            });
          }
        });
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
      <div className="mb-14 md:mb-24 space-y-3 md:space-y-4 select-none pointer-events-none overflow-hidden">
        {/* Row 1 — left */}
          <div className="overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee" style={{ width: 'max-content' }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={`r1-${i}`}
                className="text-[clamp(2rem,8vw,5rem)] font-bold uppercase tracking-tight mx-4 md:mx-8"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.25)',
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
                  WebkitTextStroke: '1px rgba(255,255,255,0.12)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Section heading */}
      <div className="section-container relative z-10">
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
        <div className="industry-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/[0.04]">
          {INDUSTRIES.map((item) => (
            <div
              key={item.name}
              className="industry-card bg-[#0a0a0a] border border-white/[0.08] p-10 md:p-12 cursor-pointer"
            >
              <div className="industry-icon text-white/40 mb-8">{item.icon}</div>
              <h3 className="industry-text text-xl font-bold text-white mb-3 tracking-tight">
                {item.name}
              </h3>
              <p className="industry-text text-sm text-white/30 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
