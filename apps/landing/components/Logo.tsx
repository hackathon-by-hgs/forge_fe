'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface LogoProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', theme = 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const color = isDark ? '#ffffff' : '#000000';
  const accentColor = '#FF4D00';

  useGSAP(() => {
    const bars = gsap.utils.toArray<SVGRectElement>(containerRef.current?.querySelectorAll('rect') || []);
    const [b0, b1, b2] = bars;
    if (!b0 || !b1 || !b2) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    
    // Forging strike animation
    tl.fromTo(b0, 
      { scaleY: 0, transformOrigin: 'bottom' }, 
      { scaleY: 1, duration: 0.8, ease: 'power4.out' }
    )
    .fromTo(b1, 
      { scaleX: 0, transformOrigin: 'left' }, 
      { scaleX: 1, duration: 0.6, ease: 'back.out(1.7)' }, 
      '-=0.4'
    )
    .fromTo(b2, 
      { scaleX: 0, transformOrigin: 'left' }, 
      { scaleX: 1, duration: 0.5, ease: 'back.out(1.7)' }, 
      '-=0.3'
    )
    .to(bars, { 
      filter: 'brightness(1.5)', 
      duration: 0.1, 
      stagger: 0.05, 
      repeat: 1, 
      yoyo: true 
    }, '-=0.2');

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={`flex items-center gap-2 group cursor-pointer ${className}`}>
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Vertical Bar */}
          <rect x="6" y="6" width="4" height="20" fill={color} />
          {/* Top Horizontal Bar */}
          <rect x="10" y="6" width="16" height="4" fill={accentColor} />
          {/* Middle Horizontal Bar */}
          <rect x="10" y="14" width="10" height="4" fill={color} />
          
          {/* Accent Dot */}
          <circle cx="22" cy="22" r="2" fill={accentColor} className="logo-dot" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          forge
        </span>
      </div>
    </div>
  );
};

export default Logo;
