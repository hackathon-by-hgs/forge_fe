// components/BottomArch.tsx
'use client';

export default function BottomArch({ color = '#000000' }: { color?: string }) {
  return (
    <svg
      width="100%"
      height="160"
      viewBox="0 0 1000 160"
      preserveAspectRatio="none"
      style={{ display: 'block', marginBottom: '-1px' }}
    >
      <path
        d="M 0,0 L 120,80 L 370,80 L 370,140
           L 630,140 L 630,80 L 880,80
           L 1000,0 L 1000,0 L 0,0 Z"
        fill={color}
      />
    </svg>
  );
}