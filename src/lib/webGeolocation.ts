export type Coords = { lat: number; lng: number; accuracy?: number; source?: "gps" | "ip" };

export type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unsupported";

/**
 * Read the current browser geolocation permission state without prompting.
 */
export async function readGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!navigator.geolocation) return "unsupported";
  // deno-lint-ignore no-explicit-any
  const perms = (navigator as any).permissions;
  if (!perms?.query) return "prompt";
  try {
    const status = await perms.query({ name: "geolocation" as PermissionName });
    return (status.state as GeolocationPermissionState) ?? "prompt";
  } catch {
    return "prompt";
  }
}

/**
 * Standard W3C Geolocation request. Coarse accuracy, 10s timeout, allows
 * the platform to return a recent cached fix.
 */
export function requestWebGeolocation(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
        source: "gps",
      }),
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  });
}

/**
 * IP-based fallback (no key, no auth). Used when the browser permission is
 * denied/unavailable. Accuracy is city-level (~5–25 km).
 */
export async function requestIpGeolocation(): Promise<Coords | null> {
  try {
    const r = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const lat = Number(j?.latitude);
    const lng = Number(j?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, accuracy: 25_000, source: "ip" };
  } catch {
    return null;
  }
}
