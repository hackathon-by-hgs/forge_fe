'use client';

/**
 * Animated Noise Overlay
 * Adds a subtle grain texture to the page to create a tactile, premium feel
 */
export default function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.035] mix-blend-overlay"
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
      <style jsx>{`
        div {
          animation: noise 0.2s infinite steps(2);
        }
        @keyframes noise {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-2%, 0); }
          40% { transform: translate(2%, 2%); }
          50% { transform: translate(-1%, 1%); }
          60% { transform: translate(1%, -2%); }
          70% { transform: translate(0, 2%); }
          80% { transform: translate(-2%, 1%); }
          90% { transform: translate(2%, -1%); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
