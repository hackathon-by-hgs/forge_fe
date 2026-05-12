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
    <section id="trust" className="relative bg-white border-y border-neutral-100">
      <div className="section-container">
        <div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          {PARTNERS.map((name, i) => (
            <div
              key={name}
              className={`flex items-center justify-center py-10 md:py-14 transition-all duration-300 hover:bg-neutral-50 group border-black/5 ${
                i % 2 === 0 ? 'border-r' : ''
              } md:border-r lg:border-r last:border-r-0`}
            >
              <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-black/20 group-hover:text-black/60 transition-colors duration-300 cursor-default select-none">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
