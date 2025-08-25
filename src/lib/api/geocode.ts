export type GeocodeResult = {
  name: string;
  lat: number;
  lon: number;
};

export type GeocodeResponse = {
  results: GeocodeResult[];
};

export async function geocodeSearch(query: string): Promise<GeocodeResponse> {
  if (!query || query.trim().length < 2) {
    return { results: [] };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "was-today-weird/0.1 (+https://github.com/user/repo)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) return { results: [] };

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      addresstype?: string;
    }>;

    const results = data
      .filter((d) => d.addresstype === "city")
      .map((d) => ({
        name: d.display_name as string,
        lat: Number(d.lat),
        lon: Number(d.lon),
      }));

    return { results };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { results: [] };
  }
}
