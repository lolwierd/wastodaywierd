export type SeriesPoint = { ts: string; temp_c: number; wind_ms: number };
export type DailyObs = {
  day: string;
  t_mean_c: number;
  t_min_c: number;
  t_max_c: number;
  wind_max_ms: number;
};

export type NormalsHourlyPoint = {
  hour: number;
  temp_c_mean: number;
  temp_c_std?: number;
  wind_ms_mean: number;
  wind_ms_std?: number;
};

export type NormalsDaily = {
  t_mean_c_mean: number;
  t_mean_c_std?: number;
  wind_max_ms_mean: number;
  wind_max_ms_std?: number;
};

export type Anomaly = { value: number; delta: number; percentile: number; z?: number };

export type TodayResult = {
  location: { lat: number; lon: number; name?: string; tz: string };
  daily: { temp: Anomaly; wind: Anomaly };
  hourly: Array<{ ts: string; temp: Anomaly; wind: Anomaly }>;
  source: { today: "forecast"; yesterday: "reanalysis" | "forecast" };
};

