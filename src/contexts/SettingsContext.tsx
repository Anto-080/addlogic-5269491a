import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { deriveInterestTiers, recordSearch } from "@/lib/userInterestProfiler";
import { MOCK_EARNINGS } from "@/lib/mockData";

export const XP_PER_LEVEL = 1_000_000;
export const COOKIE_BONUS = 2;
export const GPS_BONUS = 5;
export const TIER_LINGER_MS = 60 * 1000;

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
  /** Coarse coords once GPS consent given. Null otherwise. */
  coords: { lat: number; lng: number } | null;
  /** Device-side profile populated when GPS toggle is ON. */
  deviceProfile: DeviceProfile | null;
  /** Top tier IDs derived from device signals once both toggles are ON. */
  topInterestTiers: number[];
  /** Live XP shared across all pages (0..XP_PER_LEVEL). */
  liveXp: number;
  level: number;
  /** Multiplier from selected research tier (lingers TIER_LINGER_MS after change). */
  tierMultiplier: number;
  /** Total active multiplier including consent bonuses. */
  activeMultiplier: number;
  /** Set the active research tier multiplier (e.g. when user picks a tier in Research). */
  setActiveTierMultiplier: (m: number) => void;
  /** Whether the Research Room is currently engaging XP earning. */
  setResearchActive: (active: boolean) => void;
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const KEY_COOKIE = "rr.cookieAutoAccept";
const KEY_GPS = "rr.gpsPrecision";

/**
 * Cookie banner auto-accepter. Scans the DOM for elements that look like
 * GDPR consent prompts and clicks the highest-affinity "accept all" button.
 * This is what makes the toggle a real functional feature rather than a
 * label: while the user browses inside the in-app Opera WebView (or the
 * web preview), every consent banner gets dismissed automatically.
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
      'button, a[role="button"], input[type="button"], [data-accept], [aria-label]'
    );
    for (const el of Array.from(candidates)) {
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
      if (!text || text.length > 40) continue;
      if (!ACCEPT_PATTERNS.some((re) => re.test(text))) continue;
      // Make sure it's inside a likely cookie/consent container.
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

  // Run once + observe future DOM changes — heavily throttled so the
  // observer never blocks pointer/touch events on the Dashboard toggles.
  tryAccept();
  let scheduled = false;
  let lastRun = 0;
  const SCAN_INTERVAL_MS = 1500;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    const wait = Math.max(0, SCAN_INTERVAL_MS - (Date.now() - lastRun));
    const run = () => {
      scheduled = false;
      lastRun = Date.now();
      try { tryAccept(); } catch { /* ignore */ }
    };
    // requestIdleCallback when available — never compete with input handlers.
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(run, { timeout: wait + 500 });
    else window.setTimeout(run, wait);
  };
  const obs = new MutationObserver(schedule);
  obs.observe(document.body, { childList: true, subtree: true });

  // Also flag any cross-tab listeners that we already accepted.
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
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio,
    },
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

  // Shared XP & multiplier state — drives every Experience Bar in the app.
  const [liveXp, setLiveXp] = useState<number>(() =>
    Math.round((MOCK_EARNINGS.xp / MOCK_EARNINGS.xpToNext) * XP_PER_LEVEL)
  );
  const [level, setLevel] = useState<number>(MOCK_EARNINGS.level);
  const [tierMultiplier, setTierMultiplier] = useState<number>(MOCK_EARNINGS.currentMultiplier);
  const tierLingerUntilRef = useRef<number>(0);
  const researchActiveRef = useRef<boolean>(false);
  const lastInteractionRef = useRef<number>(Date.now());

  const consentBonus = (cookieAutoAccept ? COOKIE_BONUS : 0) + (gpsPrecision ? GPS_BONUS : 0);
  // After tier change, the previous multiplier lingers for 1 minute.
  const effectiveTierMultiplier = tierMultiplier;
  const activeMultiplier = effectiveTierMultiplier + consentBonus;

  const setActiveTierMultiplier = (m: number) => {
    setTierMultiplier(m);
    tierLingerUntilRef.current = Date.now() + TIER_LINGER_MS;
  };
  const setResearchActive = (active: boolean) => {
    researchActiveRef.current = active;
    lastInteractionRef.current = Date.now();
  };

  // Global activity tracker (idle pause after 5 minutes).
  useEffect(() => {
    const mark = () => { lastInteractionRef.current = Date.now(); };
    const evts: Array<keyof WindowEventMap> = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  // Live XP ticker — runs while Research Room is active and lingers 1 min after tier change.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const idle = now - lastInteractionRef.current > 5 * 60 * 1000;
      if (idle || document.hidden) return;
      const lingering = now < tierLingerUntilRef.current;
      if (!researchActiveRef.current && !lingering) return;
      setLiveXp((prev) => {
        const next = prev + activeMultiplier;
        if (next >= XP_PER_LEVEL) {
          setLevel((l) => l + 1);
          return next - XP_PER_LEVEL;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeMultiplier]);

  useEffect(() => { localStorage.setItem(KEY_COOKIE, cookieAutoAccept ? "1" : "0"); }, [cookieAutoAccept]);
  useEffect(() => { localStorage.setItem(KEY_GPS, gpsPrecision ? "1" : "0"); }, [gpsPrecision]);

  // Cookie consent → install auto-accepter and seed local cookie-stash for cross-page sync.
  useEffect(() => {
    if (!cookieAutoAccept) return;
    const dispose = installCookieAutoAccepter();
    // Record the document referrer once as an interest signal.
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
        deviceProfile,
        topInterestTiers,
        liveXp,
        level,
        tierMultiplier,
        activeMultiplier,
        setActiveTierMultiplier,
        setResearchActive,
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
