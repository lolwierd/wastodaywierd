export const runtime = 'edge';

import { NextRequest } from "next/server";

export const revalidate = 3600; // 1 hour

function parseIp(req: NextRequest): string | undefined {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const ip = xf.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;
  return undefined;
}

export async function GET(req: NextRequest) {
  // If running on a platform with built-in geo, prefer that via headers
  const city = req.headers.get("x-vercel-ip-city") ?? undefined;
  const country = req.headers.get("x-vercel-ip-country") ?? undefined;
  const region = req.headers.get("x-vercel-ip-country-region") ?? undefined;
  const latH = req.headers.get("x-vercel-ip-latitude");
  const lonH = req.headers.get("x-vercel-ip-longitude");
  if (latH && lonH) {
    return Response.json({ lat: Number(latH), lon: Number(lonH), city, region, country, source: "header" });
  }

  // Fallback: use external IP geolocation
  const ip = parseIp(req);
  try {
    const endpoint = process.env.IP_GEO_ENDPOINT || `https://ipapi.co/${ip ?? ""}/json/`;
    const res = await fetch(endpoint, { next: { revalidate } });
    if (res.ok) {
      const data = await res.json();
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return Response.json({
          lat,
          lon,
          city: data.city ?? undefined,
          region: data.region ?? undefined,
          country: data.country_name ?? undefined,
          source: "ipapi",
        });
      }
    }
  } catch {}

  return Response.json({ error: "geo unavailable" }, { status: 204 });
}

