'use client';

import { useScrollReveal } from '@/hooks';

const INDUSTRIES = [
  {
    num: '01',
    name: 'Wholesale & Distribution',
    desc: 'Verified worker pools for loading, unloading, and warehouse operations. GPS-verified attendance across multiple distribution centers.',
  },
  {
    num: '02',
    name: 'Manufacturing',
    desc: 'Rapid scaling for seasonal demand spikes. Digital safety compliance tracking and multi-facility shift management.',
  },
  {
    num: '03',
    name: 'Retail & Services',
    desc: 'Reliability-scored workers for customer-facing roles. Automated shift scheduling and instant pay on completion.',
  },
  {
    num: '04',
    name: 'Logistics & Delivery',
    desc: 'Real-time GPS tracking of riders. Photo proof of delivery, instant payment, and credit scoring for fleet scaling.',
  },
  {
    num: '05',
    name: 'Construction',
    desc: 'Skilled and unskilled labor matching for project-based work. Safety certifications and attendance tracking on-site.',
  },
  {
    num: '06',
    name: 'Agriculture',
    desc: 'Seasonal labor management for harvesting and processing. Mobile payments for rural workers without bank accounts.',
  },
];

export default function Industries() {
  const headingRef = useScrollReveal({ y: 30 });
  const gridRef = useScrollReveal({ children: true, stagger: 0.08, y: 30 });

  return (
    <section id="industries" className="relative bg-black py-24 md:py-40">
      <div className="section-container">
        {/* Heading */}
        <div ref={headingRef} className="grid md:grid-cols-2 gap-8 md:gap-20 mb-16 md:mb-24">
          <div>
            <span className="eyebrow mb-6 block">Industries</span>
            <h2 className="text-display">
              Sectors we{' '}
              <span className="text-forge-accent">serve</span>
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-body-lg text-white/35 max-w-md">
              Forge adapts to the unique workforce challenges of every
              sector in Nigeria&apos;s informal economy.
            </p>
          </div>
        </div>

        {/* Grid — 2×3 bordered cells, Phenomenon style */}
        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-3 border border-white/[0.08]">
          {INDUSTRIES.map((item, i) => (
            <div
              key={item.num}
              className={`p-8 md:p-10 transition-colors duration-300 hover:bg-white/[0.02] group ${
                i % 3 !== 2 ? 'lg:border-r border-white/[0.08]' : ''
              } ${i % 2 !== 1 ? 'md:border-r lg:border-r-0 border-white/[0.08]' : ''
              } ${i < INDUSTRIES.length - (3) ? 'border-b border-white/[0.08]' : ''
              } ${i < INDUSTRIES.length - 2 ? 'md:border-b border-white/[0.08]' : ''}`}
            >
              <span className="text-xs font-medium text-white/15 block mb-6">
                {item.num}
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-forge-accent transition-colors duration-300">
                {item.name}
              </h3>
              <p className="text-[14px] text-white/30 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
