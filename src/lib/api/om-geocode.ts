export type GeocodeResult = {
  name: string;
  lat: number;
  lon: number;
};

export type GeocodeResponse = {
  results: GeocodeResult[];
};

export async function omGeocodeSearch(query: string): Promise<GeocodeResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [] };
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
      }>;
    };
    const results = (data.results || []).map((r) => ({
      name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lon: r.longitude,
    }));
    return { results };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { results: [] };
  }
}

export type ReverseGeocodeResult = {
  name: string | null;
};

export async function omReverseGeocode(
  lat: number,
  lon: number,
): Promise<ReverseGeocodeResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { name: null };
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { name: null };
    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        admin1?: string;
      }>;
    };
    const first = data.results?.[0];
    const name = first
      ? [first.name, first.admin1, first.country].filter(Boolean).join(", ")
      : null;
    return { name };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { name: null };
  }
}
