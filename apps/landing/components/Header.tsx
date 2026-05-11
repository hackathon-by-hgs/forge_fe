'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Magnetic } from './';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Cases', href: '#cases' },
  { label: 'Industries', href: '#industries' },
  { label: 'Contact', href: '#contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        id="main-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'header-glass' : 'bg-transparent'
        }`}
      >
        <div className="section-container flex items-center justify-between h-20 md:h-24">
          {/* Logo — left */}
          <Link href="/" className="flex items-center gap-2.5" id="logo-link">
            <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
              <rect width="32" height="32" rx="6" fill="#FF4D00" />
              <path d="M8 11h16M8 16h10M8 21h14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-bold tracking-tight">Forge</span>
          </Link>

          {/* Desktop nav — center/right */}
          <nav className="hidden lg:flex items-center gap-10" id="desktop-nav">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-white/50 tracking-wide uppercase transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA — right */}
          <div className="hidden lg:flex items-center">
            <Magnetic>
              <a href="#contact" className="btn-primary !py-3 !px-6 !text-[13px]">
                Let&apos;s Talk
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </Magnetic>
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`block h-[1.5px] w-6 bg-white transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
            <span className={`block h-[1.5px] w-6 bg-white transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-black transition-all duration-500 lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col justify-center h-full px-8">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-4xl md:text-5xl font-bold text-white border-b border-white/[0.08] py-6 transition-all duration-300"
              style={{
                transitionDelay: mobileOpen ? `${i * 60}ms` : '0ms',
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateY(0)' : 'translateY(30px)',
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="btn-primary mt-10 w-fit"
            style={{
              transitionDelay: mobileOpen ? `${NAV_LINKS.length * 60}ms` : '0ms',
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            Let&apos;s Talk
          </a>
        </nav>
      </div>
    </>
  );
}
