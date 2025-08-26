// Air quality data from Open-Meteo

type OMAirQualityResponse = {
  hourly?: {
    time: string[];
    pm10?: number[];
    pm2_5?: number[];
    ozone?: number[];
    nitrogen_dioxide?: number[];
    us_aqi?: number[];
  };
};

export type AirQualityResult = {
  pm10: number | null;
  pm2_5: number | null;
  ozone: number | null;
  nitrogen_dioxide: number | null;
  us_aqi: number | null;
};

export async function getAirQuality(lat: number, lon: number): Promise<AirQualityResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("lat and lon are required");
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: ["pm10", "pm2_5", "ozone", "nitrogen_dioxide", "us_aqi"].join(","),
  });

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Air quality API error: ${res.status}`);
  }
  const data = (await res.json()) as OMAirQualityResponse;
  const idx = data.hourly?.time?.length ? data.hourly.time.length - 1 : -1;
  const pick = (arr: number[] | undefined) =>
    idx >= 0 && arr && typeof arr[idx] === "number" ? arr[idx] : null;

  return {
    pm10: pick(data.hourly?.pm10),
    pm2_5: pick(data.hourly?.pm2_5),
    ozone: pick(data.hourly?.ozone),
    nitrogen_dioxide: pick(data.hourly?.nitrogen_dioxide),
    us_aqi: pick(data.hourly?.us_aqi),
  };
}

