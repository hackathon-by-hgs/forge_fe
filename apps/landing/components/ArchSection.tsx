// components/ArchSection.tsx
'use client';

import React, { useId } from 'react';

interface ArchSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  minHeight?: string;
}

const ArchSection: React.FC<ArchSectionProps> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <section
      id={id}
      data-navbar-theme="dark"
      className={`relative ${className}`}
      style={{ minHeight: '100vh', marginTop: '-160px' } as React.CSSProperties}
    >
      {/* TOP arch — bracket shape biting into white section above */}
      <svg
        width="100%"
        height="160"
        viewBox="0 0 1000 160"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      >
        <path
          d="M 0,160 L 120,80 L 370,80 L 370,20 L 630,20
             L 630,80 L 880,80 L 1000,160 L 1000,160 L 0,160 Z"
          fill="#000000"
        />
      </svg>

      <div className="pt-40">
        {children}
      </div>

      {/* BOTTOM inverted arch — bracket shape pointing down into next section */}
      <svg
        width="100%"
        height="160"
        viewBox="0 0 1000 160"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, display: 'block' }}
      >
        <path
          d="M 0,0 L 120,80 L 370,80 L 370,140
             L 630,140 L 630,80 L 880,80
             L 1000,0 L 1000,0 L 0,0 Z"
          fill="#000000"
        />
      </svg>
    </section>
  );
};

export default ArchSection;