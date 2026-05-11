'use client';

import { useCounter } from '@/hooks';
import { useScrollReveal } from '@/hooks';

interface StatItemProps {
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

function StatItem({ end, suffix, label, decimals = 0 }: StatItemProps) {
  const { ref, value } = useCounter({ end, duration: 2200, decimals });

  return (
    <div className="flex flex-col p-8 md:p-12">
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-4"
      >
        {value}
        <span className="text-forge-accent">{suffix}</span>
      </span>
      <span className="text-[13px] text-white/30 tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

const STATS: StatItemProps[] = [
  { end: 50, suffix: 'K+', label: 'Workers Connected' },
  { end: 120, suffix: 'K+', label: 'Jobs Completed' },
  { end: 2.5, suffix: 'B', label: 'Naira Processed', decimals: 1 },
  { end: 4, suffix: 'hrs', label: 'Average Time-to-hire' },
];

export default function Stats() {
  const containerRef = useScrollReveal({ children: true, stagger: 0.1, y: 30 });

  return (
    <section id="stats" className="relative bg-black py-20 md:py-32">
      <div className="section-container">
        {/* Left-aligned heading */}
        <div className="mb-16">
          <span className="eyebrow mb-4 block">By the Numbers</span>
          <h2 className="text-display max-w-3xl">
            Powering Nigeria&apos;s{' '}
            <span className="text-forge-accent">informal economy</span>
          </h2>
        </div>

        {/* Grid with hairline borders — Phenomenon style */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/[0.08]"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`${
                i < STATS.length - 1 ? 'border-b sm:border-b lg:border-b-0 lg:border-r border-white/[0.08]' : ''
              } ${i === 1 ? 'sm:border-r-0 lg:border-r border-white/[0.08]' : ''}`}
            >
              <StatItem {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
