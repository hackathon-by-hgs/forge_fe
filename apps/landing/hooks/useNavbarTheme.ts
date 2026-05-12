'use client';

import { useState, useEffect } from 'react';

export function useNavbarTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const sections = document.querySelectorAll('[data-navbar-theme]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTheme(entry.target.getAttribute('data-navbar-theme') as 'light' | 'dark');
          }
        });
      },
      { rootMargin: '0px 0px -95% 0px', threshold: 0 }
    );
    
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return theme;
}
