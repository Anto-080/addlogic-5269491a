import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { deriveInterestTiers, recordSearch } from "@/lib/userInterestProfiler";
import { MOCK_EARNINGS } from "@/lib/mockData";

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

/**
 * Cookie banner auto-accepter — heavily throttled so it never blocks
 * pointer/touch events on the Dashboard toggles.
 */
function installCookieAutoAccepter(): () => void {
  const ACCEPT_PATTERNS = [
    /^accept all/i, /^accept$/i, /^allow all/i, /^agree$/i, /^i agree/i,
    /^got it/i, /^ok$/i, /^consenti tutti/i, /^accetta tutti/i,
    /^tout accepter/i, /^alle akzeptieren/i, /^aceptar todo/i,
  ];
  const COOKIE_KEYWORDS = /(cookie|consent|gdpr|privacy)/i;

  const tryAccept = () => {
    const candidates = document.querySelectorAll<HTMLElement>(
      'button, a[role="button"], input[type="button"], [data-accept]'
    );
    for (const el of Array.from(candidates)) {
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
      if (!text || text.length > 40) continue;
      if (!ACCEPT_PATTERNS.some((re) => re.test(text))) continue;
      let host: HTMLElement | null = el;
      let scoped = false;
      for (let i = 0; i < 6 && host; i++) {
        const id = (host.id || "") + " " + (host.className || "");
        if (COOKIE_KEYWORDS.test(id)) { scoped = true; break; }
        host = host.parentElement;
      }
      if (!scoped) continue;
      try { el.click(); return; } catch { /* ignore */ }
    }
  };

  tryAccept();
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const run = () => { scheduled = false; try { tryAccept(); } catch { /* ignore */ } };
    if (ric) ric(run, { timeout: 2000 });
    else window.setTimeout(run, 2000);
  };
  const obs = new MutationObserver(schedule);
  obs.observe(document.body, { childList: true, subtree: true });

  try { localStorage.setItem("rr.cookiesAccepted", "1"); } catch { /* ignore */ }
  return () => obs.disconnect();
}

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

  // Cookie consent → install auto-accepter.
  useEffect(() => {
    if (!cookieAutoAccept) return;
    const dispose = installCookieAutoAccepter();
    if (document.referrer) recordSearch(document.referrer);
    return () => dispose();
  }, [cookieAutoAccept]);

  // GPS consent → real position + device-profile snapshot.
  useEffect(() => {
    if (!gpsPrecision) {
      setCoords(null);
      setDeviceProfile(null);
      return;
    }
    setDeviceProfile(snapshotDeviceProfile());
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied */ },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 }
    );
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

/* =========================================================================
 * Experience / Multiplier — STAND-ALONE module (NOT in React state)
 *
 * The earlier implementation pushed XP into context and ticked it every
 * second, which re-rendered every consumer (toggles included) and made the
 * Dashboard lag like Parkinson. Now XP/level/multiplier are stored in a
 * plain module-level object backed by localStorage, and only the
 * <ExperienceBar /> subscribes to ticks. Toggles never re-render from XP.
 * ========================================================================= */

const XP_KEY = "rr.xp.state.v2";

type XpState = {
  xp: number;          // 0..XP_PER_LEVEL
  level: number;
  multiplier: number;  // current crimson multiplier (tier + bonuses)
  updatedAt: number;
};

function loadXp(): XpState {
  try {
    const raw = localStorage.getItem(XP_KEY);
    if (raw) return JSON.parse(raw) as XpState;
  } catch { /* ignore */ }
  return {
    xp: Math.round((MOCK_EARNINGS.xp / MOCK_EARNINGS.xpToNext) * XP_PER_LEVEL),
    level: MOCK_EARNINGS.level,
    multiplier: MOCK_EARNINGS.currentMultiplier,
    updatedAt: Date.now(),
  };
}

let xpState: XpState = typeof window !== "undefined" ? loadXp() : {
  xp: 0, level: MOCK_EARNINGS.level, multiplier: MOCK_EARNINGS.currentMultiplier, updatedAt: Date.now(),
};

function persistXp() {
  try { localStorage.setItem(XP_KEY, JSON.stringify(xpState)); } catch { /* ignore */ }
}

export function getXpSnapshot(): XpState {
  return xpState;
}

export function setMultiplier(mult: number) {
  xpState = { ...xpState, multiplier: mult, updatedAt: Date.now() };
  persistXp();
}

/** Add XP for `seconds` of activity at the current multiplier. */
export function addXpForSeconds(seconds: number) {
  if (seconds <= 0) return;
  let xp = xpState.xp + Math.round(seconds * xpState.multiplier);
  let level = xpState.level;
  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL;
    level += 1;
  }
  xpState = { ...xpState, xp, level, updatedAt: Date.now() };
  persistXp();
}

export function consentBonus(cookies: boolean, gps: boolean): number {
  return (cookies ? COOKIE_BONUS : 0) + (gps ? GPS_BONUS : 0);
}
