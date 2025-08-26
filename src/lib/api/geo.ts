export type GeoResult = {
  lat: number;
  lon: number;
  city?: string;
  region?: string;
  country?: string;
  source: string;
};

export type GeoError = {
  error: string;
};

export async function getCurrentLocation(): Promise<GeoResult> {
  // Resolve via our server-side endpoint so proxies (e.g., Cloudflare)
  // can provide the correct client IP via headers.
  const res = await fetch("/api/geo", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("geo unavailable");
  }
  const data = await res.json();
  const lat = Number(data.lat);
  const lon = Number(data.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("geo unavailable");
  }
  return {
    lat,
    lon,
    city: data.city || undefined,
    region: data.region || undefined,
    country: data.country || undefined,
    source: data.source || "api/geo",
  };
}

// Get location via browser geolocation (user-initiated only)
export async function getBrowserLocation(): Promise<GeoResult> {
  if (!navigator.geolocation) {
    throw new Error("Browser geolocation not supported");
  }

  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        });
      },
    );

    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      source: "browser",
    };
  } catch (_geoError) {
    throw new Error("Browser geolocation failed");
  }
}

// Alternative method that doesn't throw, returns null instead
export async function getCurrentLocationSafe(): Promise<GeoResult | null> {
  try {
    return await getCurrentLocation();
  } catch {
    return null;
  }
}
