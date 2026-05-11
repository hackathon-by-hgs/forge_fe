'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    num: '01',
    title: 'Workforce Hiring',
    desc: 'Post jobs and get matched with verified, pre-scored workers in your area within hours. GPS-verified attendance, skill-based matching, and reliability ratings ensure you hire with confidence every time.',
    tags: ['Job Matching', 'GPS Tracking', 'Skill Scoring'],
  },
  {
    num: '02',
    title: 'Automated Payroll',
    desc: 'Digital payments processed automatically upon job completion — no cash envelopes, no disputes. Real-time transaction tracking, automated invoicing, and complete audit trails for every payment.',
    tags: ['Digital Payments', 'Invoicing', 'Audit Trail'],
  },
  {
    num: '03',
    title: 'Credit Intelligence',
    desc: 'Every completed job and on-time payment builds a behavioral credit score. Workers earn their way to microloans, and banks get real data for smarter lending decisions.',
    tags: ['Credit Scoring', 'Risk Analysis', 'Microloans'],
  },
  {
    num: '04',
    title: 'Bank Integration',
    desc: 'Real-time portfolio monitoring with risk scoring, watchlists, and automated alerts. KYC/AML integration, full compliance reporting, and end-to-end loan lifecycle management.',
    tags: ['Risk Radar', 'Compliance', 'Loan Management'],
  },
  {
    num: '05',
    title: 'Team Management',
    desc: 'Build your saved team of reliable workers. Rate, review, and rehire your best performers. Multi-location workforce visibility and shift management across all your sites.',
    tags: ['Worker Profiles', 'Ratings', 'Multi-site'],
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const items = section.querySelectorAll('.service-item');

    const ctx = gsap.context(() => {
      // Fade in heading
      gsap.from(section.querySelector('.services-heading'), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });

      // Stagger service items
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 60%' },
      });

      // Progress line animation
      if (lineRef.current) {
        gsap.fromTo(lineRef.current, 
          { scaleY: 0 },
          { 
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.services-list',
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: true,
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative bg-black py-24 md:py-40"
    >
      <div className="section-container">
        {/* Section heading — left-aligned, Phenomenon style */}
        <div className="services-heading grid md:grid-cols-2 gap-8 md:gap-20 mb-16 md:mb-24">
          <div>
            <span className="eyebrow mb-6 block">Our Services</span>
            <h2 className="text-display">
              What we{' '}
              <span className="text-forge-accent">deliver</span>
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-body-lg text-white/35 max-w-md">
              A complete ecosystem of tools designed for every participant
              in the informal economy — employers, workers, and financial institutions.
            </p>
          </div>
        </div>

        {/* Services list with progress line */}
        <div className="services-list relative">
          {/* Vertical Progress Line */}
          <div className="absolute left-0 md:left-[35px] top-0 w-[2px] h-full bg-white/5 origin-top hidden md:block">
            <div 
              ref={lineRef}
              className="absolute top-0 left-0 w-full h-full bg-forge-accent origin-top" 
            />
          </div>

          <div className="divider" />
          {SERVICES.map((service, _i) => (
            <div
              key={service.num}
              className="service-item group"
            >
              <div className="grid md:grid-cols-[80px_1fr_1fr] gap-6 md:gap-12 py-10 md:py-14 transition-colors duration-500 hover:bg-white/[0.015] px-2 md:px-4 -mx-2 md:-mx-4">
                {/* Number */}
                <span className="text-sm font-medium text-white/20 pt-1 relative z-10">
                  {service.num}
                </span>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white transition-colors duration-500 group-hover:text-forge-accent">
                  {service.title}
                </h3>

                {/* Description + tags */}
                <div>
                  <p className="text-[15px] text-white/35 leading-relaxed mb-5">
                    {service.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/[0.1] text-white/30 group-hover:border-forge-accent/20 group-hover:text-white/50 transition-colors duration-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divider" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
