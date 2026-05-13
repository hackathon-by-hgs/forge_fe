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
}) => {
  const clipId = useId().replace(/:/g, '');

  return (
    <section
      id={id}
      data-navbar-theme="dark"
      className={`relative ${className}`}
      style={{
        minHeight: '100vh',
        marginTop: '-160px',
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      } as React.CSSProperties}
    >
      <svg
        width="100%"
        height="160"
        viewBox="0 0 1000 160"
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M 0,160
            L 120,80
            L 370,80
            L 370,20
            L 630,20
            L 630,80
            L 880,80
            L 1000,160
            L 1000,160
            L 0,160
            Z
          "
          fill="#000000"
        />
      </svg>


      <div className="pt-40">
        {children}
      </div>
    </section>
  );
};

export default ArchSection;
