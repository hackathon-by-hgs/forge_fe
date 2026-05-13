'use client';

import { useScrollReveal } from '@/hooks';

const PROBLEMS = [
  {
    num: '01',
    problem: 'Finding reliable workers takes days',
    solution:
      'Verified worker pool with reliability scores. Post a job, get matched in hours, not days.',
  },
  {
    num: '02',
    problem: 'Cash payroll creates disputes',
    solution:
      'Automated digital payments on completion. Full audit trail, zero cash handling.',
  },
  {
    num: '03',
    problem: 'Workers can’t access credit',
    solution:
      'Work history becomes credit history. Every job builds a behavioral score for microloans.',
  },
  {
    num: '04',
    problem: 'No visibility into workforce',
    solution:
      'Real-time GPS tracking, attendance verification, and multi-location dashboards.',
  },
];

export default function Challenges() {
  return (
    <section
      id="about"
      className="relative bg-white py-24 text-black md:py-40"
    >
      <div className="section-container relative z-10">
        <div className="mb-16 md:mb-24">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Why Forge</span>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight max-w-4xl text-black">
            Built for the problems <br />
            <span className="text-black/30">you actually face</span>
          </h2>
        </div>

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
      className="group grid gap-6 border-b border-black/[0.08] py-10 transition-colors duration-500 hover:bg-neutral-50 md:grid-cols-[80px_1fr_1fr] md:gap-12 md:py-14"
    >
      <span className="pt-1 text-sm font-bold tracking-[0.2em] text-black/10">
        {item.num}
      </span>
      <h3 className="text-xl font-bold text-black transition-colors duration-300 group-hover:text-[#FF4D00] md:text-2xl lg:text-3xl">
        {item.problem}
      </h3>
      <p className="text-lg leading-relaxed text-black/40">
        {item.solution}
      </p>
    </div>
  );
}
