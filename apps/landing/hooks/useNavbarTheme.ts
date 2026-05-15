'use client';

import { useState, useEffect } from 'react';

export function useNavbarTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-navbar-theme]');
      let currentTheme: 'light' | 'dark' = 'dark';

      // The active section is the last one in DOM order that has reached or passed the top of viewport
      // In a sticky/sliding model, multiple sections might be at top: 0, 
      // but the one appearing "on top" is the one furthest in the DOM.
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        // Check if the section's top has reached the top of the viewport (with a small offset for the navbar)
        if (rect.top <= 80) {
          currentTheme = section.getAttribute('data-navbar-theme') as 'light' | 'dark';
        }
      });

      setTheme(currentTheme);
    };

    let rafId: number;
    const throttledScroll = () => {
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return theme;
}
