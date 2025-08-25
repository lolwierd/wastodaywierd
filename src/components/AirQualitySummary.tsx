import { AirQuality } from "@/lib/types";

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function fmt(n: unknown): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "–";
}

export default function AirQualitySummary({ data }: { data: AirQuality }) {
  const aqi = data.us_aqi;
  const details = [
    typeof data.pm2_5 === "number" ? `PM2.5 ${fmt(data.pm2_5)}` : null,
    typeof data.pm10 === "number" ? `PM10 ${fmt(data.pm10)}` : null,
    typeof data.ozone === "number" ? `O₃ ${fmt(data.ozone)}` : null,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-black/10 dark:border-white/10 p-4 flex flex-col gap-2">
      <div className="text-sm text-gray-600">Air quality</div>
      {typeof aqi === "number" && Number.isFinite(aqi) ? (
        <div className="text-xl font-semibold">
          AQI {aqi.toFixed(0)} • {aqiLabel(aqi)}
        </div>
      ) : (
        <div className="text-xl font-semibold">Air quality data unavailable</div>
      )}
      {details.length > 0 && (
        <div className="text-sm text-gray-600">{details.join(" • ")} µg/m³</div>
      )}
    </section>
  );
}

