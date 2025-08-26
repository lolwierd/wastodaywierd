import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">How it works</h1>
      <p>
        Was today weird compares today’s temperature and wind with the
        1991–2020 climate normals for your location. It uses Open‑Meteo
        forecast and reanalysis data to calculate anomalies, percentiles,
        and z‑scores.
      </p>
      <p>
        For each day, the app fetches normal values for the same day of the
        year and contrasts them with the latest observation or forecast to
        show how unusual the conditions are.
      </p>
      <p>
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

