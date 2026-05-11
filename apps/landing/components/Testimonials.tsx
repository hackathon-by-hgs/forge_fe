'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    quote: 'Forge has fundamentally changed how we manage our workforce. What used to take our HR team days now happens automatically.',
    author: 'Adaeze Nwankwo',
    role: 'CEO, Lagos Fresh Produce',
  },
  {
    quote: 'I finally have real data to make lending decisions for informal workers. Their work history tells me more than any traditional credit check.',
    author: 'Ibrahim Yusuf',
    role: 'Credit Officer, GTBank',
  },
  {
    quote: 'I get paid the same day now and my Forge score helped me get a loan to buy a delivery bike. No bank would talk to me before.',
    author: 'Emmanuel Obi',
    role: 'Delivery Worker, Lagos',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const current = TESTIMONIALS[active];

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Entry animation
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from(section.querySelector('.test-heading'), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    });

    return () => ctx.revert();
  }, []);

  if (!current) return null;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative bg-black py-24 md:py-40"
    >
      <div className="section-container">
        <div className="divider mb-16 md:mb-24" />

        <div className="test-heading mb-6">
          <span className="eyebrow mb-8 block">What People Say</span>
        </div>

        {/* Big quote — Phenomenon style: massive, left-aligned */}
        <div ref={quoteRef} className="mb-16">
          <blockquote
            key={active}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white max-w-5xl mb-12"
            style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
          >
            &ldquo;{current.quote}&rdquo;
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-px h-10 bg-forge-accent" />
            <div>
              <p className="text-sm font-semibold text-white">{current.author}</p>
              <p className="text-[13px] text-white/30">{current.role}</p>
            </div>
          </div>
        </div>

        {/* Pagination — Phenomenon uses thin progress bars */}
        <div className="flex gap-2 max-w-xs">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              id={`testimonial-dot-${i}`}
              onClick={() => setActive(i)}
              className="relative h-[2px] flex-1 bg-white/10 overflow-hidden"
              aria-label={`View testimonial ${i + 1}`}
            >
              <div
                className={`absolute inset-y-0 left-0 bg-forge-accent transition-all duration-500 ${
                  active === i ? 'w-full' : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="divider mt-16 md:mt-24" />
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
