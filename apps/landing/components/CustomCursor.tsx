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

    const dot = document.getElementById('cursor-dot');
    const dotXTo = dot ? gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' }) : null;
    const dotYTo = dot ? gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' }) : null;

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (dotXTo && dotYTo) {
        dotXTo(e.clientX);
        dotYTo(e.clientY);
      }
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
    <>
      {/* Outer Ring */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-[#FF4D00] pointer-events-none z-[10000] mix-blend-difference transition-transform duration-500 ease-out"
        style={{ transform: isClickable ? 'scale(2.5)' : 'scale(1)' }}
      />
      {/* Inner Dot */}
      <div
        id="cursor-dot"
        className="fixed top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#FF4D00] rounded-full pointer-events-none z-[10001] transition-transform duration-300"
        style={{ transform: isClickable ? 'scale(0)' : 'scale(1)' }}
      />
    </>
  );
}
