import React from "react";

export default function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="w-full max-w-3xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</h3>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

