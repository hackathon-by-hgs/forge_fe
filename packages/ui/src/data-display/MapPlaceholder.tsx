'use client';

import type { Library } from '@googlemaps/js-api-loader';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { cn } from '../utils/cn';

export interface MapPin {
  /** Stable unique key among pins (e.g. job id, or session id when several pins share one job). */
  id: string;
  lat: number;
  lng: number;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent';
  label?: string;
  /** When pins use a non-job `id` (e.g. assignment session), set this so `onPinClick` can open `/jobs/:jobId`. */
  jobId?: string;
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
  /**
   * When set, loads the Google Maps JavaScript API and plots pins from `pins`.
   * Enable **Maps JavaScript API** on the key; enable **Directions API** only if you use
   * `directionsRoute`. If omitted or load fails, the SVG placeholder is used.
   */
  googleMapsApiKey?: string;
  /**
   * When true and there are at least 2 valid-coordinate pins, draws a driving route in pin
   * list order for up to 27 points (origin + 25 waypoints + destination). Remaining pins are
   * markers only. Default **false** — set true only when pin order is a meaningful route.
   */
  directionsRoute?: boolean;
  /** When set, markers become clickable. Prefer `pin.jobId ?? pin.id` for job URLs when `jobId` is set. */
  onPinClick?: (pin: MapPin) => void;
}

const DEFAULT_BOUNDS = {
  minLat: 6.4,
  maxLat: 6.62,
  minLng: 3.27,
  maxLng: 3.62,
};

const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

/** Module-level stable reference — useJsApiLoader warns if `libraries` identity changes each render. */
const GOOGLE_MAP_LIBRARIES: Library[] = ['maps', 'routes'];

const TONE_SVG: Record<NonNullable<MapPin['tone']>, string> = {
  success: 'fill-success-500 stroke-white',
  warning: 'fill-warning-500 stroke-white',
  danger: 'fill-danger-500 stroke-white',
  info: 'fill-info-500 stroke-white',
  accent: 'fill-accent-500 stroke-white',
};

const TONE_HEX: Record<NonNullable<MapPin['tone']>, string> = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  accent: '#7c3aed',
};

/** Google allows origin + 25 waypoints + destination in one Directions request. */
const MAX_DIRECTION_POINTS = 27;

function validCoordinatePins(pins: readonly MapPin[]): MapPin[] {
  return pins.filter(
    (p) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      Math.abs(p.lat) <= 90 &&
      Math.abs(p.lng) <= 180,
  );
}

function directionsSubset(coords: MapPin[]): MapPin[] {
  if (coords.length <= MAX_DIRECTION_POINTS) return coords;
  return coords.slice(0, MAX_DIRECTION_POINTS);
}

function MapPlaceholderSvg({
  pins,
  bounds = DEFAULT_BOUNDS,
  className,
  hint,
  onPinClick,
}: Pick<MapPlaceholderProps, 'pins' | 'bounds' | 'className' | 'hint' | 'onPinClick'>) {
  const gridPatternId = useId().replace(/:/g, '');
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
        aria-label="Operations map"
      >
        <defs>
          <pattern id={gridPatternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E5E5" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={`url(#${gridPatternId})`} />
        <path
          d="M 40 130 Q 180 90 320 110 Q 460 130 560 90 Q 680 60 760 110 L 760 230 Q 680 250 600 240 Q 500 230 420 250 L 360 270 Q 260 290 180 270 Q 100 250 40 270 Z"
          fill="#FAFAFA"
          stroke="#D4D4D4"
          strokeWidth="1"
        />
        <path
          d="M 60 280 Q 180 320 320 300 Q 480 280 600 320 Q 700 340 760 320 L 760 380 Q 600 400 440 380 Q 280 360 60 380 Z"
          fill="#E0F2FE"
          stroke="#BAE6FD"
          strokeWidth="1"
        />
        <path
          d="M 360 380 Q 480 410 600 390 L 660 410 Q 540 430 420 420 Z"
          fill="#FAFAFA"
          stroke="#D4D4D4"
          strokeWidth="1"
        />
        {pins.map((pin) => {
          const { x, y } = project(pin.lat, pin.lng);
          const interactive = Boolean(onPinClick);
          return (
            <g
              key={pin.id}
              transform={`translate(${x}, ${y})`}
              className={interactive ? 'cursor-pointer' : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onPinClick?.(pin) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPinClick?.(pin);
                      }
                    }
                  : undefined
              }
            >
              <circle r="9" className={cn(TONE_SVG[pin.tone ?? 'accent'], 'opacity-30')} />
              <circle r="5" strokeWidth="2" className={TONE_SVG[pin.tone ?? 'accent']} />
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

function markerIcon(tone: MapPin['tone']): google.maps.Symbol | undefined {
  if (typeof google === 'undefined' || !google.maps?.SymbolPath) return undefined;
  const fill = TONE_HEX[tone ?? 'accent'];
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  };
}

function MapPlaceholderGoogle({
  pins,
  className,
  hint,
  googleMapsApiKey,
  directionsRoute = false,
  onPinClick,
}: Required<Pick<MapPlaceholderProps, 'pins' | 'googleMapsApiKey'>> &
  Pick<MapPlaceholderProps, 'className' | 'hint' | 'directionsRoute' | 'onPinClick'>) {
  const coords = useMemo(() => validCoordinatePins(pins), [pins]);
  const routePins = useMemo(() => directionsSubset(coords), [coords]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'forge-google-maps',
    googleMapsApiKey,
    version: 'weekly',
    libraries: GOOGLE_MAP_LIBRARIES,
    region: 'NG',
    language: 'en',
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const fitMapToPins = useCallback(() => {
    const map = mapRef.current;
    if (!map || typeof google === 'undefined' || !google.maps) return;
    if (directions) return;

    if (coords.length === 0) {
      map.setCenter(LAGOS_CENTER);
      map.setZoom(11);
      return;
    }
    if (coords.length === 1 && coords[0]) {
      map.setCenter({ lat: coords[0].lat, lng: coords[0].lng });
      map.setZoom(14);
      return;
    }
    const b = new google.maps.LatLngBounds();
    coords.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(b, 48);
  }, [coords, directions]);

  useEffect(() => {
    fitMapToPins();
  }, [fitMapToPins]);

  useEffect(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps) return;
    if (!directionsRoute || routePins.length < 2) {
      setDirections(null);
      return;
    }

    const origin = routePins[0]!;
    const destination = routePins[routePins.length - 1]!;
    const middle = routePins.slice(1, -1);
    const waypoints: google.maps.DirectionsWaypoint[] = middle.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      stopover: true,
    }));

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints.length ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      },
    );
  }, [isLoaded, directionsRoute, routePins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !directions?.routes[0]?.bounds) return;
    map.fitBounds(directions.routes[0].bounds, 56);
  }, [directions]);

  /** Maps reads container size at init; grid/aspect layouts often report 0×0 until after paint. */
  useEffect(() => {
    if (!isLoaded || typeof google === 'undefined' || !google.maps?.event) return;
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const bump = () => {
      const map = mapRef.current;
      if (!map) return;
      google.maps.event.trigger(map, 'resize');
      fitMapToPins();
    };

    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(bump);
    });
    ro.observe(el);
    bump();
    const t = window.setTimeout(bump, 150);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [isLoaded, fitMapToPins]);

  const defaultCenter = useMemo(() => {
    if (coords.length === 0) return LAGOS_CENTER;
    const first = coords[0];
    if (coords.length === 1 && first) return { lat: first.lat, lng: first.lng };
    const lat = coords.reduce((s, p) => s + p.lat, 0) / coords.length;
    const lng = coords.reduce((s, p) => s + p.lng, 0) / coords.length;
    return { lat, lng };
  }, [coords]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitMapToPins();
      if (typeof google !== 'undefined' && google.maps?.event) {
        const bump = () => {
          google.maps.event.trigger(map, 'resize');
          fitMapToPins();
        };
        requestAnimationFrame(bump);
        window.setTimeout(bump, 0);
        window.setTimeout(bump, 100);
      }
    },
    [fitMapToPins],
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const rootClass = cn(
    'relative isolate w-full min-h-[220px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100',
    className,
  );

  if (loadError) {
    return (
      <div className={rootClass}>
        <MapPlaceholderSvg
          pins={pins}
          className="h-full min-h-[200px] w-full border-0"
          hint={hint}
          onPinClick={onPinClick}
        />
        <div className="pointer-events-none absolute inset-x-0 top-2 z-[1] flex justify-center px-3">
          <p className="max-w-md rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-center text-[10px] font-medium text-amber-900 shadow-sm">
            Google Maps could not load. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, referrer restrictions,
            and that the Maps JavaScript API is enabled.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={rootClass} role="status" aria-busy="true">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-2 p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-accent-600" />
          <p className="text-xs font-medium text-neutral-600">Loading map…</p>
        </div>
        {hint ? (
          <div className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-md bg-white/90 px-2 py-1 text-[10px] text-neutral-500 shadow-sm backdrop-blur">
            {hint}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={shellRef} className={rootClass}>
      {/*
        Map container must fill a sized box. Do not rely on h-full through a chain where the
        only child is position:absolute (that chain often yields 0×0 at first paint).
      */}
      <GoogleMap
        mapContainerClassName="absolute inset-0 z-0 block h-full w-full min-h-[220px]"
        mapContainerStyle={{ width: '100%', height: '100%', minHeight: 220 }}
        center={defaultCenter}
        zoom={coords.length <= 1 ? 14 : 11}
        onLoad={onMapLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {directions ? (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: true,
              preserveViewport: false,
              polylineOptions: {
                strokeColor: '#0284c7',
                strokeOpacity: 0.85,
                strokeWeight: 4,
              },
            }}
          />
        ) : null}
        {coords.map((pin) => (
          <Marker
            key={pin.id}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={pin.label ?? pin.id}
            icon={markerIcon(pin.tone)}
            clickable={Boolean(onPinClick)}
            cursor={onPinClick ? 'pointer' : undefined}
            onClick={onPinClick ? () => onPinClick(pin) : undefined}
          />
        ))}
      </GoogleMap>
      {hint ? (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-md bg-white/90 px-2 py-1 text-[10px] text-neutral-500 shadow-sm backdrop-blur">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Lagos metro SVG stand-in, or a live Google Map when `googleMapsApiKey` is provided.
 * Loads **maps** + **routes** libraries. Optional ordered driving route when
 * `directionsRoute` is true (requires Directions API billing on the key).
 */
export function MapPlaceholder({
  pins,
  bounds,
  className,
  hint,
  googleMapsApiKey,
  directionsRoute = false,
  onPinClick,
}: MapPlaceholderProps) {
  const key = googleMapsApiKey?.trim();
  if (key) {
    return (
      <MapPlaceholderGoogle
        pins={pins}
        className={className}
        hint={hint}
        googleMapsApiKey={key}
        directionsRoute={directionsRoute}
        onPinClick={onPinClick}
      />
    );
  }
  return (
    <MapPlaceholderSvg
      pins={pins}
      bounds={bounds}
      className={className}
      hint={hint}
      onPinClick={onPinClick}
    />
  );
}
