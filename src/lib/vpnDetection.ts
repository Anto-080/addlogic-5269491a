/**
 * VPN / proxy detection — FingerprintJS Pro + the workspace ruleset
 * (rs_kd5z5fhUgyMT49) are the SOLE block authority.
 *
 * No client-side heuristics. No vpn/tor/proxyType checks here. The
 * ruleset configured in the FingerprintJS workspace decides; we only
 * read `rulesetAction`. If the upstream is degraded we fail-open.
 */

import { clearVisitorEventCache, getVisitorEvent } from "@/lib/fingerprint";
import { supabase } from "@/integrations/supabase/client";

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
};

export type FpSignals = {
  vpn: boolean;
  proxy: boolean;
  proxyType?: string | null;
  tor: boolean;
  relay: boolean;
  incognito: boolean;
  ipFromFp?: string | null;
  ipCountryFromFp?: string | null;
  rulesetAction?: string | null;
  rulesetRuleName?: string | null;
  fallback?: boolean;
  error?: string;
};

export type FpEvaluation =
  | { kind: "block"; reason: string; ruleName: string | null }
  | { kind: "allow" };

/**
 * The ruleset is the only thing that can block. Period.
 */
export function evaluateFingerprint(s: FpSignals): FpEvaluation {
  if ((s.rulesetAction ?? "").toLowerCase() === "block") {
    return {
      kind: "block",
      reason: s.rulesetRuleName
        ? `Blocked by FingerprintJS ruleset: ${s.rulesetRuleName}`
        : "Blocked by FingerprintJS ruleset",
      ruleName: s.rulesetRuleName ?? null,
    };
  }
  return { kind: "allow" };
}

async function callFingerprint(): Promise<{ signals: FpSignals | null; degraded: string | null }> {
  try {
    const { requestId } = await getVisitorEvent();
    if (!requestId) return { signals: null, degraded: "Fingerprint requestId unavailable" };
    const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
      method: "POST",
      body: { requestId },
    });
    if (error || !data) return { signals: null, degraded: error?.message ?? "Fingerprint edge unreachable" };
    const d = data as FpSignals;
    if (d.fallback || d.error) return { signals: null, degraded: d.error ?? "Fingerprint unavailable" };
    return { signals: d, degraded: null };
  } catch (e) {
    return { signals: null, degraded: e instanceof Error ? e.message : "network error" };
  }
}

export type RulesetVerdict = {
  ok: boolean;
  reason?: string;
  ruleName?: string | null;
  signals?: FpSignals | null;
};

/**
 * Site-wide entry check used by PostLoginGate. Forces a fresh Fingerprint
 * event so a user who just disabled their VPN gets a clean re-check.
 * Fail-open on degraded upstream (never punish for our outage).
 */
export async function verifyFingerprintRuleset(): Promise<RulesetVerdict> {
  clearVisitorEventCache();
  const fp = await callFingerprint();
  if (!fp.signals) return { ok: true, signals: null };
  const ev = evaluateFingerprint(fp.signals);
  if (ev.kind === "block") {
    return { ok: false, reason: ev.reason, ruleName: ev.ruleName, signals: fp.signals };
  }
  return { ok: true, signals: fp.signals };
}

/** Back-compat alias — same behaviour, ruleset is the only decider. */
export const verifyIpForApproximateLocation = verifyFingerprintRuleset;

/**
 * Lightweight transport-only IP lookup used by the drift watcher and the
 * "anti-fraud details" disclosure. NEVER influences allow/block.
 */
export async function fetchTransportIpInfo(): Promise<IpInfo | null> {
  try {
    const r = await fetch("https://ipwho.is/", { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || j.success === false) return null;
    return {
      ip: String(j.ip ?? ""),
      country_code: j.country_code ?? null,
      country_name: j.country ?? null,
      asn: j.connection?.asn != null ? String(j.connection.asn) : null,
      org: j.connection?.isp ?? j.connection?.org ?? null,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const cc = j?.address?.country_code;
    return cc ? String(cc).toUpperCase() : null;
  } catch {
    return null;
  }
}
