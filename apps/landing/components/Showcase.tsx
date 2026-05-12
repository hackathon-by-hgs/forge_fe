'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SHOWCASES = [
  {
    title: 'Jobs Dashboard',
    desc: 'Post jobs, review applications, and track active assignments. Real-time visibility into your entire hiring pipeline.',
    tags: ['Employer Portal', 'Real-time', 'Analytics'],
    year: '2024',
    accentColor: 'rgba(255,77,0,0.12)',
  },
  {
    title: 'Payments Engine',
    desc: 'Automated digital payments upon job completion. Real-time tracking, batch invoicing, and complete financial audit trails.',
    tags: ['Payroll', 'Digital Wallets', 'Audit'],
    year: '2024',
    accentColor: 'rgba(16,185,129,0.10)',
  },
  {
    title: 'Credit Intelligence',
    desc: 'Behavioral credit scoring from real work data. A Risk Radar for banks to monitor portfolios and score risk in real-time.',
    tags: ['ML Scoring', 'Risk Radar', 'Banking'],
    year: '2024',
    accentColor: 'rgba(59,130,246,0.10)',
  },
  {
    title: 'Worker App',
    desc: 'A simple, USSD-first interface for workers to find jobs, receive payments, and build their digital identity.',
    tags: ['USSD', 'Identity', 'Fintech'],
    year: '2024',
    accentColor: 'rgba(139,92,246,0.10)',
  },
];

export default function Showcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const pin = gsap.fromTo(
        triggerRef.current,
        { x: 0 },
        {
          x: () => -(triggerRef.current!.scrollWidth - window.innerWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${triggerRef.current!.scrollWidth}`,
            invalidateOnRefresh: true,
          },
        },
      );
      return () => pin.kill();
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="showcase"
      className="relative overflow-hidden"
    >
      <div className="relative z-10 flex min-h-screen flex-col justify-center py-20">
        {/* Heading */}
        <div className="section-container mb-12">
          <div className="grid gap-8 md:grid-cols-2 md:gap-20">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Featured Work</span>
              <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight text-white">
                Products we&apos;ve <br />
                <span className="text-white/30">built</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-lg text-white/30 max-w-md leading-relaxed">
                Interconnected products powering every side of the informal
                economy ecosystem.{' '}
                <span className="font-bold text-[#FF4D00]">
                  Scroll to explore.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={triggerRef}
          className="flex w-max gap-8 px-6 md:px-12 lg:px-20"
        >
          {SHOWCASES.map((item, i) => (
            <div
              key={item.title}
              className="w-[85vw] flex-shrink-0 md:w-[60vw] lg:w-[45vw]"
            >
              <ShowcaseCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  item,
}: {
  item: (typeof SHOWCASES)[number];
  index: number;
}) {
  return (
    <div className="group cursor-pointer">
      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04]">
        {/* Preview */}
        <div 
          className="h-[300px] md:h-[400px] relative flex items-center justify-center p-8 overflow-hidden"
          style={{ backgroundColor: item.accentColor }}
        >
           <div className="absolute inset-0 bg-dot-grid opacity-20" />
           {/* Mock UI frame */}
          <div className="relative w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black p-6 shadow-2xl transition-transform duration-700 group-hover:-translate-y-4">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500/40" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/40" />
                <div className="h-2 w-2 rounded-full bg-green-500/40" />
                <span className="ml-4 text-[10px] font-bold uppercase tracking-widest text-white/10">
                  {item.title} — FORGE SYSTEM
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 h-10 rounded-lg bg-white/[0.05]" />
                <div className="h-10 rounded-lg bg-white/[0.05]" />
                <div className="col-span-2 h-32 rounded-lg bg-white/[0.03]" />
                <div className="col-span-2 h-32 rounded-lg bg-white/[0.03]" />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-8 md:p-12">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="mb-3 text-2xl font-bold text-white transition-colors duration-300 group-hover:text-[#FF4D00] md:text-3xl">
                {item.title}
              </h3>
              <p className="line-clamp-2 text-lg text-white/30">{item.desc}</p>
            </div>
            <span className="mt-2 text-xs font-bold text-white/20 tracking-widest">
              {item.year}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.08] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 transition-all duration-500 group-hover:border-[#FF4D00] group-hover:bg-[#FF4D00]">
              <svg
                className="h-5 w-5 text-white/30 transition-all duration-500 group-hover:text-black group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
