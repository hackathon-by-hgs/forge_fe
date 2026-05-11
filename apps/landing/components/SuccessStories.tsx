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
    description: 'Reduced hiring time from 3 days to 4 hours with a verified worker pool and automated matching across 6 distribution centers.',
    metrics: ['₦2M saved monthly', '98% attendance rate', '6 locations'],
  },
  {
    client: 'Lagos Textiles',
    industry: 'Manufacturing',
    result: 'Zero payment disputes',
    description: 'Eliminated cash-based payment disputes and saved 20 hours per week in payroll processing for a workforce of 200+ casual workers.',
    metrics: ['20hrs saved weekly', '200+ workers', '3x scale'],
  },
  {
    client: 'QuickMart',
    industry: 'Retail Chain',
    result: '40% cost reduction',
    description: 'Real-time visibility into casual workforce across 12 stores. Shifted from spreadsheet chaos to a single operational dashboard.',
    metrics: ['12 stores', 'Real-time tracking', '₦5M saved'],
  },
];

export default function SuccessStories() {
  const sectionRef = useRef<HTMLElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const portal = portalRef.current;
    if (!section || !portal) return;

    const ctx = gsap.context(() => {
      // Clip-path portal reveal — THE signature Phenomenon transition
      gsap.fromTo(
        portal,
        { clipPath: 'inset(10% 5% 10% 5% round 32px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            end: 'top 5%',
            scrub: 1.5,
          },
        },
      );

      // Stagger content inside
      const items = portal.querySelectorAll('.case-item');
      gsap.from(items, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: portal,
          start: 'top 40%',
          toggleActions: 'play none none none',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="cases" className="relative">
      {/* Portal container — warm cream/off-white, like Phenomenon's light sections */}
      <div
        ref={portalRef}
        className="bg-[#F5F5F0] text-[#1a1a1a]"
        style={{ clipPath: 'inset(10% 5% 10% 5% round 32px)' }}
      >
        <div className="section-container py-24 md:py-40">
          {/* Section heading */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-20 mb-16 md:mb-24">
            <div>
              <span className="eyebrow-dark mb-6 block">Case Studies</span>
              <h2 className="text-display text-[#1a1a1a]">
                Real results from{' '}
                <span className="text-forge-accent">real businesses</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-body-lg text-black/40 max-w-md">
                See how businesses across Nigeria are transforming their
                operations with Forge&apos;s workforce and credit platform.
              </p>
            </div>
          </div>

          {/* Cases — horizontal grid with borders */}
          <div className="border border-black/[0.08]">
            {CASES.map((item, i) => (
              <div
                key={item.client}
                className={`case-item grid md:grid-cols-[1fr_2fr] gap-8 md:gap-16 p-8 md:p-12 ${
                  i < CASES.length - 1 ? 'border-b border-black/[0.08]' : ''
                } transition-colors duration-300 hover:bg-black/[0.02]`}
              >
                {/* Left — client info */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
                    {item.client}
                  </h3>
                  <p className="text-[13px] uppercase tracking-wider text-black/30 mb-6">
                    {item.industry}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forge-accent/10 text-forge-accent text-sm font-semibold">
                    {item.result}
                  </div>
                </div>

                {/* Right — description + metrics */}
                <div className="flex flex-col justify-between">
                  <p className="text-[15px] text-black/50 leading-relaxed mb-8">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-6">
                    {item.metrics.map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-forge-accent" />
                        <span className="text-[13px] font-semibold text-black/60">
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
      </div>
    </section>
  );
}
