'use client';

import { useScrollReveal } from '@/hooks';

const PROBLEMS = [
  {
    num: '01',
    problem: 'Finding reliable workers takes days',
    solution: 'Verified worker pool with reliability scores. Post a job, get matched in hours, not days.',
  },
  {
    num: '02',
    problem: 'Cash payroll creates disputes',
    solution: 'Automated digital payments on completion. Full audit trail, zero cash handling.',
  },
  {
    num: '03',
    problem: 'Workers can\u2019t access credit',
    solution: 'Work history becomes credit history. Every job builds a behavioral score for microloans.',
  },
  {
    num: '04',
    problem: 'No visibility into workforce',
    solution: 'Real-time GPS tracking, attendance verification, and multi-location dashboards.',
  },
];

export default function Challenges() {
  return (
    <section id="about" className="relative bg-[#F5F5F0] text-[#1a1a1a] py-24 md:py-40">
      <div className="section-container">
        {/* Heading */}
        <div className="mb-16 md:mb-24">
          <span className="eyebrow-dark mb-6 block">Why Forge</span>
          <h2 className="text-display text-[#1a1a1a] max-w-4xl">
            Built for the problems{' '}
            <span className="text-forge-accent">you actually face</span>
          </h2>
        </div>

        {/* Problem → Solution grid with borders */}
        <div className="border-t border-black/[0.08]">
          {PROBLEMS.map((item, i) => (
            <ProblemRow key={item.num} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemRow({
  item,
  index,
}: {
  item: (typeof PROBLEMS)[number];
  index: number;
}) {
  const ref = useScrollReveal({ y: 25, duration: 0.7, delay: index * 0.05 });

  return (
    <div
      ref={ref}
      className="grid md:grid-cols-[80px_1fr_1fr] gap-6 md:gap-12 py-10 md:py-14 border-b border-black/[0.08] transition-colors duration-300 hover:bg-black/[0.015] group"
    >
      {/* Number */}
      <span className="text-sm font-medium text-black/20 pt-1">
        {item.num}
      </span>

      {/* Problem */}
      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1a1a] transition-colors duration-300 group-hover:text-forge-accent">
        {item.problem}
      </h3>

      {/* Solution */}
      <p className="text-[15px] text-black/40 leading-relaxed">
        {item.solution}
      </p>
    </div>
  );
}
