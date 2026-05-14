// components/ArchLock.tsx
'use client';

interface ArchLockProps {
  /** Match this to your ArchSection's background color */
  fillColor?: string;
  className?: string;
}

/**
 * ArchLock Component
 * Sits at the bottom of a light/white section.
 * Its shape interlocks with ArchSection's top bracket.
 *
 * Profile (top edge, left → right):
 *   diagonal down-inward → flat → step down (notch) → flat → step up → flat → diagonal up-outward
 */
export default function ArchLock({
  fillColor = '#000000',
  className = '',
}: ArchLockProps) {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ height: '160px', marginBottom: '-1px' }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 160"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M 0,0
            L 120,80
            L 370,80
            L 370,140
            L 630,140
            L 630,80
            L 880,80
            L 1000,0
            L 1000,160
            L 0,160
            Z
          "
          fill={fillColor}
        />
      </svg>
    </div>
  );
}