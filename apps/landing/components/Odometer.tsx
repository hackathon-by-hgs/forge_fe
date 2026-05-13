'use client';

import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface OdometerProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function Odometer({ value, decimals = 0, className = '' }: OdometerProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    gsap.to(valueRef.current, {
      val: value,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(valueRef.current.val.toFixed(decimals));
      },
    });
  }, [value, decimals]);

  return (
    <span className={`inline-flex items-baseline overflow-hidden ${className}`}>
      {displayValue.split('').map((char, i) => {
        if (isNaN(parseInt(char))) {
          return <span key={i}>{char}</span>;
        }
        return (
          <div key={i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden leading-none">
            <div
              className="absolute left-0 w-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateY(-${parseInt(char) * 10}%)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div key={n} className="flex h-[1em] items-center justify-center">
                  {n}
                </div>
              ))}
            </div>
            {/* Invisible placeholder to maintain width/height */}
            <span className="invisible">{char}</span>
          </div>
        );
      })}
    </span>
  );
}
