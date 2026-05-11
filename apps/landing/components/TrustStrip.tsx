'use client';

import { useScrollReveal } from '@/hooks';

const PARTNERS = [
  'First Bank',
  'GTBank',
  'Paystack',
  'Flutterwave',
  'Sterling',
  'Wema Bank',
];

export default function TrustStrip() {
  const ref = useScrollReveal({ children: true, stagger: 0.06, y: 20 });

  return (
    <section id="trust" className="relative bg-black">
      <div className="section-container">
        {/* Hairline top border */}
        <div className="divider" />

        {/* Grid with hairline borders — Phenomenon signature */}
        <div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          {PARTNERS.map((name, i) => (
            <div
              key={name}
              className={`flex items-center justify-center py-10 md:py-14 transition-colors duration-300 hover:bg-white/[0.02] ${
                i < PARTNERS.length - 1 ? 'border-r border-white/[0.08]' : ''
              } ${i < PARTNERS.length - (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 6 : 2) ? 'border-b border-white/[0.08] lg:border-b-0' : ''}`}
              style={{
                borderRight: (i + 1) % (6) === 0 ? 'none' : undefined,
              }}
            >
              <span className="text-[13px] font-semibold tracking-[0.15em] uppercase text-white/20 hover:text-white/40 transition-colors duration-300 cursor-default select-none">
                {name}
              </span>
            </div>
          ))}
        </div>

        <div className="divider" />
      </div>
    </section>
  );
}
