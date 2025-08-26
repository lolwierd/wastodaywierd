// Main API utilities for client-side data fetching
// All external API calls (Open-Meteo, Nominatim) are made directly from the browser

import {
  getForecast as fetchForecast,
  type ForecastResult,
} from "./forecast";
import {
  getNormals as fetchNormals,
  type NormalsResult,
} from "./normals";
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

// Simple session cache for forecast and normals
const memoryCache = new Map<string, unknown>();

function readCache<T>(key: string): T | undefined {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      /* ignore */
    }
  }
  return memoryCache.get(key) as T | undefined;
}

function writeCache<T>(key: string, value: T) {
  memoryCache.set(key, value);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}

export async function getForecast(
  lat: number,
  lon: number,
  date?: string,
  forceRefresh = false
): Promise<ForecastResult> {
  const key = `forecast:${lat}:${lon}:${date ?? ""}`;
  if (!forceRefresh) {
    const cached = readCache<ForecastResult>(key);
    if (cached) return cached;
  }
  const result = await fetchForecast(lat, lon, date);
  writeCache(key, result);
  return result;
}

export async function getNormals(
  lat: number,
  lon: number,
  doy: number,
  forceRefresh = false
): Promise<NormalsResult> {
  const key = `normals:${lat}:${lon}:${doy}`;
  if (!forceRefresh) {
    const cached = readCache<NormalsResult>(key);
    if (cached) return cached;
  }
  const result = await fetchNormals(lat, lon, doy);
  writeCache(key, result);
  return result;
}

export type { ForecastResult, NormalsResult };

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
