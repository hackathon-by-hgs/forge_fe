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
  minHeight = 'auto',
}) => {
  const clipId = useId().replace(/:/g, ''); // Ensure valid CSS ID

  return (
    <section
      id={id}
      data-navbar-theme="dark"
      className={`relative z-[var(--z-index,2)] -mt-[56px] bg-[#0f0f0f] ${className}`}
      style={{ 
        minHeight,
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      } as React.CSSProperties}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              d="M 0.04,0 
                 Q 0,0 0,0.05 
                 L 0,1 
                 L 1,1 
                 L 1,0.05 
                 Q 1,0 0.96,0 
                 L 0.85,0 
                 Q 0.82,0 0.78,0.05 
                 Q 0.74,0.1 0.7,0.05 
                 Q 0.66,0 0.62,0 
                 L 0.38,0 
                 Q 0.34,0 0.3,0.05 
                 Q 0.26,0.1 0.22,0.05 
                 Q 0.18,0 0.15,0 
                 L 0.04,0 Z"
            />
          </clipPath>
        </defs>
      </svg>
      
      <div className="pt-[56px]">
        {children}
      </div>
    </section>
  );
};

export default ArchSection;
