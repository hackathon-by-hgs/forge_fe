'use client';

import React from 'react';

interface ArchSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
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
      className={`relative bg-black ${className}`}
      style={{ minHeight: '100vh' } as React.CSSProperties}
    >
      <div className="py-24 md:py-32">
        {children}
      </div>

      {/* BOTTOM inverted arch — bracket shape pointing down into next section */}
      <div className="absolute bottom-0 left-0 w-full h-[160px] pointer-events-none">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 160"
          preserveAspectRatio="none"
          className="block"
        >
          <path
            d="M 0,0 L 120,80 L 370,80 L 370,140
               L 630,140 L 630,80 L 880,80
               L 1000,0 L 1000,160 L 0,160 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
};

export default ArchSection;
