type OMForecastResponse = {
  timezone: string;
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    weathercode?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    wind_speed_10m_max?: number[];
    weathercode?: number[];
  };
};

export type ForecastResult = {
  day: string;
  hourly: Array<{ ts: string; temp_c: number; wind_ms: number; wmo_code: number }>;
  daily: {
    t_mean_c: number;
    t_min_c: number;
    t_max_c: number;
    wind_max_ms: number;
    wmo_code: number;
  };
  daily_series: Array<{
    day: string;
    t_mean_c: number;
    wind_max_ms: number;
    wmo_code: number;
  }>;
  tz: string;
};

export async function getForecast(lat: number, lon: number, date?: string): Promise<ForecastResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("lat and lon are required");
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    hourly: ["temperature_2m", "wind_speed_10m", "weathercode"].join(","),
    daily: ["temperature_2m_min", "temperature_2m_max", "wind_speed_10m_max", "weathercode"].join(","),
    forecast_days: "8",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Forecast API error: ${res.status}`);
  }
  const data = (await res.json()) as OMForecastResponse;

  // Normalize
  const hourly = [] as { ts: string; temp_c: number; wind_ms: number; wmo_code: number }[];
  if (
    data.hourly?.time &&
    data.hourly.temperature_2m &&
    data.hourly.wind_speed_10m &&
    data.hourly.weathercode
  ) {
    for (let i = 0; i < data.hourly.time.length; i++) {
      const ts = data.hourly.time[i];
      const t = data.hourly.temperature_2m[i];
      const w = data.hourly.wind_speed_10m[i];
      const wc = data.hourly.weathercode[i];
      if (typeof t === "number" && typeof w === "number" && typeof wc === "number") {
        hourly.push({ ts, temp_c: t, wind_ms: w, wmo_code: wc });
      }
    }
  }

  const today = date ?? (hourly[0]?.ts?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));

  // Compute daily mean temp for each day present in hourly
  const dayMap = new Map<string, { sum: number; n: number }>();
  for (const h of hourly) {
    const d = h.ts.slice(0, 10);
    const cur = dayMap.get(d) || { sum: 0, n: 0 };
    cur.sum += h.temp_c;
    cur.n += 1;
    dayMap.set(d, cur);
  }
  const dailySeries = Array.from(dayMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day]) => ({
      day,
      t_mean_c: avgFor(dayMap, day),
      wind_max_ms: pickDaily(data.daily?.time, data.daily?.wind_speed_10m_max, day),
      wmo_code: pickDaily(data.daily?.time, data.daily?.weathercode, day),
    }));

  // Today aggregates
  const t_mean_c = avgFor(dayMap, today);
  const daily = {
    t_mean_c,
    t_min_c: pickDaily(data.daily?.time, data.daily?.temperature_2m_min, today),
    t_max_c: pickDaily(data.daily?.time, data.daily?.temperature_2m_max, today),
    wind_max_ms: pickDaily(data.daily?.time, data.daily?.wind_speed_10m_max, today),
    wmo_code: pickDaily(data.daily?.time, data.daily?.weathercode, today),
  };

  return {
    day: today,
    hourly,
    daily,
    daily_series: dailySeries,
    tz: data.timezone,
  };
}

function pickDaily(
  dates: string[] | undefined,
  arr: number[] | undefined,
  day: string
): number {
  if (!dates || !arr) return NaN as unknown as number;
  const idx = dates.findIndex((d) => d === day);
  return idx >= 0 ? (arr[idx] ?? (NaN as unknown as number)) : ((NaN as unknown) as number);
}

function avgFor(map: Map<string, { sum: number; n: number }>, day: string): number {
  const v = map.get(day);
  return v && v.n > 0 ? v.sum / v.n : (NaN as unknown as number);
}
