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
 * Renders a dark (#0f0f0f) section with top concave arch cutouts.
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
      className={`relative bg-[#0f0f0f] ${className}`}
      style={{ 
        minHeight,
        marginTop: '-80px',
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      } as React.CSSProperties}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              transform="scale(0.001, 0.001666)"
              d="M 0,70
                 Q 0,0 70,0
                 L 330,0
                 Q 390,0 420,40
                 Q 450,80 500,80
                 Q 550,80 580,40
                 Q 610,0 670,0
                 L 930,0
                 Q 1000,0 1000,70
                 L 1000,600
                 L 0,600
                 Z"
            />
          </clipPath>
        </defs>
      </svg>
      
      <div className="pt-20">
        {children}
      </div>
    </section>
  );
};

export default ArchSection;
