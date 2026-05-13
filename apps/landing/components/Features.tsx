'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    num: '01',
    title: 'Workforce Hiring',
    desc: 'Post jobs and get matched with verified, pre-scored workers in your area within hours. GPS-verified attendance ensures quality.',
    tags: ['Job Matching', 'GPS Tracking', 'Skill Scoring'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    span: 'md:col-span-8',
    color: '#FF4D00'
  },
  {
    num: '02',
    title: 'Payroll',
    desc: 'Digital payments processed automatically upon job completion.',
    tags: ['Automated', 'Audit Trail'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    span: 'md:col-span-4',
    color: '#ffffff'
  },
  {
    num: '03',
    title: 'Credit Intelligence',
    desc: 'Every completed job builds a behavioral credit score. Workers earn microloans, and banks get real data for smarter lending.',
    tags: ['Scoring', 'Microloans'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    span: 'md:col-span-5',
    color: '#ffffff'
  },
  {
    num: '04',
    title: 'Bank Integration',
    desc: 'Real-time portfolio monitoring with risk scoring, watchlists, and automated alerts. KYC/AML integration and full compliance reporting.',
    tags: ['Risk Radar', 'Compliance'],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    span: 'md:col-span-7',
    color: '#FF4D00'
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.features-heading', {
        y: 40,
        // opacity: 0,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: { 
          trigger: section, 
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
      });

      gsap.from('.feature-card', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { 
          trigger: section, 
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
      });
    }, section);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePos({ x: clientX, y: clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section ref={sectionRef} id="services" className="relative py-24 md:py-40 bg-black overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF4D00] opacity-[0.05] blur-[120px] pointer-events-none" />
      
      <div className="section-container relative z-10">
        {/* Heading */}
        <div className="features-heading mb-20 md:mb-32">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-[#FF4D00]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#FF4D00]">CAPABILITIES</span>
          </div>
          <h2 className="text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-tighter text-white">
            Redefining the <br />
            <span className="text-white/30">informal economy.</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {SERVICES.map((service, i) => (
            <FeatureCard 
              key={service.num} 
              service={service} 
              mousePos={mousePos}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ service, mousePos, index }: { 
  service: typeof SERVICES[0], 
  mousePos: { x: number, y: number },
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate spotlight position relative to card
  const getSpotlightStyle = () => {
    if (!cardRef.current || !isHovered) return { opacity: 0 };
    const rect = cardRef.current.getBoundingClientRect();
    const x = mousePos.x - rect.left;
    const y = mousePos.y - rect.top;
    return {
      opacity: 1,
      background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(255, 77, 0, 0.1), transparent 40%)`,
    };
  };

  return (
    <div 
      ref={cardRef}
      className={`feature-card group relative overflow-hidden border border-white/10 bg-[#0A0A0A] p-10 md:p-14 transition-all duration-700 hover:border-white/30 ${service.span}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Spotlight */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500" 
        style={getSpotlightStyle()} 
      />

      {/* Background Number */}
      <span className="absolute -bottom-10 -right-6 text-[15rem] font-black leading-none text-white/[0.03] select-none pointer-events-none group-hover:text-[#FF4D00]/[0.05] transition-colors duration-700">
        {service.num}
      </span>

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-start justify-between mb-12">
          <div className={`p-4 bg-white/[0.05] border border-white/10 text-white transition-all duration-500 group-hover:scale-110 group-hover:bg-[#511d073d] group-hover:border-[#FF4D00] shadow-2xl`}>
            {service.icon}
          </div>
          <span className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase">Module {service.num}</span>
        </div>

        <h3 className="text-3xl md:text-5xl font-medium text-white mb-6 tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-500">
          {service.title}
        </h3>
        
        <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-md font-light">
          {service.desc}
        </p>

        <div className="mt-auto flex flex-wrap gap-3">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 bg-white/[0.05] border border-white/10 text-white/50 group-hover:text-white/70 group-hover:border-white/20 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
