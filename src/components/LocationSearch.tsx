"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Result = { name: string; lat: number; lon: number };

export default function LocationSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);


  const debounce = <T extends unknown[]>(fn: (...args: T) => void, ms: number) => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return (...args: T) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const search = useMemo(
    () =>
      debounce(async (term: string) => {
        if (!term || term.length < 2) {
          setResults([]);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`);
          const data = (await res.json()) as { results: Result[] };
          setResults(data.results || []);
        } finally {
          setLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    search(q);
  }, [q, search]);

  const applyLocation = useCallback(
    (lat: number, lon: number, name?: string) => {
      const params = new URLSearchParams(sp.toString());
      params.set("lat", String(lat));
      params.set("lon", String(lon));
      if (name) params.set("loc", name);
      else params.delete("loc");
      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [router, pathname, sp]
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let name: string | undefined;
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = (await res.json()) as { name?: string };
          name = data.name;
        } catch (err) {
          console.error("Reverse geocode failed", err);
        }
        applyLocation(pos.coords.latitude, pos.coords.longitude, name);
      },
      (err) => {
        console.error("Geolocation error", err);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [applyLocation]);

  return (
    <div className="flex items-center gap-2 w-full max-w-3xl">
      <div className="relative flex-1">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder="Search city"
          className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/50 backdrop-blur text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        {open && (results.length > 0 || loading) && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 shadow-sm max-h-64 overflow-auto">
            {loading && <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>}
            {results.map((r, i) => (
              <button
                key={`${r.lat},${r.lon}-${i}`}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                onClick={() => applyLocation(r.lat, r.lon, r.name)}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
        onClick={useMyLocation}
        title="Use my location"
        aria-label="Use my location"
      >
        Use my location
      </button>
    </div>
  );
}
