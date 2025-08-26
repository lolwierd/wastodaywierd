export const metadata = {
  title: "How it works – Was today weird?",
  description:
    "Methodology for temperature and wind anomalies vs 1991–2020 normals using Open‑Meteo and ERA5.",
};

import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-6">
      <header className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold">How it works</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          A quick overview of data sources and calculations.
        </p>
      </header>

      <main className="w-full max-w-3xl flex flex-col gap-6 text-sm leading-6 text-gray-800 dark:text-gray-200">
        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold mb-2">What you see</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Temperature anomaly:</span> today’s mean
              temperature compared to the local normal for this time of year.
            </li>
            <li>
              <span className="font-medium">Wind anomaly:</span> today’s daily maximum
              10 m wind speed compared to the local normal.
            </li>
            <li>
              Percentiles (pX) and z-scores (z) are relative to the
              sample used to define the normal (see below).
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold mb-2">Data sources</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Forecast:</span> Open‑Meteo forecast API
              provides hourly temperature (2 m), 10 m wind speed, and weather
              codes, plus daily aggregates.
            </li>
            <li>
              <span className="font-medium">Normals (1991–2020):</span> computed from the
              Open‑Meteo ERA5 archive API for your location.
            </li>
            <li>
              <span className="font-medium">Location:</span> a coarse IP-based lookup (ipapi)
              on first load; you can search to change it.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-2">
          <h2 className="text-base font-semibold">Calculations</h2>
          <p>
            For a given latitude/longitude and today’s date, we compute anomalies
            against a local climatological normal derived from 1991–2020.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Today’s mean temperature:</span> the average of
              all hourly 2 m temperatures for the calendar day in your local
              timezone.
            </li>
            <li>
              <span className="font-medium">Today’s max wind:</span> the daily maximum of 10 m
              wind speed from the forecast.
            </li>
            <li>
              <span className="font-medium">Normal window:</span> values from 1991–2020 within
              ±7 days of today’s day‑of‑year (inclusive). This gives a
              seasonally appropriate sample for smoothing.
            </li>
            <li>
              <span className="font-medium">Normal mean and spread:</span> the mean and
              standard deviation (if sample has ≥2 values) of that window.
            </li>
            <li>
              <span className="font-medium">Anomaly:</span> actual − normal mean.
            </li>
            <li>
              <span className="font-medium">Percentile:</span> where today’s value falls within
              the window sample (0–100), using linear interpolation between
              ranks.
            </li>
            <li>
              <span className="font-medium">Z‑score:</span> anomaly divided by the sample’s
              standard deviation (shown when available).
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Units: temperature in °C, wind speed in m/s. Timezone is set to the
            location’s local timezone by the APIs.
          </p>
        </section>

        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-2">
          <h2 className="text-base font-semibold">Charts</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Normals this week:</span> 7‑day window centered on
              today (mean ± std bands) for temperature and wind.
            </li>
            <li>
              <span className="font-medium">Next 7 days:</span> forecasted daily mean
              temperature anomalies versus the corresponding day‑of‑year normals
              (using the same seasonal smoothing).
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <h2 className="text-base font-semibold mb-2">Notes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Wind normals can be missing in some areas; if so, they’re hidden.</li>
            <li>
              IP geolocation is approximate; use the search box to refine your
              location.
            </li>
            <li>
              ERA5 is a reanalysis product and may differ from station records
              at micro‑scales.
            </li>
          </ul>
        </section>

        <div className="text-sm">
          <Link href="/" className="underline hover:no-underline">← Back to homepage</Link>
        </div>
      </main>

      <footer className="text-xs text-gray-500">
        Data from Open‑Meteo (forecast and ERA5 archive). Normals 1991–2020.
      </footer>
    </div>
  );
}
