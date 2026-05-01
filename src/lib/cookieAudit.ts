/**
 * Cookie audit — sweeps `document.cookie`, classifies entries, and persists
 * the listing into `cookie_audit` so the user can see what the toggle
 * actually did.
 *
 *  - "zero" = our own `rr_zero_*` cookies (volunteered/derived signal)
 *  - "first" = any other cookie set on this exact host
 *  - "third" = anything we received that doesn't belong to us
 *    (with `document.cookie` we can't see HttpOnly or cross-origin entries,
 *    so the "third" bucket is a best-effort classification of remaining
 *    common analytics keys we *can* see, e.g. `_ga`, `_gid`, `_fbp`).
 */

import { supabase } from "@/integrations/supabase/client";

export type CookieEntry = { name: string; host: string; kind: "first" | "third" | "zero" };
export type CookieAudit = {
  entries: CookieEntry[];
  counts: { first: number; third: number; zero: number };
  ts: number;
};

const THIRD_PARTY_HINTS = ["_ga", "_gid", "_fbp", "_fbc", "_gcl_", "ajs_", "mp_", "yandex"];

export function sweepCookies(): CookieAudit {
  const entries: CookieEntry[] = [];
  const host = typeof location !== "undefined" ? location.host : "unknown";
  if (typeof document !== "undefined") {
    document.cookie.split(/;\s*/).forEach((pair) => {
      const eq = pair.indexOf("=");
      if (eq < 0) return;
      const name = pair.slice(0, eq).trim();
      if (!name) return;
      let kind: CookieEntry["kind"];
      if (name.startsWith("rr_zero_")) kind = "zero";
      else if (THIRD_PARTY_HINTS.some((h) => name.startsWith(h) || name.includes(h))) kind = "third";
      else kind = "first";
      entries.push({ name, host, kind });
    });
  }
  const counts = entries.reduce(
    (acc, e) => ((acc[e.kind]++, acc)),
    { first: 0, third: 0, zero: 0 } as CookieAudit["counts"]
  );
  return { entries, counts, ts: Date.now() };
}

export async function persistAudit(userId: string, audit: CookieAudit): Promise<void> {
  if (!audit.entries.length) return;
  const rows = audit.entries.map((e) => ({
    user_id: userId,
    host: e.host,
    name: e.name,
    kind: e.kind,
  }));
  await supabase.from("cookie_audit").insert(rows);
}
