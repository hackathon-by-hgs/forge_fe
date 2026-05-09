import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent';
  label?: string;
}

export interface MapPlaceholderProps {
  pins: readonly MapPin[];
  /**
   * Approximate Lagos bounding box used to map (lat, lng) → SVG coords.
   * Defaults to a tight box around the Lagos metro.
   */
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  className?: string;
  hint?: ReactNode;
}

const DEFAULT_BOUNDS = {
  minLat: 6.40,
  maxLat: 6.62,
  minLng: 3.27,
  maxLng: 3.62,
};

const TONE: Record<NonNullable<MapPin['tone']>, string> = {
  success: 'fill-success-500 stroke-white',
  warning: 'fill-warning-500 stroke-white',
  danger: 'fill-danger-500 stroke-white',
  info: 'fill-info-500 stroke-white',
  accent: 'fill-accent-500 stroke-white',
};

/**
 * Stylised SVG of the Lagos metro with positioned pins. Stand-in for a real
 * Mapbox/Google Maps embed — the shape is illustrative, but pin coordinates
 * are derived from real lat/lng values so swap-in is straightforward.
 */
export function MapPlaceholder({
  pins,
  bounds = DEFAULT_BOUNDS,
  className,
  hint,
}: MapPlaceholderProps) {
  const W = 800;
  const H = 450;
  const project = (lat: number, lng: number): { x: number; y: number } => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W,
    y: H - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * H,
  });

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Lagos operations map"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E5E5" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {/* Mainland landmass */}
        <path
          d="M 40 130 Q 180 90 320 110 Q 460 130 560 90 Q 680 60 760 110 L 760 230 Q 680 250 600 240 Q 500 230 420 250 L 360 270 Q 260 290 180 270 Q 100 250 40 270 Z"
          fill="#FAFAFA"
          stroke="#D4D4D4"
          strokeWidth="1"
        />
        {/* Lagoon */}
        <path
          d="M 60 280 Q 180 320 320 300 Q 480 280 600 320 Q 700 340 760 320 L 760 380 Q 600 400 440 380 Q 280 360 60 380 Z"
          fill="#E0F2FE"
          stroke="#BAE6FD"
          strokeWidth="1"
        />
        {/* Island */}
        <path
          d="M 360 380 Q 480 410 600 390 L 660 410 Q 540 430 420 420 Z"
          fill="#FAFAFA"
          stroke="#D4D4D4"
          strokeWidth="1"
        />
        {/* Pins */}
        {pins.map((pin) => {
          const { x, y } = project(pin.lat, pin.lng);
          return (
            <g key={pin.id} transform={`translate(${x}, ${y})`}>
              <circle
                r="9"
                className={cn(
                  TONE[pin.tone ?? 'accent'],
                  'opacity-30',
                )}
              />
              <circle
                r="5"
                strokeWidth="2"
                className={TONE[pin.tone ?? 'accent']}
              />
            </g>
          );
        })}
      </svg>
      {hint ? (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[10px] text-neutral-500 shadow-sm backdrop-blur">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
