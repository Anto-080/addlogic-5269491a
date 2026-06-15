/**
 * VPN / proxy detection.
 *
 * The Pro Smart-Signals tier is no longer in the bundle, so the client
 * fails OPEN — the entrance gate never blocks based on Fingerprint.
 * Anti-duplicate-account and drift detection still work via the OSS
 * visitorId exposed by `src/lib/fingerprint.ts`.
 */

import { clearVisitorEventCache, getVisitorEvent } from "@/lib/fingerprint";

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

export function evaluateFingerprint(_s: FpSignals): FpEvaluation {
  return { kind: "allow" };
}

export type RulesetVerdict = {
  ok: boolean;
  reason?: string;
  ruleName?: string | null;
  signals?: FpSignals | null;
};

/**
 * Entry check used by PostLoginGate. Forces a fresh fingerprint event so the
 * drift watcher gets a stable baseline, then always allows.
 */
export async function verifyFingerprintRuleset(): Promise<RulesetVerdict> {
  clearVisitorEventCache();
  try {
    await getVisitorEvent();
  } catch {
    /* ignore */
  }
  return { ok: true, signals: null };
}

export const verifyIpForApproximateLocation = verifyFingerprintRuleset;

/** Transport-only IP lookup (metadata, never blocks). */
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
