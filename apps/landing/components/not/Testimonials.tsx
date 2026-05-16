'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger, SplitText);

const TESTIMONIALS = [
  {
    quote:
      'Forge has fundamentally changed how we manage our workforce. What used to take our HR team days now happens automatically.',
    author: 'Adaeze Nwankwo',
    role: 'CEO',
    company: 'Lagos Fresh Produce',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop&crop=face',
    accent: '#FF4D00',
  },
  {
    quote:
      'I finally have real data to make lending decisions for informal workers. Their work history tells me more than any traditional credit check.',
    author: 'Ibrahim Yusuf',
    role: 'Credit Officer',
    company: 'GTBank',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop&crop=face',
    accent: '#ffffff',
  },
  {
    quote:
      'I get paid the same day now and my Forge score helped me get a loan to buy a delivery bike. No bank would talk to me before.',
    author: 'Emmanuel Obi',
    role: 'Delivery Worker',
    company: 'Lagos',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop&crop=face',
    accent: '#FF4D00',
  },
];

export default function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const panels = gsap.utils.toArray<HTMLElement>('.testimonial-panel');

      panels.forEach((panel) => {
        const content = panel.querySelector('.testimonial-content');
        const quote = panel.querySelector('.testimonial-quote');
        const info = panel.querySelector('.testimonial-info');
        const avatar = panel.querySelector('.testimonial-avatar');
        const bgWord = panel.querySelector('.testimonial-bg-word');
        const glow = panel.querySelector('.testimonial-glow');

        // Main pinning for this panel
        ScrollTrigger.create({
          trigger: panel,
          start: 'top top',
          end: '+=150%',
          pin: true,
          pinSpacing: true,
          scrub: true,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: 'top top',
            end: '+=100%',
            scrub: 1,
          },
        });

        // 1. Background word moves across and fades
        tl.fromTo(bgWord, 
          { xPercent: 20, opacity: 0, scale: 1.2 },
          { xPercent: -20, opacity: 0.05, scale: 1, duration: 1, ease: 'none' }
        );

        // 2. Content entrance (coordinated)
        const contentTl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            start: 'top 30%',
            end: 'top -20%',
            toggleActions: 'play reverse play reverse',
          }
        });

        if (quote) {
          const split = new SplitText(quote, { type: 'words' });
          contentTl.from(split.words, {
            opacity: 0,
            y: 40,
            rotate: 5,
            stagger: 0.02,
            duration: 0.8,
            ease: 'power4.out',
          }, 0);
        }

        if (avatar) {
          contentTl.from(avatar, {
            opacity: 0,
            scale: 0.8,
            rotateY: 45,
            x: 50,
            duration: 1,
            ease: 'expo.out',
          }, 0.2);
        }

        if (info) {
          contentTl.from(info, {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power3.out',
          }, 0.4);
        }

        // 3. Glow parallax
        gsap.to(glow, {
          x: 100,
          y: -50,
          scale: 1.5,
          scrollTrigger: {
            trigger: panel,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        });

        // 4. Panel exit (optional scale down)
        gsap.to(content, {
          scale: 0.9,
          opacity: 0,
          filter: 'blur(10px)',
          scrollTrigger: {
            trigger: panel,
            start: 'top -50%',
            end: 'top -100%',
            scrub: true,
          }
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="testimonials" className="relative bg-black overflow-hidden">
      {TESTIMONIALS.map((item, i) => (
        <div
          key={item.author}
          className="testimonial-panel relative min-h-screen flex items-center justify-center bg-black border-t border-white/5"
        >
          {/* Large background wordmark */}
          <div className="testimonial-bg-word absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[30vw] font-black uppercase tracking-tighter text-white opacity-0">
              {item.company.split(' ')[0]}
            </span>
          </div>

          {/* Background accent glow */}
          <div 
            className="testimonial-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px] opacity-[0.05] pointer-events-none"
            style={{ backgroundColor: item.accent }}
          />

          <div className="testimonial-content section-container relative z-10 py-20 w-full">
            <div className="grid gap-16 lg:grid-cols-[1fr_auto] items-center">
              {/* Quote area */}
              <div className="relative max-w-4xl">
                <span className="absolute -top-20 -left-10 text-[240px] leading-none text-white/5 font-serif select-none pointer-events-none">
                  &ldquo;
                </span>

                <blockquote className="testimonial-quote relative z-10 text-[clamp(2rem,5vw,5rem)] font-medium text-white leading-[1.1] tracking-tight mb-12 perspective-1000">
                  {item.quote}
                </blockquote>

                {/* Client info */}
                <div className="testimonial-info flex items-center gap-6">
                  <div className="h-12 w-[1px] bg-white/20" />
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-[0.3em] mb-1">
                      {item.author}
                    </p>
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
                      {item.role} <span className="mx-2 text-white/10">/</span> {item.company}
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar area */}
              <div className="hidden lg:block">
                <div className="testimonial-avatar relative w-64 h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <Image
                    src={item.avatar}
                    alt={item.author}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="h-[2px] w-12 bg-white/30 mb-2" />
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Verified User</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Index counter */}
            <div className="absolute bottom-0 right-0 text-[120px] font-black text-white/[0.02] leading-none select-none pointer-events-none">
              {String(i + 1).padStart(2, '0')}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
