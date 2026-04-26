import { isNative } from "@/lib/operaWebView";

export type Coords = { lat: number; lng: number; accuracy?: number };

export type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unsupported";

/**
 * Read the current browser geolocation permission state without prompting.
 * Returns "unsupported" on browsers (Safari < 16) that don't expose the
 * Permissions API for geolocation.
 */
export async function readGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!navigator.geolocation) return "unsupported";
  // Permissions API isn't universal — when missing, assume "prompt".
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
 * Request the user's current position. On Capacitor (native) this triggers
 * the OS permission prompt; on the web it triggers the browser prompt.
 * Returns `null` if denied or unavailable.
 */
export async function requestWebGeolocation(): Promise<Coords | null> {
  if (isNative()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.requestPermissions({ permissions: ["location"] });
      if (perm.location !== "granted") return null;
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10_000,
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch {
      return null;
    }
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  });
}
