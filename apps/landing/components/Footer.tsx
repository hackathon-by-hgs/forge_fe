'use client';

import Link from 'next/link';

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
    <footer id="footer" className="bg-black">
      <div className="section-container">
        <div className="divider" />

        <div className="py-16 md:py-20">
          {/* Top — big CTA text, Phenomenon style */}
          <div className="mb-16 md:mb-24">
            <h3 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mb-8">
              Ready to forge{' '}
              <span className="text-forge-accent">your workforce?</span>
            </h3>
            <a href="#contact" className="btn-primary">
              Let&apos;s Talk
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          <div className="divider mb-12" />

          {/* Navigation grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
            {/* Logo column */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
                  <rect width="32" height="32" rx="6" fill="#FF4D00" />
                  <path d="M8 11h16M8 16h10M8 21h14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="text-lg font-bold tracking-tight text-white">Forge</span>
              </Link>
              <p className="text-[13px] text-white/25 leading-relaxed max-w-[200px]">
                Powering Nigeria&apos;s informal economy.
              </p>
            </div>

            {/* Nav columns */}
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/35 hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="divider mb-8" />

          {/* Bottom — legal + socials */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 text-[12px] text-white/15">
              <span>© {new Date().getFullYear()} Forge</span>
              <a href="/terms" className="hover:text-white/30 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white/30 transition-colors">Privacy</a>
            </div>

            <div className="flex items-center gap-6">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  className="text-[12px] text-white/20 hover:text-white transition-colors duration-200 tracking-wider uppercase"
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
