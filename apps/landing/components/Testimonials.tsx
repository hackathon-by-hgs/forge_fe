'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    quote:
      'Forge has fundamentally changed how we manage our workforce. What used to take our HR team days now happens automatically.',
    author: 'Adaeze Nwankwo',
    role: 'CEO, Lagos Fresh Produce',
  },
  {
    quote:
      'I finally have real data to make lending decisions for informal workers. Their work history tells me more than any traditional credit check.',
    author: 'Ibrahim Yusuf',
    role: 'Credit Officer, GTBank',
  },
  {
    quote:
      'I get paid the same day now and my Forge score helped me get a loan to buy a delivery bike. No bank would talk to me before.',
    author: 'Emmanuel Obi',
    role: 'Delivery Worker, Lagos',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive]   = useState(0);

  const current = TESTIMONIALS[active];

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.from(section.querySelector('.test-heading'), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
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
      className="relative py-24 md:py-40 bg-black"
    >
      <div className="section-container relative z-10">
        <div className="test-heading mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-8 block">What People Say</span>
        </div>

        {/* Big rotating quote */}
        <div className="mb-16">
          <blockquote
            key={active}
            className="mb-12 max-w-5xl text-3xl font-medium leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl"
            style={{
              animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            &ldquo;{current.quote}&rdquo;
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="h-10 w-0.5 bg-[#FF4D00]" />
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-widest">
                {current.author}
              </p>
              <p className="text-[13px] text-white/30">{current.role}</p>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex max-w-xs gap-3">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="relative h-[2px] flex-1 overflow-hidden bg-white/10"
              aria-label={`View testimonial ${i + 1}`}
            >
              <div
                className={`absolute inset-y-0 left-0 bg-[#FF4D00] transition-all duration-500 ${
                  active === i ? 'w-full' : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
