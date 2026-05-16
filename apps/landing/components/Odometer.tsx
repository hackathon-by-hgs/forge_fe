'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const OdometerBase = dynamic(() => import('react-odometerjs'), {
  ssr: false,
});

interface OdometerProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function Odometer({ value, decimals = 0, className = '' }: OdometerProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        // Small delay to ensure the odometer component is fully ready
        setTimeout(() => setCurrentValue(value), 100);
      },
      // Reset when scrolling back up so it re-animates when scrolling down again
      onLeaveBack: () => setCurrentValue(0),
      // If already past the trigger point on load, show the final value
      onRefresh: (self) => {
        if (self.progress > 0) setCurrentValue(value);
      }
    });

    return () => trigger.kill();
  }, [value]);

  return (
    <span ref={containerRef} className={`inline-flex items-baseline odometer-host ${className}`}>
      <OdometerBase value={currentValue} format={decimals > 0 ? '(,ddd).dd' : '(,ddd)'} duration={1800} />
    </span>
  );
}
