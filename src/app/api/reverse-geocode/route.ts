import { NextRequest } from "next/server";

export const runtime = 'edge';

export const revalidate = 86400; // cache for 1 day

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!lat || !lon) {
    return Response.json({ name: null }, { status: 400 });
  }
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "was-today-weird/0.1 (+https://example.com)",
      "Accept-Language": "en",
    },
    next: { revalidate },
  });
  if (!res.ok) return Response.json({ name: null }, { status: 200 });
  const data = await res.json();
  const name =
    data?.address?.city ||
    data?.address?.town ||
    data?.address?.village ||
    data?.name ||
    data?.display_name ||
    null;
  return Response.json({ name });
}
