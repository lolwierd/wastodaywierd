"use client";
import React from "react";

type RPayload = { value?: number; color?: string; name?: string; dataKey?: string | number };

export function MinimalTooltipContent({
  active,
  payload,
  label,
  map,
  labelFormat,
}: {
  active?: boolean;
  payload?: RPayload[];
  label?: string;
  map: (items: RPayload[]) => Array<{ name: string; value: number | string; unit?: string; color?: string }>;
  labelFormat?: (label?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = map(payload);
  return (
    <div className="rounded-md border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-900/90 shadow-sm px-2.5 py-2 text-xs backdrop-blur">
      {label && (
        <div className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
          {labelFormat ? labelFormat(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: r.color ?? "#6b7280" }}
              />
              <span>{r.name}</span>
            </div>
            <div className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
              {typeof r.value === "number" ? r.value.toFixed(1) : r.value}
              {r.unit ? ` ${r.unit}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
