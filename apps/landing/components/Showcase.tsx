'use client';

import { useEffect, useRef, useState } from 'react';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div 
      ref={cardRef}
      className="group cursor-pointer relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0A0A0A] transition-all duration-700 hover:border-white/[0.15] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
        {/* Preview */}
        <div 
          className="h-[350px] md:h-[450px] relative flex items-center justify-center p-8 overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: isHovered ? item.accentColor.replace('0.10', '0.15').replace('0.12', '0.18') : item.accentColor }}
        >
          {/* Spotlight */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500" 
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 77, 0, 0.05), transparent 40%)`,
            }} 
          />

           <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
           
           {/* Mock UI frame */}
          <div className="relative w-full max-w-lg perspective-[1000px]">
            <div className="rounded-2xl border border-white/10 bg-[#050505] p-6 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:-translate-y-8 group-hover:rotate-x-2 group-hover:scale-[1.02]">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                </div>
                <div className="ml-4 h-4 w-32 rounded-full bg-white/[0.03]" />
              </div>
              
              <div className="space-y-4">
                <div className="h-8 w-full rounded-lg bg-white/[0.05] flex items-center px-3">
                   <div className="h-2 w-1/3 rounded-full bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 rounded-xl bg-[#FF4D00]/[0.02] border border-[#FF4D00]/5 p-4">
                    <div className="h-2 w-1/2 rounded-full bg-[#FF4D00]/20 mb-2" />
                    <div className="h-8 w-3/4 rounded-lg bg-[#FF4D00]/10" />
                  </div>
                  <div className="h-32 rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="h-2 w-1/2 rounded-full bg-white/10 mb-2" />
                    <div className="h-8 w-3/4 rounded-lg bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-10 md:p-14">
          <div className="mb-8 flex items-start justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black tracking-[0.2em] text-[#FF4D00] uppercase">FORGE SYSTEM</span>
                <div className="h-[1px] w-8 bg-white/10" />
              </div>
              <h3 className="mb-4 text-3xl font-medium text-white transition-colors duration-500 group-hover:text-[#FF4D00] md:text-5xl tracking-tight leading-none">
                {item.title}
              </h3>
              <p className="text-xl text-white/40 font-light leading-relaxed">{item.desc}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.05] bg-white/[0.02] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] transition-all duration-500 group-hover:border-[#FF4D00] group-hover:bg-[#FF4D00] group-hover:scale-110 shadow-xl">
              <svg
                className="h-6 w-6 text-white/40 transition-all duration-500 group-hover:text-black group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
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
