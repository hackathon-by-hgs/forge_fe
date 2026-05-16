'use client';

import React from 'react';

interface ArchSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  archColor?: string;
  showTopArch?: boolean;
  showBottomArch?: boolean;
}

const ArchSection: React.FC<ArchSectionProps> = ({
  children,
  className = '',
  id,
  archColor = '#ffffff',
  showTopArch = true,
  showBottomArch = true,
}) => {
  return (
    <section
      id={id}
      data-navbar-theme="dark"
      className={`relative bg-black ${className}`}
    >
      {/* TOP arch — bracket shape biting into section above */}
      {showTopArch && (
        <div className="absolute top-0 left-0 w-full h-[160px] -translate-y-[159px] pointer-events-none z-[10]">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 160"
            preserveAspectRatio="none"
            className="block"
          >
            <path
              d="M 0,160 L 120,80 L 370,80 L 370,20 L 630,20
                 L 630,80 L 880,80 L 1000,160 L 1000,160 L 0,160 Z"
              fill="#000000"
            />
          </svg>
        </div>
      )}

      {children}

      {/* BOTTOM inverted arch — bracket shape biting into section below */}
      {showBottomArch && (
        <div className="absolute bottom-0 left-0 w-full h-[160px] translate-y-[1px] pointer-events-none z-[10]">
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
              fill={archColor}
            />
          </svg>
        </div>
      )}
    </section>
  );
};

export default ArchSection;
