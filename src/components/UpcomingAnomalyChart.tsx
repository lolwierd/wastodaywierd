"use client";
import { Bar, BarChart, CartesianGrid, Line, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { MinimalTooltipContent } from "@/components/ChartTooltip";

type Item = { day: string; anomaly: number; normal: number; actual?: number };

type TTPayload = { value?: number; color?: string; name?: string; dataKey?: string | number };
type TTProps = { active?: boolean; payload?: TTPayload[]; label?: string | number };

export default function UpcomingAnomalyChart({ data }: { data: Item[] }) {
  if (!data?.length) return null;
  const stroke = "#111827";
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} tickMargin={6} />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <Tooltip
            isAnimationActive={false}
            cursor={false}
            content={(props: TTProps) => (
              <MinimalTooltipContent
                active={props.active}
                payload={props.payload}
                label={typeof props.label === "number" ? String(props.label) : props.label}
                map={(items) => [
                  { name: "Δ Temp", value: (items.find(i => i.dataKey === "anomaly")?.value as number) ?? "–", unit: "°C", color: "#2563eb" },
                  { name: "Normal", value: (items.find(i => i.dataKey === "normal")?.value as number) ?? "–", unit: "°C", color: stroke },
                ]}
              />
            )}
          />
          <Bar dataKey="anomaly" name="Δ Temp" fill="#2563eb" radius={[5, 5, 0, 0]} isAnimationActive={false} />
          <Line type="monotone" dataKey="normal" name="Normal" stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
