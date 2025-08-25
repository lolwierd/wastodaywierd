export const runtime = 'edge';

import { NextRequest } from "next/server";

export const revalidate = 1800; // 30 minutes

type OMairResponse = {
  hourly?: {
    time: string[];
    pm2_5?: number[];
    pm10?: number[];
    ozone?: number[];
    nitrogen_dioxide?: number[];
    sulphur_dioxide?: number[];
    us_aqi?: number[];
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
      "sulphur_dioxide",
      "us_aqi",
    ].join(","),
    timezone: "auto",
  });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    return Response.json({ error: "upstream error", status: res.status }, { status: 502 });
  }
  const data = (await res.json()) as OMairResponse;

  const t = data.hourly?.time;
  const idx = t && t.length > 0 ? t.length - 1 : -1;
  const out = {
    ts: idx >= 0 && t ? t[idx] : undefined,
    pm2_5: data.hourly?.pm2_5?.[idx],
    pm10: data.hourly?.pm10?.[idx],
    ozone: data.hourly?.ozone?.[idx],
    nitrogen_dioxide: data.hourly?.nitrogen_dioxide?.[idx],
    sulphur_dioxide: data.hourly?.sulphur_dioxide?.[idx],
    us_aqi: data.hourly?.us_aqi?.[idx],
  };

  return Response.json(out);
}

