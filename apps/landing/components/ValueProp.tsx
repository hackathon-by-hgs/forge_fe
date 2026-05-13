'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// const PILLARS = [
//   {
//     tag: '01',
//     title: 'Verified Workforce',
//     description: 'Access a pool of pre-vetted, high-performance labor with historical reliability data.',
//     color: '#FF4D00'
//   },
//   {
//     tag: '02',
//     title: 'Automated Payroll',
//     description: 'Seamless digital payments and attendance tracking tailored for Nigerian business operations.',
//     color: '#000000'
//   },
//   {
//     tag: '03',
//     title: 'Predictive Credit',
//     description: 'Transform work history into financial power with our performance-based credit scoring.',
//     color: '#FF4D00'
//   }
// ];

export default function ValueProp() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyContentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Horizontal Slide Entrance
      // We animate the xPercent of the sticky content from -100 to 0
      gsap.fromTo(stickyContentRef.current, 
        { xPercent: 100 },
        {
          xPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: true,
          }
        }
      );

      // 2. Internal content reveal
      const cards = gsap.utils.toArray<HTMLElement>('.value-card');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top+=50% top',
          end: 'bottom bottom',
          scrub: true,
        }
      });

      tl.from('.value-title', {
        y: 40,
        opacity: 0,
        duration: 1,
      });

      tl.from(cards, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
      }, '-=0.5');

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative h-[250vh]" // Added height to provide scroll room for the slide
    >
      {/* Sticky Container */}
      <div 
        ref={stickyContentRef}
        className="sticky top-0 h-screen w-full bg-[#f9f9f98b] overflow-hidden shadow-[30px_0_100px_rgba(0,0,0,0.1)] border-r border-black/5"
      >
        {/* Subtle background text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden w-full whitespace-nowrap opacity-[0.2] text-center mt-20">
          <span className="text-[18vw] font-black uppercase tracking-tighter text-black">ECOSYSTEM</span>
        </div>

        <div className="section-container relative z-10 h-fit py-24">
          <div className="mb-24 max-w-4xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#FF4D00] mb-8 block">THE FORGE EDGE</span>
            <h2 className="value-title text-[clamp(2rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-black">
              The infrastructure for <br />
              <span className="text-black/30">growth and inclusion.</span>
            </h2>
          </div>

          {/* <div ref={cardsRef} className="grid gap-8 md:grid-cols-3 md:gap-12">
            {PILLARS.map((pillar) => (
              <div 
                key={pillar.tag} 
                className="value-card group flex flex-col justify-between h-[400px] bg-white p-10 rounded-[2.5rem] border border-black/[0.03] transition-all duration-700 hover:border-[#FF4D00]/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]"
              >
                <div>
                  <span className="text-4xl font-black text-black/5 group-hover:text-[#FF4D00]/10 transition-colors duration-500 mb-8 block">
                    {pillar.tag}
                  </span>
                  <h3 className="text-2xl font-bold mb-6 tracking-tight text-black">
                    {pillar.title}
                  </h3>
                  <p className="text-black/40 leading-relaxed font-light">
                    {pillar.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 group/btn cursor-pointer">
                  <div className="h-12 w-12 rounded-full border border-black/5 flex items-center justify-center transition-all duration-500 group-hover:bg-black group-hover:border-black">
                     <svg className="h-4 w-4 text-black transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/20 group-hover:text-black transition-colors">EXPLORE SOLUTIONS</span>
                </div>
              </div>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  );
}
