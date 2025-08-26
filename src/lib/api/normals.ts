import { mean, std } from "@/lib/stats";
import { wrapDayOfYear } from "@/lib/time";

type ArchiveDaily = {
  time: string[];
  temperature_2m_mean?: number[];
  wind_speed_10m_max?: number[];
  relative_humidity_2m_mean?: number[];
};

type OMArchiveResponse = {
  timezone: string;
  daily?: ArchiveDaily;
};

export type NormalsResult = {
  dayofyear: number;
  hourly: [];
  daily: {
    t_mean_c_mean: number;
    t_mean_c_std?: number;
    wind_max_ms_mean: number | null;
    wind_max_ms_std?: number;
    rh_pct_mean: number | null;
    rh_pct_std?: number;
  };
  sample_size: number;
  week_series: Array<{
    doy: number;
    t_mean_c_mean: number;
    t_mean_c_std?: number;
    n: number;
    wind_max_ms_mean: number | null;
    wind_max_ms_std?: number;
    wind_n: number;
  }>;
  fortnight_series: Array<{
    doy: number;
    t_mean_c_mean: number;
    t_mean_c_std?: number;
    n: number;
    wind_max_ms_mean: number | null;
    wind_max_ms_std?: number;
    wind_n: number;
  }>;
  samples: {
    temp_c: number[];
    wind_ms: number[];
    rh_pct: number[];
  };
};

export async function getNormals(lat: number, lon: number, doy: number): Promise<NormalsResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(doy)) {
    throw new Error("lat, lon and doy are required");
  }

  // Fetch ERA5 daily mean temperature for 1991-01-01 .. 2020-12-31
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: "1991-01-01",
    end_date: "2020-12-31",
    daily: [
      "temperature_2m_mean",
      "wind_speed_10m_max",
      "relative_humidity_2m_mean",
    ].join(","),
    timezone: "auto",
  });
  const url = `https://archive-api.open-meteo.com/v1/era5?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Archive API error: ${res.status}`);
  }
  const data = (await res.json()) as OMArchiveResponse;

  const daily = data.daily;
  if (!daily?.time || !daily.temperature_2m_mean) {
    throw new Error("no daily data");
  }

  // Build sample S: values within +/-7 days of provided day-of-year across all years
  const window = new Set<number>();
  for (let off = -7; off <= 7; off++) {
    window.add(wrapDayOfYear(doy + off));
  }

  const values: number[] = [];
  const windValues: number[] = [];
  const humValues: number[] = [];
  for (let i = 0; i < daily.time.length; i++) {
    const d = new Date(daily.time[i] + "T00:00:00Z");
    const dayOfYear = getDOY(d);
    if (window.has(dayOfYear)) {
      const v = daily.temperature_2m_mean[i];
      if (typeof v === "number") values.push(v);
      const wv = daily.wind_speed_10m_max?.[i];
      if (typeof wv === "number") windValues.push(wv);
      const hv = daily.relative_humidity_2m_mean?.[i];
      if (typeof hv === "number") humValues.push(hv);
    }
  }

  const t_mean_c_mean = mean(values);
  const t_mean_c_std = std(values);
  const wind_max_ms_mean = windValues.length ? mean(windValues) : (null as unknown as number);
  const wind_max_ms_std = windValues.length ? std(windValues) : undefined;
  const rh_pct_mean = humValues.length ? mean(humValues) : (null as unknown as number);
  const rh_pct_std = humValues.length ? std(humValues) : undefined;

  // Precompute day-of-year for all days to support fast smoothing queries
  const allDOY: number[] = daily.time.map((t) => getDOY(new Date(t + "T00:00:00Z")));
  const allVals: number[] = daily.temperature_2m_mean;
  const allWind: number[] | undefined = daily.wind_speed_10m_max;
  const allHum: number[] | undefined = daily.relative_humidity_2m_mean;

  function smoothStats(center: number) {
    const window = new Set<number>();
    for (let off = -7; off <= 7; off++) window.add(wrapDayOfYear(center + off));
    const vs: number[] = [];
    for (let i = 0; i < allDOY.length; i++) {
      if (window.has(allDOY[i])) {
        const v = allVals[i];
        if (typeof v === "number") vs.push(v);
      }
    }
    const vsWind: number[] = [];
    if (allWind) {
      for (let i = 0; i < allDOY.length; i++) {
        if (window.has(allDOY[i])) {
          const v = allWind[i];
          if (typeof v === "number") vsWind.push(v);
        }
      }
    }
    const vsHum: number[] = [];
    if (allHum) {
      for (let i = 0; i < allDOY.length; i++) {
        if (window.has(allDOY[i])) {
          const v = allHum[i];
          if (typeof v === "number") vsHum.push(v);
        }
      }
    }
    return {
      mean: mean(vs),
      std: std(vs),
      n: vs.length,
      windMean: vsWind.length ? mean(vsWind) : (null as unknown as number),
      windStd: vsWind.length ? std(vsWind) : undefined,
      windN: vsWind.length,
      humMean: vsHum.length ? mean(vsHum) : (null as unknown as number),
      humStd: vsHum.length ? std(vsHum) : undefined,
      humN: vsHum.length,
    };
  }

  // Build 7-day and 15-day series centered around the given doy
  const week_series = [] as Array<{
    doy: number;
    t_mean_c_mean: number;
    t_mean_c_std?: number;
    n: number;
    wind_max_ms_mean: number | null;
    wind_max_ms_std?: number;
    wind_n: number;
  }>;
  for (let off = -3; off <= 3; off++) {
    const d = wrapDayOfYear(doy + off);
    const s = smoothStats(d);
    week_series.push({
      doy: d,
      t_mean_c_mean: s.mean,
      t_mean_c_std: s.std ?? undefined,
      n: s.n,
      wind_max_ms_mean: s.windMean,
      wind_max_ms_std: s.windStd,
      wind_n: s.windN,
    });
  }

  const fortnight_series = [] as Array<{
    doy: number;
    t_mean_c_mean: number;
    t_mean_c_std?: number;
    n: number;
    wind_max_ms_mean: number | null;
    wind_max_ms_std?: number;
    wind_n: number;
  }>;
  for (let off = -7; off <= 7; off++) {
    const d = wrapDayOfYear(doy + off);
    const s = smoothStats(d);
    fortnight_series.push({
      doy: d,
      t_mean_c_mean: s.mean,
      t_mean_c_std: s.std ?? undefined,
      n: s.n,
      wind_max_ms_mean: s.windMean,
      wind_max_ms_std: s.windStd,
      wind_n: s.windN,
    });
  }

  return {
    dayofyear: doy,
    hourly: [],
    daily: {
      t_mean_c_mean,
      t_mean_c_std: t_mean_c_std ?? undefined,
      wind_max_ms_mean,
      wind_max_ms_std,
      rh_pct_mean,
      rh_pct_std,
    },
    sample_size: values.length,
    week_series,
    fortnight_series,
    samples: {
      temp_c: values,
      wind_ms: windValues,
      rh_pct: humValues,
    },
  };
}

function getDOY(d: Date): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}
