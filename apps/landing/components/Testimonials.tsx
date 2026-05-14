'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const TESTIMONIALS = [
  {
    quote:
      'Forge has fundamentally changed how we manage our workforce. What used to take our HR team days now happens automatically.',
    author: 'Adaeze Nwankwo',
    role: 'CEO',
    company: 'Lagos Fresh Produce',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop&crop=face',
  },
  {
    quote:
      'I finally have real data to make lending decisions for informal workers. Their work history tells me more than any traditional credit check.',
    author: 'Ibrahim Yusuf',
    role: 'Credit Officer',
    company: 'GTBank',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop&crop=face',
  },
  {
    quote:
      'I get paid the same day now and my Forge score helped me get a loan to buy a delivery bike. No bank would talk to me before.',
    author: 'Emmanuel Obi',
    role: 'Delivery Worker',
    company: 'Lagos',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop&crop=face',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      const panels = gsap.utils.toArray<HTMLElement>('.testimonial-panel');

      panels.forEach((panel, i) => {
        const quoteEl = panel.querySelector('.testimonial-quote');
        const quoteMark = panel.querySelector('.testimonial-mark');
        const infoEl = panel.querySelector('.testimonial-info');

        // Pin each testimonial for one viewport scroll
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=100%',
          pin: true,
          pinSpacing: true,
        });

        if (prefersReduced) return;

        // Quote mark entrance
        if (quoteMark) {
          gsap.fromTo(
            quoteMark,
            { scale: 0.6, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: 'top 60%',
                toggleActions: 'play none none none',
              },
            }
          );
        }

        // SplitText quote lines
        if (quoteEl) {
          const split = new SplitText(quoteEl, { type: 'lines' });

          // Wrap each line for clip overflow
          split.lines.forEach((line) => {
            const wrapper = document.createElement('div');
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'block';
            line.parentNode!.insertBefore(wrapper, line);
            wrapper.appendChild(line);
          });

          gsap.set(split.lines, { y: '100%', opacity: 0 });
          gsap.to(split.lines, {
            y: '0%',
            opacity: 1,
            stagger: 0.06,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: panel,
              start: 'top 50%',
              toggleActions: 'play none none none',
            },
          });
        }

        // Client info fade in
        if (infoEl) {
          gsap.fromTo(
            infoEl,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: 'top 40%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="testimonials" className="relative bg-[#050505]">
      {TESTIMONIALS.map((item, i) => (
        <div
          key={item.author}
          className="testimonial-panel relative min-h-screen flex items-center bg-[#050505]"
        >
          {/* Background accent glow */}
          <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#FF4D00] opacity-[0.03] blur-[160px] pointer-events-none" />

          <div className="section-container relative z-10 py-16 md:py-24">
            <div className="grid gap-12 md:grid-cols-[1fr_auto] items-center">
              {/* Quote area */}
              <div className="relative max-w-5xl">
                {/* Giant quote mark */}
                <span className="testimonial-mark absolute -top-10 -left-2 md:-top-16 md:-left-4 text-[120px] md:text-[200px] leading-none text-[#FF4D00] opacity-20 font-serif select-none pointer-events-none">
                  &ldquo;
                </span>

                <blockquote className="testimonial-quote relative z-10 text-[clamp(1.5rem,4vw,4.5rem)] font-medium text-white leading-[1.2] tracking-tight mb-8 md:mb-12">
                  {item.quote}
                </blockquote>

                {/* Client info */}
                <div className="testimonial-info flex items-center gap-4">
                  <div className="h-10 w-[2px] bg-[#FF4D00]" />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-widest">
                      {item.author}
                    </p>
                    <p className="text-[13px] text-white/30">
                      {item.role}, {item.company}
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar — hidden on smallest screens */}
              <div className="hidden sm:block flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Index counter */}
            <div className="absolute bottom-6 right-6 md:bottom-16 md:right-16 text-[10px] md:text-[11px] font-bold tracking-[0.3em] text-white/10 uppercase">
              {String(i + 1).padStart(2, '0')} / {String(TESTIMONIALS.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
