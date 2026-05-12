import type { Library } from '@googlemaps/js-api-loader';

/**
 * Shared loader id + libraries for every Google Maps consumer in this package.
 *
 * `useJsApiLoader` loads the SDK once per `id` and only honours the first set
 * of libraries seen. If MapPlaceholder mounted first with a subset, the
 * LocationPicker's Places Autocomplete would silently fail. Keep both call
 * sites on the union below.
 */
export const FORGE_GOOGLE_MAPS_LOADER_ID = 'forge-google-maps';
export const GOOGLE_MAP_LIBRARIES: Library[] = ['maps', 'routes', 'places'];
