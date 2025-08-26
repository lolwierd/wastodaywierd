import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type GeoResponse = {
  lat: number;
  lon: number;
  city?: string;
  region?: string;
  country?: string;
  source: string;
};

function pickClientIP(req: NextRequest): string | null {
  const h = req.headers;
  // Prefer X-Forwarded-For (first IP)
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  // Cloudflare specific
  const cfc = h.get("cf-connecting-ip");
  if (cfc) return cfc;
  // Generic fallbacks
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

export async function GET(req: NextRequest) {
  // Basic per-IP token bucket rate limit (soft, per edge isolate)
  const ip = pickClientIP(req) || "unknown";
  const { ok, retryAfter, remaining, limit } = rateLimit(ip, 20, 60_000);
  const commonHeaders: HeadersInit = {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
  };

  if (!ok) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { ...commonHeaders, "Retry-After": String(retryAfter) },
    });
  }

  try {
    const base = "https://ipapi.co";
    const url = ip ? `${base}/${encodeURIComponent(ip)}/json/` : `${base}/json/`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Avoid cache for user-specific IP lookups
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `ipapi error ${res.status}` }), {
        status: 502,
        headers: commonHeaders,
      });
    }

    const data = await res.json();
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return new Response(JSON.stringify({ error: "geo unavailable" }), {
        status: 500,
        headers: commonHeaders,
      });
    }

    const body: GeoResponse = {
      lat,
      lon,
      city: data.city || undefined,
      region: data.region || undefined,
      country: data.country_name || undefined,
      source: "ipapi+headers",
    };
    return new Response(JSON.stringify(body), { status: 200, headers: commonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "geo failed" }), {
      status: 500,
      headers: commonHeaders,
    });
  }
}

// In-memory token bucket (per edge isolate). Good as a soft limit; pair with
// Cloudflare rate limiting rules for stronger guarantees across POPs.
type Bucket = { tokens: number; updatedAt: number };
const buckets: Map<string, Bucket> = new Map();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const refillRate = limit / windowMs; // tokens per ms
  const b = buckets.get(key) || { tokens: limit, updatedAt: now };
  const elapsed = Math.max(0, now - b.updatedAt);
  b.tokens = Math.min(limit, b.tokens + elapsed * refillRate);
  b.updatedAt = now;
  let ok = false;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    ok = true;
  }
  buckets.set(key, b);
  const remaining = Math.floor(b.tokens);
  const retryAfter = ok ? 0 : Math.ceil((1 - b.tokens) / refillRate / 1000);
  return { ok, remaining, limit, retryAfter };
}
