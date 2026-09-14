import { supabase } from "@/integrations/supabase/client";

export type Coords = { lat: number; lng: number; accuracy?: number };

export type DeviceProfile = {
  userAgent: string;
  platform: string;
  language: string;
  screen: { w: number; h: number; dpr: number };
  timezone: string;
  cores: number;
  memoryGB?: number;
  network?: string;
  touch: boolean;
};

export function snapshotDeviceProfile(): DeviceProfile {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
    maxTouchPoints?: number;
  };
  return {
    userAgent: nav.userAgent,
    platform: nav.platform || "unknown",
    language: nav.language,
    screen: { w: window.screen.width, h: window.screen.height, dpr: window.devicePixelRatio },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: nav.hardwareConcurrency || 0,
    memoryGB: nav.deviceMemory,
    network: nav.connection?.effectiveType,
    touch: (nav.maxTouchPoints ?? 0) > 0,
  };
}

/**
 * Request geolocation. Uses the browser's navigator.geolocation API.
 * Returns `null` if the user denies or the API is not available.
 */
export async function requestGeolocation(): Promise<Coords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  });
}

/**
 * Persist non-PII telemetry for the current user. Safe to call even when
 * coords are null — only the device profile will be recorded.
 */
export async function persistTelemetry(userId: string, coords: Coords | null, profile: DeviceProfile) {
  await supabase.from("device_telemetry").upsert(
    [
      {
        user_id: userId,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        accuracy_m: coords?.accuracy ?? null,
        profile: profile as never,
      },
    ],
    { onConflict: "user_id" }
  );
}
