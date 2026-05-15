'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Logo, ScrollVelocity } from './';

gsap.registerPlugin(ScrollTrigger);

const FOOTER_NAV = [
  {
    title: 'Product',
    links: [
      { label: 'For Employers', href: 'https://employer.forge.app/login' },
      { label: 'For Banks', href: 'https://bank.forge.app/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Case Studies', href: '#cases' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  // {
  //   title: 'Legal',
  //   links: [
  //     { label: 'Terms of Service', href: '#' },
  //     { label: 'Privacy Policy', href: '#' },
  //   ],
  // },
];

const SOCIALS = [
  {
    name: 'LinkedIn',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const bgWordRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const footer = footerRef.current;
      if (!footer) return;

      // const prefersReduced = window.matchMedia(
      //   '(prefers-reduced-motion: reduce)'
      // ).matches;

      // Nav columns stagger
      const cols = gsap.utils.toArray<HTMLElement>('.footer-col');
      gsap.set(cols, { y: 40, opacity: 0 });
      gsap.to(cols, {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footer.querySelector('.footer-nav'),
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      // Bottom rule draw
      const rule = footer.querySelector('.footer-rule');
      if (rule) {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: rule,
              start: 'top 95%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // Social icons — GSAP hover lift
      const socialIcons = gsap.utils.toArray<HTMLElement>('.footer-social');
      socialIcons.forEach((icon) => {
        icon.addEventListener('mouseenter', () => {
          gsap.to(icon, {
            y: -4,
            duration: 0.15,
            ease: 'power2.out',
            overwrite: true,
          });
        });
        icon.addEventListener('mouseleave', () => {
          gsap.to(icon, {
            y: 0,
            duration: 0.15,
            ease: 'power2.out',
            overwrite: true,
          });
        });
      });
    },
    { scope: footerRef }
  );

  return (
    <footer
      ref={footerRef}
      id="footer"
      data-navbar-theme="dark"
      className="relative bg-black pt-24 pb-8 overflow-hidden min-h-[60vh] flex flex-col justify-end"
    >
      <div 
        ref={bgWordRef}
        className="pointer-events-none absolute inset-0 flex flex-col justify-center opacity-20"
      >
        <ScrollVelocity
          texts={['FORGE', 'B2B WORKFORCE']}
          velocity={25}
          className="text-[18vw] font-black uppercase tracking-tighter text-white/25"
        />
      </div>

      <div className="section-container relative z-10 w-full mt-auto max-md:px-5">
        {/* Logo and Nav Row */}
        <div className="mb-16 md:mb-20">
          <Logo theme="dark" />
        </div>

        {/* Row 2 — nav columns + newsletter */}
        <div className="footer-nav grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-8 mb-16 md:mb-20">
          {FOOTER_NAV.map((col) => (
            <div key={col.title} className="footer-col">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-8">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-[15px] font-medium text-white/80 hover:text-[#FF4D00] transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter column */}
          <div className="footer-col col-span-2 md:col-span-1 pt-4 md:pt-0 border-t border-white/[0.04] md:border-0">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mb-8">
              Newsletter
            </h4>
            <p className="text-sm text-white mb-6 leading-relaxed">
              Get updates on the future of work in Africa.
            </p>
            <form
              className="flex border-b border-white/20 focus-within:border-[#FF4D00] transition-colors duration-500"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="text-white hover:text-[#FF4D00] transition-all duration-300 px-2 hover:scale-110 active:scale-90"
                aria-label="Subscribe"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Rule */}
        <div className="footer-rule h-[1px] w-full bg-white/[0.1] mb-8 origin-left" />

        {/* Row 3 — bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase">© {new Date().getFullYear()} Forge Technologies</span>
            <span className="text-white/5 hidden sm:inline">·</span>
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-white/1  uppercase">Built in Lagos 🇳🇬</span>
          </div>

          <div className="flex items-center gap-6">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target='_blank'
                className="footer-social text-white hover:text-[#FF4D00] transition-colors duration-300"
                aria-label={s.name}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
