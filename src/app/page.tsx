export const runtime = 'edge';

import { Suspense } from "react";
import { dayOfYear, wrapDayOfYear } from "@/lib/time";
import { headers } from "next/headers";
import WeeklyNormalsPanel from "@/components/WeeklyNormalsPanel";
import UpcomingAnomalyChart from "@/components/UpcomingAnomalyChart";
import { percentileOf } from "@/lib/stats";
import ChartCard from "@/components/ChartCard";
import LocationSearch from "@/components/LocationSearch";

export const dynamic = "force-dynamic";

type ForecastOut = {
  day: string;
  tz: string;
  daily: { t_mean_c: number; wind_max_ms: number };
  daily_series?: Array<{ day: string; t_mean_c: number; wind_max_ms: number }>;
};

type NormalsOut = {
  daily: { t_mean_c_mean: number; t_mean_c_std?: number; wind_max_ms_mean: number | null; wind_max_ms_std?: number };
  sample_size: number;
  week_series?: Array<{ doy: number; t_mean_c_mean: number; t_mean_c_std?: number; n: number; wind_max_ms_mean: number | null; wind_max_ms_std?: number; wind_n: number }>;
  fortnight_series?: Array<{ doy: number; t_mean_c_mean: number; t_mean_c_std?: number; n: number; wind_max_ms_mean: number | null; wind_max_ms_std?: number; wind_n: number }>;
  samples?: { temp_c: number[]; wind_ms: number[] };
};

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const spObj = searchParams ? await searchParams : undefined;
  // Derive location: query params -> IP geo -> fallback to Vadodara
  let lat = Number(spObj?.lat);
  let lon = Number(spObj?.lon);
  let locationName = spObj?.loc;
  const base = process.env.NEXT_PUBLIC_BASE_URL || (await getBaseUrl());
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    try {
      const geo = await fetch(new URL(`/api/geo`, base)).then((r) => r.json());
      if (Number.isFinite(geo.lat) && Number.isFinite(geo.lon)) {
        lat = geo.lat;
        lon = geo.lon;
      }
      if (!locationName && geo?.city) {
        locationName = geo.city as string;
      }
    } catch {}
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    lat = 22.3072; // Vadodara fallback
    lon = 73.1812;
    if (!locationName) locationName = "Vadodara";
  }
  const today = new Date();
  const doy = dayOfYear(today);

  const forecastPromise = fetch(new URL(`/api/forecast?lat=${lat}&lon=${lon}`, base), { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error("Forecast fetch failed");
    return r.json() as Promise<ForecastOut>;
  });

  const normalsPromise = fetch(new URL(`/api/normals?lat=${lat}&lon=${lon}&doy=${doy}`, base)).then((r) => {
    if (!r.ok) throw new Error("Normals fetch failed");
    return r.json() as Promise<NormalsOut>;
  });

  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-8">
      <Suspense fallback={<LoadingCards />}>
        <Content
          locationName={locationName}
          forecastPromise={forecastPromise}
          normalsPromise={normalsPromise}
        />
      </Suspense>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-16 bg-gray-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-16 bg-gray-200 dark:bg-zinc-800 rounded-md" />
      </section>
    </div>
  );
}

async function Content({
  locationName,
  forecastPromise,
  normalsPromise,
}: {
  locationName?: string;
  forecastPromise: Promise<ForecastOut>;
  normalsPromise: Promise<NormalsOut>;
}) {
  const [forecastRes, normalsRes] = await Promise.allSettled([
    forecastPromise,
    normalsPromise,
  ]);

  let forecast: ForecastOut | null = null;
  let normals: NormalsOut | null = null;
  let forecastError: string | null = null;
  let normalsError: string | null = null;

  if (forecastRes.status === "fulfilled") {
    forecast = forecastRes.value;
  } else {
    forecastError = "Forecast unavailable; try again later";
  }
  if (normalsRes.status === "fulfilled") {
    normals = normalsRes.value;
  } else {
    normalsError = "Normals unavailable; try again later";
  }

  const header = (
    <header className="w-full max-w-3xl flex items-center justify-between">
      <h1 className="text-xl font-semibold">Was today weird?</h1>
      <div className="flex items-center gap-2">
        {forecast && (
          <div className="text-sm text-gray-500">
            {forecast.day} • {forecast.tz}
          </div>
        )}
        {locationName && (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200">
            {locationName}
          </span>
        )}
      </div>
    </header>
  );

  if (!forecast || !normals) {
    return (
      <>
        {header}
        <LocationSearch />
        <main className="w-full max-w-3xl flex flex-col gap-6">
          {forecastError && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-center text-sm text-gray-600">
              {forecastError}
            </div>
          )}
          {normalsError && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-center text-sm text-gray-600">
              {normalsError}
            </div>
          )}
        </main>
      </>
    );
  }

  const tActual = forecast.daily.t_mean_c;
  const tNormal = normals.daily.t_mean_c_mean;
  const delta =
    Number.isFinite(tActual) && Number.isFinite(tNormal)
      ? tActual - tNormal
      : NaN;
  const wActual = forecast.daily.wind_max_ms;
  const wNormal = normals.daily.wind_max_ms_mean;
  const wDelta =
    Number.isFinite(wActual) && Number.isFinite(wNormal as number)
      ? wActual - (wNormal as number)
      : NaN;

  const tPct =
    normals.samples?.temp_c && Number.isFinite(tActual)
      ? percentileOf(tActual, normals.samples.temp_c)
      : NaN;
  const wPct =
    normals.samples?.wind_ms && Number.isFinite(wActual)
      ? percentileOf(wActual, normals.samples.wind_ms)
      : NaN;
  const tZ = normals.daily.t_mean_c_std
    ? delta / (normals.daily.t_mean_c_std || 1)
    : undefined;
  const wZ = normals.daily.wind_max_ms_std
    ? wDelta / (normals.daily.wind_max_ms_std || 1)
    : undefined;

  return (
    <>
      {header}
      <LocationSearch />
      <main className="w-full max-w-3xl flex flex-col gap-6">
        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">Temperature anomaly</div>
            <div className="text-5xl font-bold">{fmtDelta(delta, "°C")}</div>
            <div className="text-sm text-gray-600">
              Actual {fmt(tActual)} °C vs normal {fmt(tNormal)} °C
              {Number.isFinite(tPct) && ` • p${tPct.toFixed(0)}`}
              {tZ != null && Number.isFinite(tZ) && ` • z=${tZ.toFixed(1)}`}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">Wind anomaly</div>
            <div className="text-5xl font-bold">{fmtDelta(wDelta, "m/s")}</div>
            <div className="text-sm text-gray-600">
              Actual {fmt(wActual)} m/s vs normal {fmt(wNormal)} m/s
              {Number.isFinite(wPct) && ` • p${wPct.toFixed(0)}`}
              {wZ != null && Number.isFinite(wZ) && ` • z=${wZ.toFixed(1)}`}
            </div>
          </div>
          <div className="md:col-span-2 text-xs text-gray-500">
            Normals 1991–2020 • sample {normals.sample_size}
          </div>
        </section>
      </main>
      {/* Weekly normals with bands (temp + wind) */}
      {normals.week_series && normals.week_series.length > 0 && (
        <ChartCard title="Normals this week" subtitle="Mean values (± std)">
          <WeeklyNormalsPanel
            data={normals.week_series.map((p, i) => ({
              label: i - 3 === 0 ? "Today" : i - 3 < 0 ? `${i - 3}` : `+${i - 3}`,
              temp: p.t_mean_c_mean,
              tStd: p.t_mean_c_std,
              wind: p.wind_max_ms_mean ?? undefined,
              wStd: p.wind_max_ms_std,
            }))}
          />
        </ChartCard>
      )}
      {/* Upcoming 7 days anomalies (temperature) */}
      {forecast.daily_series && normals.fortnight_series && (
        <ChartCard title="Next 7 days" subtitle="Temperature anomaly vs normal">
          <UpcomingAnomalyChart
            data={forecast.daily_series
              .filter((d) => d.day >= forecast.day)
              .slice(0, 7)
              .map((d, idx) => {
                const dt = new Date(d.day + "T00:00:00Z");
                const doy2 = dayOfYear(dt);
                const n = normals.fortnight_series!.find(
                  (x) => x.doy === wrapDayOfYear(doy2)
                );
                const normal = n?.t_mean_c_mean ?? NaN;
                const anomaly =
                  Number.isFinite(d.t_mean_c) && Number.isFinite(normal)
                    ? d.t_mean_c - normal
                    : NaN;
                return {
                  day: idx === 0 ? "Today" : d.day.slice(5),
                  anomaly,
                  normal,
                  actual: d.t_mean_c,
                };
              })}
          />
        </ChartCard>
      )}
      <footer className="text-xs text-gray-500">
        Data from Open‑Meteo. Normals 1991 to 2020.
      </footer>
    </>
  );
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
function fmt(n: unknown): string {
  return isFiniteNumber(n) ? n.toFixed(1) : "–";
}
function fmtDelta(n: unknown, unit: string): string {
  if (!isFiniteNumber(n)) return "–";
  const v = n;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} ${unit}`;
}
