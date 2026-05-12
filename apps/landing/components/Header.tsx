'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Magnetic } from './';
import { useNavbarTheme } from '@/hooks/useNavbarTheme';

const NAV_LINKS = [
  { label: 'SERVICES', href: '#services', hasChevron: true },
  { label: 'INDUSTRIES', href: '#industries', hasChevron: true },
  { label: 'CASES', href: '#cases' },
  { label: 'COMPANY', href: '#company', hasChevron: true },
  { label: 'INSIGHTS', href: '#insights' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const theme = useNavbarTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navStyles = {
    light: {
      nav: 'bg-white border-b border-neutral-200 shadow-sm',
      logo: 'text-black',
      links: 'text-neutral-800 hover:text-black',
      cta: 'bg-black text-white hover:bg-neutral-800',
      hamburger: 'bg-black',
    },
    dark: {
      nav: 'bg-black border-b border-white/10 shadow-lg',
      logo: 'text-white',
      links: 'text-white/80 hover:text-white',
      cta: 'bg-white text-black hover:bg-neutral-100',
      hamburger: 'bg-white',
    }
  };

  const s = navStyles[theme];

  return (
    <>
      <header
        id="main-header"
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 h-20 ${
          isScrollingDown ? 'bg-transparent border-transparent shadow-none' : `${s.nav}`
        }`}
      >
        <div className="section-container flex items-center justify-between h-full">
          {/* Logo — minimalist asterisk + name */}
          <Link 
            href="/" 
            className={`flex items-center gap-1.5 group transition-all duration-500 ${
              isScrollingDown ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
            }`} 
            id="logo-link"
          >
            <span className="text-[#FF4D00] text-2xl font-bold transition-transform duration-500 group-hover:rotate-180">∗</span>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${s.logo}`}>forge</span>
          </Link>

          {/* Desktop nav — center */}
          <nav 
            className={`hidden lg:flex items-center gap-10 transition-all duration-500 ${
              isScrollingDown ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'
            }`} 
            id="desktop-nav"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`group relative flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${s.links}`}
              >
                {link.label}
                {link.hasChevron && (
                  <svg className="w-2.5 h-2.5 opacity-40 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#FF4D00] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA — premium button */}
          <div className="hidden lg:flex items-center">
            <Magnetic>
              <a 
                href="#contact" 
                className={`group px-8 py-3.5 rounded-[14px] text-[11px] font-bold tracking-[0.15em] uppercase flex items-center gap-4 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${s.cta} ${
                  isScrollingDown ? 'px-12 py-4 text-[13px] translate-y-2 shadow-xl' : ''
                }`}
              >
                GET IN TOUCH
                <div className="relative w-4 h-4 overflow-hidden">
                  <svg className="absolute inset-0 w-4 h-4 transition-transform duration-300 group-hover:translate-x-full group-hover:-translate-y-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <svg className="absolute inset-0 w-4 h-4 -translate-x-full translate-y-full transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </a>
            </Magnetic>
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            className={`lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ${
              isScrollingDown ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <span className={`block h-[1.5px] w-6 transition-all duration-300 origin-center ${s.hamburger} ${mobileOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
            <span className={`block h-[1.5px] w-6 transition-all duration-300 origin-center ${s.hamburger} ${mobileOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile overlay — high contrast */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-white transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] lg:hidden ${
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <nav className="flex flex-col justify-center h-full px-10">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center justify-between text-4xl md:text-6xl font-bold text-black border-b border-black/5 py-8 transition-all duration-500"
              style={{
                transitionDelay: mobileOpen ? `${i * 100}ms` : '0ms',
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-40px)',
              }}
            >
              <span className="group-hover:text-[#FF4D00] transition-colors">{link.label}</span>
              <span className="text-xl text-black/20 font-medium">0{i + 1}</span>
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="mt-12 text-2xl font-bold text-[#FF4D00] underline underline-offset-8"
            style={{
              transitionDelay: mobileOpen ? `${NAV_LINKS.length * 100}ms` : '0ms',
              opacity: mobileOpen ? 1 : 0,
            }}
          >
            GET IN TOUCH
          </a>
        </nav>
      </div>
    </>
  );
}
