type OMForecastResponse = {
  timezone: string;
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    wind_speed_10m?: number[];
    weathercode?: number[];
    relative_humidity_2m?: number[];
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
  hourly: Array<{
    ts: string;
    temp_c: number;
    wind_ms: number;
    wmo_code: number;
    rh_pct: number;
  }>;
  daily: {
    t_mean_c: number;
    t_min_c: number;
    t_max_c: number;
    wind_max_ms: number;
    wmo_code: number;
    rh_mean_pct: number;
  };
  daily_series: Array<{
    day: string;
    t_mean_c: number;
    wind_max_ms: number;
    wmo_code: number;
    rh_mean_pct: number;
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
    hourly: [
      "temperature_2m",
      "wind_speed_10m",
      "weathercode",
      "relative_humidity_2m",
    ].join(","),
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
  const hourly = [] as {
    ts: string;
    temp_c: number;
    wind_ms: number;
    wmo_code: number;
    rh_pct: number;
  }[];
  const dayMap = new Map<
    string,
    { tSum: number; tN: number; hSum: number; hN: number }
  >();
  if (
    data.hourly?.time &&
    data.hourly.temperature_2m &&
    data.hourly.wind_speed_10m &&
    data.hourly.weathercode &&
    data.hourly.relative_humidity_2m
  ) {
    for (let i = 0; i < data.hourly.time.length; i++) {
      const ts = data.hourly.time[i];
      const t = data.hourly.temperature_2m[i];
      const w = data.hourly.wind_speed_10m[i];
      const wc = data.hourly.weathercode[i];
      const rh = data.hourly.relative_humidity_2m[i];
      if (
        typeof t === "number" &&
        typeof w === "number" &&
        typeof wc === "number" &&
        typeof rh === "number"
      ) {
        hourly.push({ ts, temp_c: t, wind_ms: w, wmo_code: wc, rh_pct: rh });
        const day = ts.slice(0, 10);
        const cur =
          dayMap.get(day) || { tSum: 0, tN: 0, hSum: 0, hN: 0 };
        cur.tSum += t;
        cur.tN += 1;
        cur.hSum += rh;
        cur.hN += 1;
        dayMap.set(day, cur);
      }
    }
  }

  const today =
    date ?? (hourly[0]?.ts?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));

  const dailySeries = Array.from(dayMap.keys())
    .sort((a, b) => (a < b ? -1 : 1))
    .map((day) => ({
      day,
      t_mean_c: avgTempFor(dayMap, day),
      rh_mean_pct: avgHumFor(dayMap, day),
      wind_max_ms: pickDaily(
        data.daily?.time,
        data.daily?.wind_speed_10m_max,
        day,
      ),
      wmo_code: pickDaily(data.daily?.time, data.daily?.weathercode, day),
    }));

  // Today aggregates
  const t_mean_c = avgTempFor(dayMap, today);
  const rh_mean_pct = avgHumFor(dayMap, today);
  const daily = {
    t_mean_c,
    t_min_c: pickDaily(data.daily?.time, data.daily?.temperature_2m_min, today),
    t_max_c: pickDaily(data.daily?.time, data.daily?.temperature_2m_max, today),
    wind_max_ms: pickDaily(data.daily?.time, data.daily?.wind_speed_10m_max, today),
    wmo_code: pickDaily(data.daily?.time, data.daily?.weathercode, today),
    rh_mean_pct,
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

function avgTempFor(
  map: Map<string, { tSum: number; tN: number; hSum: number; hN: number }>,
  day: string,
): number {
  const v = map.get(day);
  return v && v.tN > 0 ? v.tSum / v.tN : (NaN as unknown as number);
}

function avgHumFor(
  map: Map<string, { tSum: number; tN: number; hSum: number; hN: number }>,
  day: string,
): number {
  const v = map.get(day);
  return v && v.hN > 0 ? v.hSum / v.hN : (NaN as unknown as number);
}
