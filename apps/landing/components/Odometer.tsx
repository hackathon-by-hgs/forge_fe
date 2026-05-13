'use client';

import dynamic from 'next/dynamic';

const OdometerBase = dynamic(() => import('react-odometerjs'), {
  ssr: false,
});

interface OdometerProps {
  value: number;
  decimals?: number;
  className?: string;
}

export default function Odometer({ value, decimals = 0, className = '' }: OdometerProps) {
  return (
    <span className={`inline-flex items-baseline odometer-host ${className}`}>
      <OdometerBase value={value} format={decimals > 0 ? '(,ddd).dd' : '(,ddd)'} duration={1800} />
    </span>
  );
}
