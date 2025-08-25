export type ReverseGeocodeResult = {
  name: string | null;
};

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { name: null };
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "was-today-weird/0.1 (+https://github.com/user/repo)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) return { name: null };

    const data = await res.json();
    const name =
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.name ||
      data?.display_name ||
      null;

    return { name };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { name: null };
  }
}
