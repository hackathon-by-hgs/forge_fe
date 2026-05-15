'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isClickable, setIsClickable] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isButton = target.closest('button, a, .btn-primary, .btn-secondary');
      setIsClickable(!!isButton);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-forge-accent pointer-events-none z-[10000] transition-transform duration-300 mix-blend-difference ${
        isClickable ? 'scale-[2.5] bg-forge-accent border-transparent' : 'scale-100'
      }`}
    />
  );
}
