'use client';

import { useScrollReveal } from '@/hooks';
import Odometer from '../Odometer';

export interface StatItemProps {
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

export function StatItem({ end, suffix, label, decimals = 0 }: StatItemProps) {
  return (
    <div className="flex flex-col p-10 md:p-16">
      <span className="mb-4 text-6xl font-medium tracking-tighter text-black md:text-8xl lg:text-9xl">
        <Odometer value={end} decimals={decimals} className="font-inherit" />
        <span className="text-[#FF4D00]">{suffix}</span>
      </span>
      <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-black/30">
        {label}
      </span>
    </div>
  );
}

export const STATS: StatItemProps[] = [
  { end: 50,  suffix: 'K+',  label: 'Workers Connected' },
  { end: 120, suffix: 'K+',  label: 'Jobs Completed' },
  { end: 2.5, suffix: 'B',   label: 'Naira Processed', decimals: 1 },
  { end: 4,   suffix: 'hrs', label: 'Time-to-hire' },
];

export default function Stats() {
  const containerRef = useScrollReveal({ children: true, stagger: 0.1, y: 30 });

  return (
    <section id="stats" className="relative bg-white py-24 md:py-40">
      <div className="section-container relative z-10">
        <div className="mb-20">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Our Impact</span>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight max-w-3xl text-black">
            Real data for <br />
            <span className="text-black/30"> Nigeria&apos;s economy.</span>
          </h2>
        </div>

        {/* Stats grid with ultra-thin hairline borders */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 border border-black/[0.05] sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                'border-black/[0.05]',
                i < STATS.length - 1 ? 'border-b sm:border-b lg:border-b-0 lg:border-r' : '',
                i === 1 ? 'sm:border-r-0 lg:border-r' : '',
              ].join(' ')}
            >
              <StatItem {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
