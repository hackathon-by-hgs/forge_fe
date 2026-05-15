'use client';

import React from 'react';
import { useMagnetic } from '@/hooks';

interface MagneticProps {
  children: React.ReactElement;
}

/**
 * Magnetic Wrapper Component
 * Wraps an element to give it a magnetic pull effect.
 */
export default function Magnetic({ children }: MagneticProps) {
  const ref = useMagnetic();

  return React.cloneElement(children, {
    ref,
  } as React.RefAttributes<HTMLDivElement>);
}
