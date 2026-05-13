'use client';

import React, { useId } from 'react';

interface ArchSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  minHeight?: string;
}

/**
 * ArchSection Component
 * Renders a black (#000000) section with top concave arch cutouts.
 * Uses a unique SVG clipPath for the "swallow" effect.
 */
const ArchSection: React.FC<ArchSectionProps> = ({
  children,
  className = '',
  id,
  minHeight = '100vh',
}) => {
  const clipId = useId().replace(/:/g, '');

  return (
    <section
      id={id}
      data-navbar-theme="dark"
      className={`relative ${className}`}
      style={{ 
        minHeight,
        marginTop: '-80px',
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      } as React.CSSProperties}
    >
      <svg
        width="100%"
        height="130"
        viewBox="0 0 1000 130"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
        }}
      >
        <path
          d="
            M 0,0
            L 340,0
            C 380,0 400,0 430,38
            L 500,130
            L 570,38
            C 600,0 620,0 660,0
            L 1000,0
            L 1000,130
            L 0,130
            Z
          "
          fill="#000000"
        />
      </svg>
      
      <div className="pt-20">
        {children}
      </div>
    </section>
  );
};

export default ArchSection;
