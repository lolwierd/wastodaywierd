"use client";

import { dayOfYear, wrapDayOfYear } from "@/lib/time";
import WeeklyNormalsPanel from "@/components/WeeklyNormalsPanel";
import UpcomingAnomalyChart from "@/components/UpcomingAnomalyChart";
import { percentileOf } from "@/lib/stats";
import ChartCard from "@/components/ChartCard";
import LocationSearch from "@/components/LocationSearch";
import {
  getForecast,
  getNormals,
  getCurrentLocationSafe,
  type ForecastResult,
  type NormalsResult,
} from "@/lib/api";
import { useEffect, useState } from "react";

type ClientPageProps = {
  initialSearchParams: Record<string, string>;
};

export default function ClientPage({ initialSearchParams }: ClientPageProps) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [normals, setNormals] = useState<NormalsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Derive location: query params -> geo -> fallback to Vadodara
        let lat = Number(initialSearchParams.lat);
        let lon = Number(initialSearchParams.lon);
        let locName = initialSearchParams.loc;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          try {
            const geo = await getCurrentLocationSafe();
            if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lon)) {
              lat = geo.lat;
              lon = geo.lon;
              if (!locName && geo.city) {
                locName = geo.city;
              }
            }
          } catch (geoError) {
            console.warn("Geolocation failed:", geoError);
          }
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          lat = 22.3072; // Vadodara fallback
          lon = 73.1812;
          if (!locName) locName = "Vadodara";
        }

        setLocationName(locName);

        const today = new Date();
        const doy = dayOfYear(today);

        const [forecastData, normalsData] = await Promise.all([
          getForecast(lat, lon),
          getNormals(lat, lon, doy),
        ]);

        setForecast(forecastData);
        setNormals(normalsData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load weather data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [initialSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center gap-8">
        {/* Header skeleton */}
        <header className="w-full max-w-3xl flex items-center justify-between">
          <h1 className="text-xl font-semibold">Was today weird?</h1>
          <div className="flex items-center gap-2">
            <div className="w-32 h-5 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
          </div>
        </header>

        {/* LocationSearch skeleton */}
        <div className="flex items-center gap-2 w-full max-w-3xl">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-zinc-700 rounded-md animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 dark:bg-zinc-700 rounded-md animate-pulse"></div>
        </div>

        {/* Main content skeleton */}
        <main className="w-full max-w-3xl flex flex-col gap-6">
          <section className="rounded-2xl border border-black/10 dark:border-white/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="w-32 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-40 h-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-64 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-36 h-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-56 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            </div>
            <div className="md:col-span-2 w-48 h-3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          </section>
        </main>

        {/* Chart skeletons */}
        <div className="w-full max-w-3xl rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="w-32 h-6 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mb-2"></div>
          <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mb-4"></div>
          <div className="w-full h-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
        </div>

        <div className="w-full max-w-3xl rounded-2xl border border-black/10 dark:border-white/10 p-6">
          <div className="w-28 h-6 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mb-2"></div>
          <div className="w-40 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mb-4"></div>
          <div className="w-full h-48 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
        </div>

        <footer className="text-xs text-gray-500">
          Data from Open‑Meteo. Normals 1991 to 2020.
        </footer>
      </div>
    );
  }

  if (error || !forecast || !normals) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center gap-8">
        {/* Header */}
        <header className="w-full max-w-3xl flex items-center justify-between">
          <h1 className="text-xl font-semibold">Was today weird?</h1>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">⚠️ Error</div>
          </div>
        </header>

        {/* Error state */}
        <div className="w-full max-w-md flex flex-col items-center justify-center gap-6 mt-20">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="text-2xl">🌧️</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Weather data unavailable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {error || "Failed to load weather data"}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            🔄 Try again
          </button>
        </div>
      </div>
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
    <div className="min-h-screen p-6 flex flex-col items-center gap-8">
      <header className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-xl font-semibold">Was today weird?</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {forecast.day} • {forecast.tz}
          </div>
          {locationName && (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200">
              {locationName}
            </span>
          )}
        </div>
      </header>
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
              label:
                i - 3 === 0 ? "Today" : i - 3 < 0 ? `${i - 3}` : `+${i - 3}`,
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
                  (x) => x.doy === wrapDayOfYear(doy2),
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
    </div>
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
