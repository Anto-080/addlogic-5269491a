import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { deriveInterestTiers, recordSearch } from "@/lib/userInterestProfiler";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const XP_PER_LEVEL = 1_000_000;
export const COOKIE_BONUS = 1.5;
export const ANALYTICS_BONUS = 2;
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
  analyticsConsent: boolean;
  setCookieAutoAccept: (v: boolean) => void;
  setGpsPrecision: (v: boolean) => void;
  setAnalyticsConsent: (v: boolean) => void;
  /** Lock = remember this choice for future sessions (cookies & analytics only).
   *  GPS is intentionally session-only: location must be requested each visit. */
  cookieLocked: boolean;
  analyticsLocked: boolean;
  setCookieLocked: (v: boolean) => void;
  setAnalyticsLocked: (v: boolean) => void;
  coords: { lat: number; lng: number } | null;
  deviceProfile: DeviceProfile | null;
  topInterestTiers: number[];
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const KEY_COOKIE_LOCK = "rr.cookieLocked";
const KEY_ANALYTICS_LOCK = "rr.analyticsLocked";
const KEY_COOKIE_REMEMBERED = "rr.cookieAutoAccept.remembered";
const KEY_ANALYTICS_REMEMBERED = "rr.analyticsConsent.remembered";

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

  const [cookieLocked, setCookieLockedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_COOKIE_LOCK) === "1";
  });
  const [analyticsLocked, setAnalyticsLockedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_ANALYTICS_LOCK) === "1";
  });

  const [cookieAutoAccept, setCookieAutoAcceptState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(KEY_COOKIE_LOCK) === "1") {
      return localStorage.getItem(KEY_COOKIE_REMEMBERED) === "1";
    }
    return false;
  });
  const [gpsPrecision, setGpsPrecisionState] = useState<boolean>(false);
  const [analyticsConsent, setAnalyticsConsentState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(KEY_ANALYTICS_LOCK) === "1") {
      return localStorage.getItem(KEY_ANALYTICS_REMEMBERED) === "1";
    }
    return false;
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [topInterestTiers, setTopInterestTiers] = useState<number[]>([]);

  useEffect(() => { localStorage.setItem(KEY_COOKIE_LOCK, cookieLocked ? "1" : "0"); }, [cookieLocked]);
  useEffect(() => { localStorage.setItem(KEY_ANALYTICS_LOCK, analyticsLocked ? "1" : "0"); }, [analyticsLocked]);

  useEffect(() => {
    if (cookieLocked) localStorage.setItem(KEY_COOKIE_REMEMBERED, cookieAutoAccept ? "1" : "0");
    else localStorage.removeItem(KEY_COOKIE_REMEMBERED);
  }, [cookieAutoAccept, cookieLocked]);
  useEffect(() => {
    if (analyticsLocked) localStorage.setItem(KEY_ANALYTICS_REMEMBERED, analyticsConsent ? "1" : "0");
    else localStorage.removeItem(KEY_ANALYTICS_REMEMBERED);
  }, [analyticsConsent, analyticsLocked]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .update({
        preferences: {
          cookies: cookieAutoAccept,
          gps: gpsPrecision,
          analytics: analyticsConsent,
          cookies_locked: cookieLocked,
          analytics_locked: analyticsLocked,
        },
      } as never)
      .eq("user_id", user.id)
      .then(() => undefined);
  }, [user, cookieAutoAccept, gpsPrecision, analyticsConsent, cookieLocked, analyticsLocked]);

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
  const setAnalyticsConsent = useCallback((v: boolean) => setAnalyticsConsentState(v), []);
  const setCookieLocked = useCallback((v: boolean) => setCookieLockedState(v), []);
  const setAnalyticsLocked = useCallback((v: boolean) => setAnalyticsLockedState(v), []);

  return (
    <SettingsContext.Provider
      value={{
        cookieAutoAccept,
        gpsPrecision,
        analyticsConsent,
        setCookieAutoAccept,
        setGpsPrecision,
        setAnalyticsConsent,
        cookieLocked,
        analyticsLocked,
        setCookieLocked,
        setAnalyticsLocked,
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

export function consentBonus(cookies: boolean, analytics: boolean, gps: boolean): number {
  return (cookies ? COOKIE_BONUS : 0) + (analytics ? ANALYTICS_BONUS : 0) + (gps ? GPS_BONUS : 0);
}
