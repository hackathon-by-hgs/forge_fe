'use client';

import Link from 'next/link';
import { Magnetic } from './';

const FOOTER_NAV = [
  {
    title: 'Platform',
    links: [
      { label: 'For Employers', href: '#services' },
      { label: 'For Banks', href: '#services' },
      { label: 'For Workers', href: '#services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Cases', href: '#cases' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Help Center', href: '#' },
    ],
  },
];

const SOCIALS = [
  { name: 'LinkedIn', href: '#' },
  { name: 'Twitter', href: '#' },
  { name: 'Instagram', href: '#' },
];

export default function Footer() {
  return (
    <footer id="footer" data-navbar-theme="dark" className="relative bg-[#0a0a0a] pt-24 pb-12">
      <div className="section-container relative z-10">
        <div className="py-16 md:py-20">
          {/* Top — big CTA text */}
          <div className="mb-20 md:mb-32">
            <h3 className="text-4xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-white max-w-5xl mb-12 leading-[1]">
              Ready to <br />
              <span className="text-white/20">forge your workforce?</span>
            </h3>
            <Magnetic>
              <a href="#contact" className="group inline-flex items-center gap-4 rounded-xl bg-white px-10 py-5 text-[12px] font-bold uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl">
                LET&apos;S TALK
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </Magnetic>
          </div>

          <div className="h-px w-full bg-white/5 mb-20" />

          {/* Navigation grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 mb-24">
            {/* Logo column */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-8">
                <span className="text-[#FF4D00] text-3xl font-bold transition-transform duration-500 hover:rotate-180 cursor-pointer">∗</span>
                <span className="text-xl font-bold tracking-tight text-white uppercase tracking-[0.2em]">Forge</span>
              </Link>
              <p className="text-[14px] text-white/20 leading-relaxed max-w-[240px] font-medium">
                The foundational layer for Nigeria&apos;s informal labor economy.
              </p>
            </div>

            {/* Nav columns */}
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10 mb-8">
                  {col.title}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[15px] font-medium text-white/30 hover:text-[#FF4D00] transition-colors duration-300"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-white/5 mb-12" />

          {/* Bottom — legal + socials */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex flex-wrap items-center gap-8 text-[11px] font-bold tracking-widest text-white/10 uppercase">
              <span>© {new Date().getFullYear()} FORGE TECHNOLOGIES</span>
              <a href="/terms" className="hover:text-white/30 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>
            </div>

            <div className="flex items-center gap-8">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  className="text-[11px] font-bold tracking-widest text-white/20 hover:text-white transition-all duration-300 uppercase"
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
