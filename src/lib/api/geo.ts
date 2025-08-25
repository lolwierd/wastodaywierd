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
  // Get location from IP using a CORS-friendly service
  try {
    // Using ipapi.co which supports CORS
    const res = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);

      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return {
          lat,
          lon,
          city: data.city || undefined,
          region: data.region || undefined,
          country: data.country_name || undefined,
          source: "ipapi",
        };
      }
    }
  } catch (ipError) {
    console.warn("IP geolocation failed:", ipError);
  }

  // If all methods fail, throw an error
  throw new Error("geo unavailable");
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
