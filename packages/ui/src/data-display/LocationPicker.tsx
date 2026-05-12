'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Circle,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { IconLocation } from '../icons';
import { cn } from '../utils/cn';
import { toast } from '../feedback/Toaster';
import { FORGE_GOOGLE_MAPS_LOADER_ID, GOOGLE_MAP_LIBRARIES } from './_googleMaps';

export interface LocationPickerProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  /**
   * When set, draws a translucent geofence circle of this radius (metres)
   * around the marker. Updates live as the radius prop changes.
   */
  radiusMeters?: number;
  /**
   * Fired when the user picks a place via the search box. The picker
   * always updates `value` via `onChange`; this lets the host also
   * write the resolved formatted address back into a form field.
   */
  onAddressSelect?: (formattedAddress: string) => void;
  /** Google Maps API key. Falls back to a static notice if missing/invalid. */
  googleMapsApiKey?: string;
  /** Restrict Places Autocomplete to a country (ISO 3166-1 alpha-2). Default 'ng'. */
  countryCode?: string;
  /** Initial zoom level. Default 14. */
  zoom?: number;
  className?: string;
}

const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

function isFiniteCoord(coord: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(coord.lat) &&
    Number.isFinite(coord.lng) &&
    Math.abs(coord.lat) <= 90 &&
    Math.abs(coord.lng) <= 180
  );
}

function MissingApiKeyNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-dashed border-outline bg-surface-container-high px-4 py-6 text-center',
        className,
      )}
    >
      <p className="text-xs text-neutral-600">
        Map unavailable — set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        {' '}to enable the location picker. You can still enter the address by hand.
      </p>
    </div>
  );
}

function LoadErrorNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center',
        className,
      )}
    >
      <p className="text-xs text-amber-900">
        Google Maps could not load. Check the API key, referrer restrictions,
        and that Maps JavaScript API + Places API are enabled.
      </p>
    </div>
  );
}

function LoadingNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100',
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-2 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-accent-600" />
        <p className="text-xs font-medium text-neutral-600">Loading map…</p>
      </div>
    </div>
  );
}

export function LocationPicker({
  value,
  onChange,
  radiusMeters,
  onAddressSelect,
  googleMapsApiKey,
  countryCode = 'ng',
  zoom = 14,
  className,
}: LocationPickerProps) {
  const apiKey = googleMapsApiKey?.trim();

  const { isLoaded, loadError } = useJsApiLoader({
    id: FORGE_GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: apiKey ?? '',
    version: 'weekly',
    libraries: GOOGLE_MAP_LIBRARIES,
    region: 'NG',
    language: 'en',
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const safeValue = useMemo(() => (isFiniteCoord(value) ? value : LAGOS_CENTER), [value]);
  const center = useMemo(() => ({ lat: safeValue.lat, lng: safeValue.lng }), [safeValue.lat, safeValue.lng]);

  // Recenter on external value changes (e.g., user selects a neighborhood from the dropdown).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(center);
  }, [center]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (typeof lat === 'number' && typeof lng === 'number') {
        onChange({ lat, lng });
      }
    },
    [onChange],
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (typeof lat === 'number' && typeof lng === 'number') {
        onChange({ lat, lng });
      }
    },
    [onChange],
  );

  const handlePlaceChanged = useCallback(() => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      toast({
        tone: 'warning',
        title: 'No location for that result',
        description: 'Try a more specific address.',
      });
      return;
    }
    onChange({ lat, lng });
    if (place.formatted_address && onAddressSelect) {
      onAddressSelect(place.formatted_address);
    }
  }, [autocomplete, onAddressSelect, onChange]);

  const handleUseMyLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({
        tone: 'warning',
        title: 'Geolocation unavailable',
        description: 'Your browser does not expose location.',
      });
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGeolocating(false);
        toast({
          tone: 'warning',
          title: 'Could not get your location',
          description: err.code === err.PERMISSION_DENIED
            ? 'Allow location access in your browser settings to use this.'
            : err.message || 'Try again or pick on the map.',
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [onChange]);

  if (!apiKey) {
    return <MissingApiKeyNotice className={className} />;
  }

  if (loadError) {
    return <LoadErrorNotice className={className} />;
  }

  if (!isLoaded) {
    return <LoadingNotice className={className} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={handlePlaceChanged}
            options={{
              componentRestrictions: { country: countryCode },
              fields: ['formatted_address', 'geometry.location', 'name'],
            }}
          >
            <input
              type="text"
              placeholder="Search address, place, or landmark…"
              className="h-9 w-full rounded-md border border-outline bg-surface px-3 text-sm placeholder:text-neutral-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
              aria-label="Search location"
            />
          </Autocomplete>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geolocating}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-surface-container-high disabled:opacity-50"
          aria-label="Use my current location"
        >
          <IconLocation className="!h-3.5 !w-3.5" />
          {geolocating ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      <div className="relative isolate overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
        <GoogleMap
          mapContainerClassName="block h-full w-full min-h-[260px]"
          mapContainerStyle={{ width: '100%', height: '100%', minHeight: 260 }}
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={handleMapClick}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy',
            clickableIcons: false,
          }}
        >
          <Marker
            position={center}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
          {radiusMeters && radiusMeters > 0 ? (
            <Circle
              center={center}
              radius={radiusMeters}
              options={{
                strokeColor: '#0d9488',
                strokeOpacity: 0.85,
                strokeWeight: 1.5,
                fillColor: '#14b8a6',
                fillOpacity: 0.12,
                clickable: false,
              }}
            />
          ) : null}
        </GoogleMap>
        <p className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-md bg-white/90 px-2 py-1 text-[10px] text-neutral-500 shadow-sm backdrop-blur">
          Click anywhere to drop the pin, or drag it to fine-tune.
        </p>
      </div>
    </div>
  );
}
