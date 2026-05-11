'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SHOWCASES = [
  {
    title: 'Jobs Dashboard',
    desc: 'Post jobs, review applications, and track active assignments. Our employer dashboard gives you real-time visibility into your entire hiring pipeline.',
    tags: ['Employer Portal', 'Real-time', 'Analytics'],
    year: '2024',
    gradient: 'from-forge-accent/15 to-orange-900/10',
  },
  {
    title: 'Payments Engine',
    desc: 'Automated digital payments upon job completion. Real-time transaction tracking, batch invoicing, and complete financial audit trails for every payment.',
    tags: ['Payroll', 'Digital Wallets', 'Audit'],
    year: '2024',
    gradient: 'from-emerald-500/15 to-teal-900/10',
  },
  {
    title: 'Credit Intelligence',
    desc: 'Behavioral credit scoring built from real work data. A Risk Radar dashboard for banks to monitor portfolios, manage loans, and score risk in real-time.',
    tags: ['ML Scoring', 'Risk Radar', 'Banking'],
    year: '2024',
    gradient: 'from-blue-500/15 to-indigo-900/10',
  },
  {
    title: 'Worker App',
    desc: 'A simple, USSD-first interface for workers to find jobs, receive payments, and build their digital identity. Built for low-bandwidth environments.',
    tags: ['USSD', 'Identity', 'Fintech'],
    year: '2024',
    gradient: 'from-purple-500/15 to-pink-900/10',
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
        }
      );
      return () => pin.kill();
    });

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="showcase" 
      className="relative bg-black overflow-hidden"
    >
      <div className="min-h-screen flex flex-col justify-center">
        <div className="section-container mb-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-20">
            <div>
              <span className="eyebrow mb-6 block">Featured Work</span>
              <h2 className="text-display">
                Products we&apos;ve{' '}
                <span className="text-forge-accent">built</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-body-lg text-white/35 max-w-md">
                Interconnected products powering every side of the
                informal economy ecosystem. <span className="text-forge-accent font-medium">Scroll to explore.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Container */}
        <div 
          ref={triggerRef} 
          className="flex gap-8 px-6 md:px-12 lg:px-20 w-max"
        >
          {SHOWCASES.map((item, i) => (
            <div 
              key={item.title} 
              className="w-[85vw] md:w-[60vw] lg:w-[45vw] flex-shrink-0"
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
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] transition-all duration-500 hover:border-white/[0.12] bg-[#0a0a0a]">
        {/* Preview area */}
        <div className={`relative h-[300px] md:h-[400px] bg-gradient-to-br \${item.gradient} flex items-end p-8 overflow-hidden`}>
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Mock interface */}
          <div className="relative w-full">
            <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-2xl transition-transform duration-700 group-hover:translate-y-[-8px]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="ml-3 text-[10px] text-white/20 tracking-wider uppercase">{item.title}</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 h-8 rounded bg-white/[0.04]" />
                <div className="h-8 rounded bg-white/[0.04]" />
                <div className="col-span-2 h-24 rounded bg-white/[0.03]" />
                <div className="col-span-2 h-24 rounded bg-white/[0.03]" />
              </div>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-forge-accent transition-colors duration-300">
                {item.title}
              </h3>
              <p className="text-sm text-white/30 line-clamp-2">
                {item.desc}
              </p>
            </div>
            <span className="text-[11px] font-medium text-white/20 mt-2">{item.year}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/[0.08] text-white/25">
                  {tag}
                </span>
              ))}
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-forge-accent transition-colors duration-300">
              <svg className="w-4 h-4 text-white/30 group-hover:text-forge-accent transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
