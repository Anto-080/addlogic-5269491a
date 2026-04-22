/**
 * userInterestProfiler — derives a list of the user's likely top interest
 * tiers from device/browser data, but only when both the Cookie auto-accept
 * and GPS precision toggles are enabled (explicit consent gates).
 *
 * In the Lovable web preview the browser sandbox forbids cross-site
 * history reads, so we fall back to:
 *   1. document.referrer
 *   2. localStorage research-search log (key: "rr.searchLog")
 *   3. Capacitor native bridge (window.HistoryBridge?.read()) when wired
 *      to a Read-History plugin in the Android shell.
 *
 * The function is deterministic and silent on failure — it returns an
 * ordered list of tier IDs (best match first), or an empty array when
 * consent is missing or no signal could be extracted.
 */

import { TIERS } from "@/lib/mockData";

declare global {
  interface Window {
    HistoryBridge?: { read: () => Promise<string[]> | string[] };
  }
}

export type InterestSignal = {
  consents: { cookies: boolean; gps: boolean };
  topInterestTiers: number[];
};

const SEARCH_LOG_KEY = "rr.searchLog";

export function recordSearch(query: string) {
  try {
    const raw = localStorage.getItem(SEARCH_LOG_KEY);
    const log: string[] = raw ? JSON.parse(raw) : [];
    log.push(query.toLowerCase());
    if (log.length > 50) log.splice(0, log.length - 50);
    localStorage.setItem(SEARCH_LOG_KEY, JSON.stringify(log));
  } catch {
    /* ignore storage errors */
  }
}

async function gatherStrings(): Promise<string[]> {
  const out: string[] = [];
  if (typeof document !== "undefined" && document.referrer) out.push(document.referrer.toLowerCase());
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(SEARCH_LOG_KEY) : null;
    if (raw) (JSON.parse(raw) as string[]).forEach((s) => out.push(s));
  } catch { /* ignore */ }
  if (typeof window !== "undefined" && window.HistoryBridge?.read) {
    try {
      const native = await window.HistoryBridge.read();
      native.forEach((s) => out.push(String(s).toLowerCase()));
    } catch { /* ignore */ }
  }
  return out;
}

export async function deriveInterestTiers(consents: {
  cookies: boolean;
  gps: boolean;
}): Promise<number[]> {
  if (!consents.cookies || !consents.gps) return [];
  const haystack = (await gatherStrings()).join(" \n ");
  if (!haystack) return [];
  const scored = TIERS.map((t) => {
    const keywords = [t.name.toLowerCase(), ...t.subcategories.map((s) => s.toLowerCase())];
    const score = keywords.reduce((acc, kw) => {
      const k = kw.split(/\s+/).filter(Boolean);
      return acc + k.reduce((a, w) => a + (haystack.includes(w) ? 1 : 0), 0);
    }, 0);
    return { id: t.id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, 5).map((s) => s.id);
}
