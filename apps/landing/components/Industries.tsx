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
  const gridRef    = useScrollReveal({ children: true, stagger: 0.08, y: 30 });

  return (
    <section id="industries" className="relative bg-white py-24 md:py-40">
      <div className="section-container relative z-10">
        {/* Heading */}
        <div
          ref={headingRef}
          className="mb-16 grid gap-8 md:mb-24 md:grid-cols-2 md:gap-20"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Industries</span>
            <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight text-black">
              Sectors we <br />
              <span className="text-black/30">serve</span>
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-xl text-black/40 max-w-md leading-relaxed">
              Forge adapts to the unique workforce challenges of every sector in
              Nigeria&apos;s informal economy.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid border border-black/[0.08] md:grid-cols-2 lg:grid-cols-3"
        >
          {INDUSTRIES.map((item) => (
            <div
              key={item.num}
              className="group p-8 border-b border-r border-black/[0.08] transition-all duration-500 hover:bg-neutral-50 md:p-12 last:border-b-0"
            >
              <span className="mb-8 block text-sm font-bold tracking-widest text-black/10">
                {item.num}
              </span>
              <h3 className="mb-4 text-2xl font-bold text-black transition-colors duration-500 group-hover:text-[#FF4D00]">
                {item.name}
              </h3>
              <p className="text-lg leading-relaxed text-black/30">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
