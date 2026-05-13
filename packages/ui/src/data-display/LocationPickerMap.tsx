'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  TileLayer,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationPickerMapProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  radiusMeters?: number;
  className?: string;
  zoom?: number;
}

const pinIcon = L.divIcon({
  className: 'forge-location-pin',
  html:
    '<div style="position:relative;width:24px;height:24px;">' +
    '<div style="position:absolute;inset:0;border-radius:9999px;background:rgba(20,184,166,0.25);"></div>' +
    '<div style="position:absolute;top:6px;left:6px;width:12px;height:12px;border-radius:9999px;background:#0d9488;box-shadow:0 0 0 2px #fff;"></div>' +
    '</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({
  onChange,
}: {
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
  radiusMeters,
  className,
  zoom = 14,
}: LocationPickerMapProps) {
  const center = useMemo<[number, number]>(() => [value.lat, value.lng], [value.lat, value.lng]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={value.lat} lng={value.lng} />
        <ClickHandler onChange={onChange} />
        <Marker
          position={center}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker;
              const { lat, lng } = marker.getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
        {radiusMeters && radiusMeters > 0 ? (
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{
              color: '#0d9488',
              fillColor: '#14b8a6',
              fillOpacity: 0.12,
              weight: 1.5,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
