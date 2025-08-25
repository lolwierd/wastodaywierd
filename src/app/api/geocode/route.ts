import { NextRequest } from "next/server";

export const runtime = 'edge';

export const revalidate = 86400; // 1 day cache for same query

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return Response.json({ results: [] });
  }
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", q);
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "was-today-weird/0.1 (+https://example.com)",
      "Accept-Language": "en",
    },
    next: { revalidate },
  });
  if (!res.ok) return Response.json({ results: [] }, { status: 200 });
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
  return Response.json({ results });
}
