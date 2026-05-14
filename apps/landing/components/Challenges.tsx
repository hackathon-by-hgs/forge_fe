'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const CHALLENGES = [
  {
    num: '01',
    title: 'Finding reliable workers takes days',
    desc: 'Manual recruitment through word-of-mouth and roadside hiring leads to inconsistent quality, no-shows, and wasted operational hours.',
    sticky:
      'The hiring pipeline for informal labor is fundamentally broken — built on trust networks that don\'t scale.',
  },
  {
    num: '02',
    title: 'Cash payroll creates disputes',
    desc: 'Without digital audit trails, cash-based payments cause friction, theft claims, and zero accountability across every pay cycle.',
    sticky:
      'Cash economies breed mistrust. Every naira paid without a receipt is a dispute waiting to happen.',
  },
  {
    num: '03',
    title: 'Workers can\'t access credit',
    desc: 'No formal employment records means no credit history. Banks reject applications from workers who\'ve never missed a day of work.',
    sticky:
      '150 million Nigerians are locked out of formal credit — not because they\'re risky, but because they\'re invisible.',
  },
  {
    num: '04',
    title: 'No visibility into workforce',
    desc: 'Spreadsheets, WhatsApp groups, and paper logs make it impossible to track attendance, performance, or costs in real time.',
    sticky:
      'You can\'t optimize what you can\'t measure. Most employers are operating completely blind.',
  },
  {
    num: '05',
    title: 'Scaling is unpredictable',
    desc: 'Seasonal demand spikes hit without warning. Finding 50 verified workers in 24 hours is impossible with traditional methods.',
    sticky:
      'Growth shouldn\'t be gated by how many phone numbers your HR team has saved.',
  },
];

export default function Challenges() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyTextRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      // Heading SplitText
      const headingEl = section.querySelector('.challenges-heading');
      if (headingEl && !prefersReduced) {
        const split = new SplitText(headingEl, { type: 'lines' });
        gsap.set(split.lines, { y: 40, opacity: 0 });
        gsap.to(split.lines, {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
          },
        });
      }

      // Challenge items
      const items = gsap.utils.toArray<HTMLElement>('.challenge-item');

      items.forEach((item, i) => {
        const numEl = item.querySelector('.challenge-num');
        const titleEl = item.querySelector('.challenge-title');
        const descEl = item.querySelector('.challenge-desc');
        const ruleEl = item.querySelector('.challenge-rule');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        });

        if (prefersReduced) {
          tl.set([numEl, titleEl, descEl, ruleEl].filter(Boolean), {
            opacity: 1,
          });
          return;
        }

        // Border draws in
        if (ruleEl) {
          tl.fromTo(
            ruleEl,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.8, ease: 'power3.out' }
          );
        }

        // Number counter
        if (numEl) {
          const target = parseInt(CHALLENGES[i]!.num);
          const proxy = { val: 0 };
          tl.to(
            proxy,
            {
              val: target,
              duration: 0.6,
              snap: { val: 1 },
              ease: 'power2.out',
              onUpdate() {
                numEl.textContent = String(proxy.val).padStart(2, '0');
              },
            },
            '<'
          );
        }

        // Title slides in
        if (titleEl) {
          tl.fromTo(
            titleEl,
            { x: -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
            '-=0.3'
          );
        }

        // Description fades in
        if (descEl) {
          tl.fromTo(
            descEl,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
            '-=0.4'
          );
        }

        // Sticky text crossfade
        ScrollTrigger.create({
          trigger: item,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => swapStickyText(i),
          onEnterBack: () => swapStickyText(i),
        });
      });

      function swapStickyText(index: number) {
        const el = stickyTextRef.current;
        if (!el || prefersReduced) {
          if (el) el.textContent = CHALLENGES[index]!.sticky;
          return;
        }
        gsap.to(el, {
          opacity: 0,
          y: -8,
          duration: 0.25,
          ease: 'power2.in',
          onComplete() {
            el.textContent = CHALLENGES[index]!.sticky;
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power3.out',
            });
          },
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative bg-white text-black py-24 md:py-40"
    >
      <div className="section-container relative z-10">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-24">
          {/* Left — sticky column */}
          <div className="md:sticky md:top-32 md:self-start pb-8 md:pb-0 border-b border-black/[0.06] md:border-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-[#FF4D00]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#FF4D00]">
                The Problem Space
              </span>
            </div>
            <h2 className="challenges-heading text-[clamp(1.75rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight text-black mb-8 md:mb-10">
              Built for the problems{' '}
              <span className="text-black/30">you actually face</span>
            </h2>
            <p
              ref={stickyTextRef}
              className="hidden md:block text-lg text-black/40 leading-relaxed max-w-md transition-opacity"
            >
              {CHALLENGES[0]!.sticky}
            </p>
          </div>

          {/* Right — scrolling items */}
          <div>
            {CHALLENGES.map((item) => (
              <div key={item.num} className="challenge-item relative pb-8 mb-8 md:pb-12 md:mb-12 last:mb-0 last:pb-0">
                {/* Bottom rule */}
                <div className="challenge-rule absolute bottom-0 left-0 right-0 h-[1px] bg-black/[0.08] origin-left" />

                {/* Watermark number */}
                <span className="challenge-num absolute -top-2 right-0 text-[80px] md:text-[120px] font-extralight leading-none text-black/[0.04] select-none pointer-events-none">
                  {item.num}
                </span>

                <div className="relative z-10">
                  <h3 className="challenge-title text-xl md:text-[32px] font-medium text-black leading-[1.2] tracking-tight mb-3 md:mb-4">
                    {item.title}
                  </h3>
                  <p className="challenge-desc text-base text-black/50 leading-relaxed max-w-lg">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
