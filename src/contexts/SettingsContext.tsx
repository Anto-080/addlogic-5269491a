import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { deriveInterestTiers, recordSearch } from "@/lib/userInterestProfiler";

export const XP_PER_LEVEL = 1_000_000;
export const COOKIE_BONUS = 2;
export const GPS_BONUS = 5;

type DeviceProfile = {
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

type SettingsState = {
  cookieAutoAccept: boolean;
  gpsPrecision: boolean;
  setCookieAutoAccept: (v: boolean) => void;
  setGpsPrecision: (v: boolean) => void;
  coords: { lat: number; lng: number } | null;
  deviceProfile: DeviceProfile | null;
  topInterestTiers: number[];
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const KEY_COOKIE = "rr.cookieAutoAccept";
const KEY_GPS = "rr.gpsPrecision";

function snapshotDeviceProfile(): DeviceProfile {
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [cookieAutoAccept, setCookieAutoAccept] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_COOKIE) === "1";
  });
  const [gpsPrecision, setGpsPrecision] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_GPS) === "1";
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [topInterestTiers, setTopInterestTiers] = useState<number[]>([]);

  useEffect(() => { localStorage.setItem(KEY_COOKIE, cookieAutoAccept ? "1" : "0"); }, [cookieAutoAccept]);
  useEffect(() => { localStorage.setItem(KEY_GPS, gpsPrecision ? "1" : "0"); }, [gpsPrecision]);

  useEffect(() => {
    if (!cookieAutoAccept) return;
    try { localStorage.setItem("rr.cookiesAccepted", "1"); } catch { /* ignore */ }
    if (document.referrer) recordSearch(document.referrer);
  }, [cookieAutoAccept]);

  // Snapshot device profile ONCE per GPS-on transition. Avoids the previous
  // re-render storm where toggling either switch caused
  // ExperienceBar -> user_stats -> Dashboard re-render -> resnapshot loop.
  useEffect(() => {
    if (!gpsPrecision) {
      setCoords(null);
      setDeviceProfile(null);
      return;
    }
    if (deviceProfile) return;
    setDeviceProfile(snapshotDeviceProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsPrecision]);

  useEffect(() => {
    let cancelled = false;
    deriveInterestTiers({ cookies: cookieAutoAccept, gps: gpsPrecision }).then((ids) => {
      if (!cancelled) setTopInterestTiers(ids);
    });
    return () => { cancelled = true; };
  }, [cookieAutoAccept, gpsPrecision]);

  return (
    <SettingsContext.Provider
      value={{
        cookieAutoAccept,
        gpsPrecision,
        setCookieAutoAccept,
        setGpsPrecision,
        coords,
        deviceProfile,
        topInterestTiers,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export function consentBonus(cookies: boolean, gps: boolean): number {
  return (cookies ? COOKIE_BONUS : 0) + (gps ? GPS_BONUS : 0);
}
