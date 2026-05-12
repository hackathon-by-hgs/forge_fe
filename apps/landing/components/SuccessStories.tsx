'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CASES = [
  {
    client: 'Amara Foods',
    industry: 'Wholesale Distribution',
    result: '75% faster hiring',
    description:
      'Reduced hiring time from 3 days to 4 hours with a verified worker pool and automated matching across 6 distribution centers.',
    metrics: ['₦2M saved monthly', '98% attendance rate', '6 locations'],
  },
  {
    client: 'Lagos Textiles',
    industry: 'Manufacturing',
    result: 'Zero payment disputes',
    description:
      'Eliminated cash-based payment disputes and saved 20 hours per week in payroll processing for a workforce of 200+ casual workers.',
    metrics: ['20hrs saved weekly', '200+ workers', '3x scale'],
  },
  {
    client: 'QuickMart',
    industry: 'Retail Chain',
    result: '40% cost reduction',
    description:
      'Real-time visibility into casual workforce across 12 stores. Shifted from spreadsheet chaos to a single operational dashboard.',
    metrics: ['12 stores', 'Real-time tracking', '₦5M saved'],
  },
];

export default function SuccessStories() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Stagger content reveal
      const items = section.querySelectorAll('.case-item');
      
      gsap.from('.cases-header', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
        },
      });

      gsap.from(items, {
        x: -40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 50%',
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="cases" className="relative bg-white py-24 md:py-40">
      <div className="section-container relative z-10">
        {/* Section heading */}
        <div className="cases-header mb-16 grid gap-8 md:mb-24 md:grid-cols-2 md:gap-20">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Case Studies</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight text-black">
              Real results from <br />
              <span className="text-black/30">real businesses</span>
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-xl text-black/40 max-w-md leading-relaxed">
              See how businesses across Nigeria are transforming their
              operations with Forge&apos;s workforce and credit platform.
            </p>
          </div>
        </div>

        {/* Cases table */}
        <div className="border border-black/[0.08] rounded-3xl overflow-hidden bg-neutral-50/50">
          {CASES.map((item, i) => (
            <div
              key={item.client}
              className={[
                'case-item grid gap-8 p-8 transition-colors duration-500 hover:bg-white md:grid-cols-[1fr_2fr] md:gap-16 md:p-12',
                i < CASES.length - 1 ? 'border-b border-black/[0.08]' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Left */}
              <div>
                <h3 className="mb-2 text-2xl font-bold text-black md:text-3xl">
                  {item.client}
                </h3>
                <p className="mb-6 text-[13px] uppercase tracking-[0.2em] font-bold text-black/20">
                  {item.industry}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FF4D00]/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#FF4D00] border border-[#FF4D00]/10">
                  {item.result}
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col justify-between">
                <p className="mb-8 text-lg leading-relaxed text-black/60">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-6">
                  {item.metrics.map((m) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />
                      <span className="text-[13px] font-bold text-black/40 uppercase tracking-widest">
                        {m}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
