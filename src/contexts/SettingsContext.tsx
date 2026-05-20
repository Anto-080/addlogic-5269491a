import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deriveInterestTiers, recordSearch } from "@/lib/userInterestProfiler";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  cookieRemember: boolean;
  gpsRemember: boolean;
  setCookieRemember: (v: boolean) => void;
  setGpsRemember: (v: boolean) => void;
  /** Final hard-lock button. When on, the main + mini toggles are frozen in the active state. */
  cookieLocked: boolean;
  gpsLocked: boolean;
  setCookieLocked: (v: boolean) => void;
  setGpsLocked: (v: boolean) => void;
  coords: { lat: number; lng: number } | null;
  deviceProfile: DeviceProfile | null;
  topInterestTiers: number[];
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const KEY_COOKIE_REMEMBER = "rr.cookieRemember";
const KEY_GPS_REMEMBER = "rr.gpsRemember";
const KEY_COOKIE_LOCK = "rr.cookieLocked";
const KEY_GPS_LOCK = "rr.gpsLocked";
const KEY_COOKIE_REMEMBERED = "rr.cookieAutoAccept.remembered";
const KEY_GPS_REMEMBERED = "rr.gpsPrecision.remembered";

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
  const { user } = useAuth();
  const qc = useQueryClient();

  const [cookieRemember, setCookieRememberState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_COOKIE_REMEMBER) === "1";
  });
  const [gpsRemember, setGpsRememberState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_GPS_REMEMBER) === "1";
  });

  // Final hard-lock flags.
  const [cookieLocked, setCookieLockedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_COOKIE_LOCK) === "1";
  });
  const [gpsLocked, setGpsLockedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_GPS_LOCK) === "1";
  });

  // Permission choices — only restored across sessions if the lock is on.
  const [cookieAutoAccept, setCookieAutoAcceptState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(KEY_COOKIE_REMEMBER) === "1" && localStorage.getItem(KEY_COOKIE_LOCK) === "1") {
      return localStorage.getItem(KEY_COOKIE_REMEMBERED) === "1";
    }
    return false;
  });
  const [gpsPrecision, setGpsPrecisionState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(KEY_GPS_REMEMBER) === "1" && localStorage.getItem(KEY_GPS_LOCK) === "1") {
      return localStorage.getItem(KEY_GPS_REMEMBERED) === "1";
    }
    return false;
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [topInterestTiers, setTopInterestTiers] = useState<number[]>([]);

  useEffect(() => { localStorage.setItem(KEY_COOKIE_REMEMBER, cookieRemember ? "1" : "0"); }, [cookieRemember]);
  useEffect(() => { localStorage.setItem(KEY_GPS_REMEMBER, gpsRemember ? "1" : "0"); }, [gpsRemember]);
  // Persist lock flags.
  useEffect(() => { localStorage.setItem(KEY_COOKIE_LOCK, cookieLocked ? "1" : "0"); }, [cookieLocked]);
  useEffect(() => { localStorage.setItem(KEY_GPS_LOCK, gpsLocked ? "1" : "0"); }, [gpsLocked]);

  // Persist the remembered value while the mini reminder toggle is on.
  useEffect(() => {
    if (cookieRemember) localStorage.setItem(KEY_COOKIE_REMEMBERED, cookieAutoAccept ? "1" : "0");
    else localStorage.removeItem(KEY_COOKIE_REMEMBERED);
  }, [cookieAutoAccept, cookieRemember]);
  useEffect(() => {
    if (gpsRemember) localStorage.setItem(KEY_GPS_REMEMBERED, gpsPrecision ? "1" : "0");
    else localStorage.removeItem(KEY_GPS_REMEMBERED);
  }, [gpsPrecision, gpsRemember]);

  // Mirror to profiles.preferences so the server-side multiplier sees them.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .update({
        preferences: {
          cookies: cookieAutoAccept,
          gps: gpsPrecision,
          cookies_remember: cookieRemember,
          gps_remember: gpsRemember,
          cookies_locked: cookieLocked,
          gps_locked: gpsLocked,
        },
      } as never)
      .eq("user_id", user.id)
      .then(() => undefined);
  }, [user, cookieAutoAccept, gpsPrecision, cookieRemember, gpsRemember, cookieLocked, gpsLocked]);

  useEffect(() => {
    if (!user) return;
    const syncLockedMultiplier = async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("locked_query, locked_until")
        .eq("user_id", user.id)
        .maybeSingle();
      const lockedUntil = data?.locked_until ? new Date(data.locked_until).getTime() : 0;
      if (!data?.locked_query || lockedUntil <= Date.now()) return;
      await supabase.functions.invoke("classify-interest", {
        body: { text: data.locked_query },
      });
      qc.invalidateQueries({ queryKey: ["user_stats", user.id] });
    };
    syncLockedMultiplier().catch(() => undefined);
  }, [user, qc, cookieAutoAccept, gpsPrecision]);

  useEffect(() => {
    if (!cookieAutoAccept) return;
    try { localStorage.setItem("rr.cookiesAccepted", "1"); } catch { /* ignore */ }
    if (document.referrer) recordSearch(document.referrer);
  }, [cookieAutoAccept]);

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

  const setCookieAutoAccept = useCallback((v: boolean) => setCookieAutoAcceptState(v), []);
  const setGpsPrecision = useCallback((v: boolean) => setGpsPrecisionState(v), []);
  const setCookieRemember = useCallback((v: boolean) => setCookieRememberState(v), []);
  const setGpsRemember = useCallback((v: boolean) => setGpsRememberState(v), []);
  const setCookieLocked = useCallback((v: boolean) => setCookieLockedState(v), []);
  const setGpsLocked = useCallback((v: boolean) => setGpsLockedState(v), []);

  return (
    <SettingsContext.Provider
      value={{
        cookieAutoAccept,
        gpsPrecision,
        setCookieAutoAccept,
        setGpsPrecision,
        cookieRemember,
        gpsRemember,
        setCookieRemember,
        setGpsRemember,
        cookieLocked,
        gpsLocked,
        setCookieLocked,
        setGpsLocked,
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
