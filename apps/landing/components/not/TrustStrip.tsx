'use client';

export const PARTNERS = [
  'First Bank',
  'GTBank',
  'Paystack',
  'Flutterwave',
  'Sterling',
  'Wema Bank',
];

export default function TrustStrip() {
  // Reveal disabled for debugging
  // const ref = useScrollReveal({ children: true, stagger: 0.06, y: 20 });

  return (
    <section id="trust" className="relative w-full bg-white border-y border-neutral-100 py-4">
      <div className="section-container">
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        >
          {PARTNERS.map((name, i) => (
            <div
              key={name}
              className={`flex items-center justify-center py-10 md:py-14 transition-all duration-300 hover:bg-neutral-50 group border-black/5 ${
                i % 2 === 0 ? 'border-r' : ''
              } md:border-r lg:border-r last:border-r-0`}
            >
              <span className="text-[13px] font-black tracking-[0.25em] uppercase text-black/50 group-hover:text-black transition-colors duration-300 cursor-default select-none">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
