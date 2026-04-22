import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { deriveInterestTiers } from "@/lib/userInterestProfiler";

type SettingsState = {
  cookieAutoAccept: boolean;
  gpsPrecision: boolean;
  setCookieAutoAccept: (v: boolean) => void;
  setGpsPrecision: (v: boolean) => void;
  /** Coarse coords once GPS consent given. Null otherwise. */
  coords: { lat: number; lng: number } | null;
  /** Top tier IDs derived from device signals once both toggles are ON. */
  topInterestTiers: number[];
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const KEY_COOKIE = "rr.cookieAutoAccept";
const KEY_GPS = "rr.gpsPrecision";

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
  const [topInterestTiers, setTopInterestTiers] = useState<number[]>([]);

  useEffect(() => { localStorage.setItem(KEY_COOKIE, cookieAutoAccept ? "1" : "0"); }, [cookieAutoAccept]);
  useEffect(() => { localStorage.setItem(KEY_GPS, gpsPrecision ? "1" : "0"); }, [gpsPrecision]);

  // GPS consent → request the real position once.
  useEffect(() => {
    if (!gpsPrecision) { setCoords(null); return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied — leave coords null */ },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 }
    );
  }, [gpsPrecision]);

  // Cookie + GPS consent → derive interest tiers from available signals.
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
