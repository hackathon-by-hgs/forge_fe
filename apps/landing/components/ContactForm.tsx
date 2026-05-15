'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const MICRO_STATS = [
  '< 24hr response',
  'Lagos-based team',
  'Trusted by 40+ employers',
];

export default function ContactForm() {
  const sectionRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [btnText, setBtnText] = useState('Send Message');

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      // SplitText heading
      const headingEl = section.querySelector('.contact-heading');
      if (headingEl && !prefersReduced) {
        const split = new SplitText(headingEl, { type: 'chars' });
        gsap.set(split.chars, { y: 40, opacity: 0 });
        gsap.to(split.chars, {
          y: 0,
          opacity: 1,
          stagger: 0.015,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }

      // Form fields stagger in
      const fields = gsap.utils.toArray<HTMLElement>('.contact-field');
      if (!prefersReduced) {
        gsap.set(fields, { y: 30, opacity: 0 });
        gsap.to(fields, {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section.querySelector('.contact-form'),
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }

      // CTA button scale in
      if (btnRef.current && !prefersReduced) {
        gsap.set(btnRef.current, { scaleX: 0.8, opacity: 0 });
        gsap.to(btnRef.current, {
          scaleX: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: btnRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        });
      }


      // Micro stats
      const stats = gsap.utils.toArray<HTMLElement>('.contact-stat');
      if (!prefersReduced) {
        gsap.set(stats, { y: 20, opacity: 0 });
        gsap.to(stats, {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section.querySelector('.contact-stats'),
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }
    },
    { scope: sectionRef }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    setSubmitted(true);
    setBtnText('Sending...');

    // Animate form fields to 30% opacity
    const fields = document.querySelectorAll('.contact-field');
    gsap.to(fields, { opacity: 0.3, duration: 0.4 });

    // Draw accent line
    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    setTimeout(() => {
      setBtnText('Sent ✓');
      if (btnRef.current) {
        gsap.fromTo(
          btnRef.current,
          { scale: 0.98 },
          { scale: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }, 1200);

    setTimeout(() => {
      setSubmitted(false);
      setBtnText('Send Message');
      gsap.to(fields, { opacity: 1, duration: 0.4 });
      if (lineRef.current) {
        gsap.to(lineRef.current, { scaleX: 0, duration: 0.4 });
      }
    }, 4000);
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative bg-white py-20 md:py-40 min-h-screen flex flex-col justify-center"
    >
      <div className="section-container relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — pitch */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-[#FF4D00]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#FF4D00]">
                Get in Touch
              </span>
            </div>
            <h2 className="contact-heading text-[clamp(1.75rem,5vw,5rem)] font-medium leading-[1.05] tracking-tight text-black mb-8 md:mb-12">
              Let&rsquo;s build Forge together
            </h2>
            <p className="text-lg md:text-xl text-black/40 leading-relaxed mb-10 md:mb-16 max-w-md">
              Whether you&rsquo;re an employer, a bank, or a worker — we&rsquo;d
              love to hear from you. No commitments, just a conversation.
            </p>

            {/* Micro stats */}
            <div className="contact-stats space-y-5">
              {MICRO_STATS.map((stat) => (
                <div key={stat} className="contact-stat flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-[#FF4D00]" />
                  <span className="text-sm font-bold text-black/50 uppercase tracking-widest">
                    {stat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="relative">
            {/* Accent line on submit */}
            <div
              ref={lineRef}
              className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF4D00] origin-left"
              style={{ transform: 'scaleX(0)' }}
            />

            <form onSubmit={handleSubmit} className="contact-form space-y-0">
              {[
                { id: 'contact-name', type: 'text', placeholder: 'Your name *', required: true },
                { id: 'contact-email', type: 'email', placeholder: 'Your email *', required: true },
                { id: 'contact-company', type: 'text', placeholder: 'Company name', required: false },
              ].map(({ id, type, placeholder, required }) => (
                <div key={id} className="contact-field relative group">
                  <input
                    id={id}
                    name={id}
                    type={type}
                    placeholder=" "
                    required={required}
                    autoComplete="off"
                    className="peer w-full border-b border-black/[0.08] bg-transparent pt-8 pb-4 text-xl text-black focus:border-[#FF4D00] focus:outline-none transition-colors duration-300"
                  />
                  <label
                    htmlFor={id}
                    className="absolute left-0 top-8 text-lg text-black/25 transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF4D00] peer-focus:font-bold peer-focus:tracking-widest peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black/30 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                  >
                    {placeholder}
                  </label>
                </div>
              ))}

              <div className="contact-field relative group">
                <textarea
                  id="contact-message"
                  name="contact-message"
                  placeholder=" "
                  rows={3}
                  autoComplete="off"
                  className="peer w-full resize-none border-b border-black/[0.08] bg-transparent pt-8 pb-4 text-xl text-black focus:border-[#FF4D00] focus:outline-none transition-colors duration-300"
                />
                <label
                  htmlFor="contact-message"
                  className="absolute left-0 top-8 text-lg text-black/25 transition-all duration-200 pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF4D00] peer-focus:font-bold peer-focus:tracking-widest peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black/30 peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:tracking-widest peer-[:not(:placeholder-shown)]:uppercase"
                >
                  Tell us about your workforce needs
                </label>
              </div>

              <div className="pt-12">
                <button
                  ref={btnRef}
                  type="submit"
                  id="contact-submit"
                  disabled={submitted}
                  className="relative w-full bg-black text-white py-5 text-[12px] font-bold uppercase tracking-[0.3em] overflow-hidden group disabled:cursor-wait"
                >
                  {/* Hover fill */}
                  <span className="absolute inset-0 bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                  <span className="relative z-10 group-hover:text-black transition-colors duration-300">
                    {btnText}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
