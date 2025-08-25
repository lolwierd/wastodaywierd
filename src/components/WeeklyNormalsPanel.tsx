"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MinimalTooltipContent } from "@/components/ChartTooltip";

type NormPoint = {
  label: string;
  temp?: number;
  tStd?: number;
  wind?: number | null;
  wStd?: number;
};

type TTPayload = { value?: number; color?: string; name?: string; dataKey?: string | number };
type TTProps = { active?: boolean; payload?: TTPayload[]; label?: string | number };

function TempChart({ data }: { data: NormPoint[] }) {
  const stroke = "#2563eb"; // blue-600
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="tFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" opacity={0.08} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} tickMargin={6} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} width={40} axisLine={false} tickLine={false} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
            content={(props: TTProps) => (
              <MinimalTooltipContent
                active={props.active}
                payload={props.payload}
                label={typeof props.label === "number" ? String(props.label) : props.label}
                map={(items) => [{ name: "Temp", value: items[0]?.value ?? "–", unit: "°C", color: stroke }]}
              />
            )}
          />
          <Area type="monotone" dataKey="temp" stroke={stroke} strokeWidth={2} fill="url(#tFill)" name="Temp (°C)" activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WindChart({ data }: { data: NormPoint[] }) {
  const stroke = "#059669"; // emerald-600
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86efac" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#86efac" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" opacity={0.08} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} tickMargin={6} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} width={40} axisLine={false} tickLine={false} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
            content={(props: TTProps) => (
              <MinimalTooltipContent
                active={props.active}
                payload={props.payload}
                label={typeof props.label === "number" ? String(props.label) : props.label}
                map={(items) => [{ name: "Wind", value: items[0]?.value ?? "–", unit: "m/s", color: stroke }]}
              />
            )}
          />
          <Area type="monotone" dataKey="wind" stroke={stroke} strokeWidth={2} fill="url(#wFill)" name="Wind (m/s)" activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function WeeklyNormalsPanel({ data }: { data: NormPoint[] }) {
  const tempData = data.map((d) => ({ label: d.label, temp: d.temp, tStd: d.tStd }));
  const windData = data.map((d) => ({ label: d.label, wind: d.wind ?? undefined, wStd: d.wStd }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-xs text-gray-600 mb-1">Temperature (mean)</div>
        <TempChart data={tempData} />
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">Wind (mean)</div>
        <WindChart data={windData} />
      </div>
    </div>
  );
}
