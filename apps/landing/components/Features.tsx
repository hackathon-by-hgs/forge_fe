'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    num: '01',
    title: 'Workforce Hiring',
    desc: 'Post jobs and get matched with verified, pre-scored workers in your area within hours. GPS-verified attendance and reliability ratings ensure quality.',
    tags: ['Job Matching', 'GPS Tracking', 'Skill Scoring'],
  },
  {
    num: '02',
    title: 'Automated Payroll',
    desc: 'Digital payments processed automatically upon job completion — no cash envelopes, no disputes. Real-time transaction tracking and automated invoicing.',
    tags: ['Digital Payments', 'Invoicing', 'Audit Trail'],
  },
  {
    num: '03',
    title: 'Credit Intelligence',
    desc: 'Every completed job and on-time payment builds a behavioral credit score. Workers earn microloans, and banks get real data for smarter lending.',
    tags: ['Credit Scoring', 'Risk Analysis', 'Microloans'],
  },
  {
    num: '04',
    title: 'Bank Integration',
    desc: 'Real-time portfolio monitoring with risk scoring, watchlists, and automated alerts. KYC/AML integration and full compliance reporting.',
    tags: ['Risk Radar', 'Compliance', 'Loan Management'],
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll('.feature-card-wrapper');

    const ctx = gsap.context(() => {
      gsap.from('.features-heading', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });

      gsap.from(cards, {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: section, start: 'top 60%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-24 md:py-40"
    >
      <div className="section-container relative z-10">
        {/* Heading */}
        <div className="features-heading mb-16 md:mb-24">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] mb-6 block">Our Capabilities</span>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.1] tracking-tight max-w-4xl text-white">
            Redefining the <br />
            <span className="text-white/30">informal economy.</span>
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {SERVICES.map((service) => (
            <div key={service.num} className="feature-card-wrapper">
              <div className="group h-full bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:bg-white/[0.06] hover:border-white/10">
                <div className="p-10 md:p-14 w-full h-full flex flex-col items-start text-left">
                  <span className="text-[#FF4D00] font-bold mb-8 text-sm tracking-widest">{service.num}</span>
                  <h3 className="text-3xl md:text-4xl font-medium text-white mb-6 group-hover:translate-x-2 transition-transform duration-500">
                    {service.title}
                  </h3>
                  <p className="text-white/40 text-lg leading-relaxed mb-10 max-w-sm">
                    {service.desc}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/10 text-white/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
