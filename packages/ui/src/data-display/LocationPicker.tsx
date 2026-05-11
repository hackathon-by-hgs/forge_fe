'use client';

import dynamic from 'next/dynamic';
import { cn } from '../utils/cn';
import type { LocationPickerMapProps } from './LocationPickerMap';

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
      Loading map…
    </div>
  ),
});

export interface LocationPickerProps extends LocationPickerMapProps {}

export function LocationPicker({ className, ...rest }: LocationPickerProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-neutral-200', className)}>
      <LocationPickerMap {...rest} className="h-full w-full" />
      <p className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md bg-white/90 px-2 py-1 text-[10px] text-neutral-500 shadow-sm backdrop-blur">
        Click anywhere to drop the pin, or drag it to fine-tune.
      </p>
    </div>
  );
}
