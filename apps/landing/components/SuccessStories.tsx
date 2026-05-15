'use client';

import { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger, SplitText);

const CASES = [
  {
    client: 'Amara Foods',
    industry: 'Wholesale Distribution',
    result: '3× faster hiring',
    description:
      'Reduced hiring time from 3 days to 4 hours with a verified worker pool and automated matching across 6 distribution centers.',
    metrics: ['₦2M saved monthly', '98% attendance'],
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    client: 'Lagos Textiles',
    industry: 'Manufacturing',
    result: 'Zero disputes',
    description:
      'Eliminated cash-based payment disputes and saved 20 hours per week in payroll processing for a workforce of 200+ casual workers.',
    metrics: ['20hrs saved weekly', '200+ workers'],
    image:
      'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=1200&auto=format&fit=crop',
  },
  {
    client: 'QuickMart',
    industry: 'Retail Chain',
    result: '40% cost cut',
    description:
      'Real-time visibility into casual workforce across 12 stores. Shifted from spreadsheet chaos to a single operational dashboard.',
    metrics: ['12 stores', '₦5M saved'],
    image:
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1200&auto=format&fit=crop',
  },
  {
    client: 'FirstBank Nigeria',
    industry: 'Financial Services',
    result: '₦120M lent',
    description:
      'Behavioral credit scores from Forge data enabled microloans to 4,000+ previously unbankable workers with a 96% repayment rate.',
    metrics: ['4,000+ borrowers', '96% repayment'],
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
  },
];

function CaseCard({ item }: { item: typeof CASES[0] }) {
  return (
    <div className="case-card group relative flex-shrink-0 flex flex-col bg-[#0a0a0a] border border-white/[0.08] overflow-hidden
      w-full md:w-[480px] lg:w-[520px]"
      style={{ height: 'clamp(480px, 70vh, 680px)' }}
    >
      {/* Image — top 60% */}
      <div className="relative overflow-hidden" style={{ height: '60%' }}>
        <Image
          src={item.image}
          alt={item.client}
          fill
          className="absolute inset-0 w-full h-full object-cover saturate-[0.7] contrast-[1.1] transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <span className="absolute top-5 left-5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-[#FF4D00]/20">
          {item.industry}
        </span>
      </div>

      {/* Data strip — bottom 40% */}
      <div className="flex flex-col justify-between flex-1 p-6 md:p-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2">
            {item.client}
          </h3>
          <p className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white leading-[1.1] tracking-tight mb-3">
            {item.result}
          </p>
          <div className="h-[1px] w-full bg-white/[0.08] mb-3" />
          <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-4 flex-wrap">
            {item.metrics.map((m) => (
              <span key={m} className="text-[10px] font-bold tracking-widest uppercase text-white/20">
                {m}
              </span>
            ))}
          </div>
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-white/10 text-white/30 group-hover:border-[#FF4D00] group-hover:text-[#FF4D00] transition-all duration-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessStories() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Heading SplitText
      const headingEl = section.querySelector('.cases-heading-text');
      if (headingEl && !prefersReduced) {
        const split = new SplitText(headingEl, { type: 'chars' });
        gsap.set(split.chars, { y: 60, opacity: 0 });
        gsap.to(split.chars, {
          y: 0, opacity: 1, stagger: 0.02, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        });
      }

      // Only run horizontal scroll on desktop
      if (!isDesktop || prefersReduced) return;

      const cardWidth = 520 + 32; // card + gap
      const totalWidth = cardWidth * CASES.length - window.innerWidth + 64;

      // Horizontal
      const scrollTween = gsap.to(track, {
        x: -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: track,
          start: 'top 10%',
          end: () => `+=${totalWidth}`,
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Progress bar
      if (progressRef.current) {
        gsap.fromTo(progressRef.current,
          { scaleX: 0 },
          {
            scaleX: 1, ease: 'none',
            scrollTrigger: {
              trigger: section, start: 'top top', end: () => `+=${totalWidth}`, scrub: 1.2,
            },
          }
        );
      }

      // Card entrances
      const cards = gsap.utils.toArray<HTMLElement>('.case-card');
      cards.forEach((card) => {
        gsap.from(card, {
          opacity: 0.7, y: 20, scale: 0.98, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: card, containerAnimation: scrollTween,
            start: 'left 90%', toggleActions: 'play none none none',
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [isDesktop] }
  );

  return (
    <section ref={sectionRef} id="cases" className="relative bg-[#050505] pb-32 overflow-hidden">
      {/* Heading */}
      <div className="relative z-10 pt-20 md:pt-32 pb-10 md:pb-12 px-4 md:px-16">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="h-[1px] w-12 bg-[#FF4D00]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#FF4D00]">Case Studies</span>
        </div>
        <h2 className="cases-heading-text text-[clamp(2rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tighter text-white">
          What we&rsquo;ve enabled
        </h2>
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden flex flex-col gap-6 px-4 pb-20">
        {CASES.map((item) => <CaseCard key={item.client} item={item} />)}
      </div>

      {/* Desktop: horizontal scroll track */}
      <div className='overflow-hidden'>
        <div
          ref={trackRef}
          className="hidden md:flex items-stretch gap-8 px-16 pb-28 will-change-transform"
          style={{ width: `${CASES.length * 552 + 128}px` }}
        >
          {CASES.map((item) => <CaseCard key={item.client} item={item} />)}
        </div>
      </div>

      {/* Progress bar — desktop only */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-[1px] bg-white/[0.06]">
        <div
          ref={progressRef}
          className="h-full bg-[#FF4D00] origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* BOTTOM inverted arch */}
      <div className="absolute bottom-0 left-0 w-full h-[160px] pointer-events-none z-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 160"
          preserveAspectRatio="none"
          className="block"
        >
          <path
            d="M 0,0 L 120,80 L 370,80 L 370,140
               L 630,140 L 630,80 L 880,80
               L 1000,0 L 1000,160 L 0,160 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
