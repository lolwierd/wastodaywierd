// Main API utilities for client-side data fetching
// All external API calls (Open-Meteo, Nominatim) are made directly from the browser

export { getForecast, type ForecastResult } from "./forecast";
export { getNormals, type NormalsResult } from "./normals";
export {
  geocodeSearch,
  type GeocodeResult,
  type GeocodeResponse,
} from "./geocode";
export { reverseGeocode, type ReverseGeocodeResult } from "./reverse-geocode";
export {
  getCurrentLocation,
  getCurrentLocationSafe,
  getBrowserLocation,
  type GeoResult,
  type GeoError,
} from "./geo";

// Import types for internal use
import type { ForecastResult } from "./forecast";
import type { NormalsResult } from "./normals";

// Re-export commonly used types for convenience
export type WeatherData = {
  forecast: ForecastResult;
  normals: NormalsResult;
  location: {
    lat: number;
    lon: number;
    name?: string;
  };
};
