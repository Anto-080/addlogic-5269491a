/**
 * VPN / proxy detection — FingerprintJS Pro Smart Signals + the workspace
 * ruleset (rs_kd5z5fhUgyMT49) are the ONLY block authority.
 *
 * Hard rules — no exceptions:
 *  - Allow: residential, mobile, cellular, ISP proxies; Privacy Relay (iCloud)
 *  - Allow: a raw `vpn=true` signal that is NOT accompanied by an explicit
 *    datacenter/hosting/server/cloud proxy classification (Tiscali, mobile
 *    carriers, residential ISPs sometimes get falsely flagged by the VPN
 *    classifier alone)
 *  - Block: Tor exit nodes
 *  - Block: proxy with proxyType in {datacenter, hosting, server, cloud}
 *  - Block: explicit ruleset action === "block"
 *
 * No Cloudflare/Abstract/MaxMind/heuristic deny path. No confidence
 * thresholds. No client-side IP cache for blocked verdicts.
 */

import { supabase } from "@/integrations/supabase/client";
import { clearVisitorEventCache, getVisitorEvent } from "@/lib/fingerprint";

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
};

type FpSignals = {
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

const DATACENTER_PROXY_TYPES = new Set([
  "datacenter", "data_center", "data-center", "hosting", "server", "cloud",
]);

const ALLOWED_PROXY_TYPES = new Set([
  "residential", "mobile", "cellular", "isp",
]);

export type FpEvaluation =
  | { kind: "block"; reason: string }
  | { kind: "allow" };

export function evaluateFingerprint(s: FpSignals): FpEvaluation {
  // Workspace ruleset is the canonical authority.
  if ((s.rulesetAction ?? "").toLowerCase() === "block") {
    return { kind: "block", reason: `FingerprintJS ruleset: ${s.rulesetRuleName ?? "blocked"}` };
  }
  if (s.tor) return { kind: "block", reason: "FingerprintJS: Tor exit node" };
  const t = (s.proxyType ?? "").toLowerCase();
  if (s.proxy && DATACENTER_PROXY_TYPES.has(t)) {
    return { kind: "block", reason: "FingerprintJS: Datacenter/hosting proxy" };
  }
  // Residential / mobile / ISP proxies → allow.
  // Privacy Relay → allow.
  // `vpn=true` alone (with no datacenter proxy classification) → allow.
  void ALLOWED_PROXY_TYPES;
  return { kind: "allow" };
}

async function callFingerprint(): Promise<{ signals: FpSignals | null; degraded: string | null }> {
  try {
    const { requestId } = await getVisitorEvent();
    if (!requestId) {
      return { signals: null, degraded: "Fingerprint requestId unavailable" };
    }
    const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
      method: "POST",
      body: { requestId },
    });
    if (error || !data) {
      return { signals: null, degraded: error?.message ?? "Fingerprint edge unreachable" };
    }
    const d = data as FpSignals;
    if (d.fallback || d.error) {
      return { signals: null, degraded: d.error ?? "Fingerprint unavailable" };
    }
    return { signals: d, degraded: null };
  } catch (e) {
    return { signals: null, degraded: e instanceof Error ? e.message : "network error" };
  }
}

/**
 * The ONLY entry point used by the UI to decide allow/block. Called from
 * GeoConsentSlide.tryIp() when the user clicks "Use approximate location".
 * On any Fingerprint/network failure we ALLOW — we never block a user
 * because of a degraded upstream.
 */
export async function verifyIpForApproximateLocation(): Promise<{
  ok: boolean;
  reason?: string;
  signals?: FpSignals | null;
}> {
  // Force a fresh event so a user who just disabled their VPN gets a clean
  // re-check instead of a stale visitor result.
  clearVisitorEventCache();
  const fp = await callFingerprint();
  if (!fp.signals) {
    return { ok: true, signals: null }; // fail-open
  }
  const ev = evaluateFingerprint(fp.signals);
  if (ev.kind === "block") return { ok: false, reason: ev.reason, signals: fp.signals };
  return { ok: true, signals: fp.signals };
}

/**
 * Lightweight transport-only IP lookup used by the drift watcher and the
 * "anti-fraud details" disclosure in GeoConsentSlide. Uses ipwho.is (no
 * key, no rate limit on light traffic) and NEVER influences allow/block.
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

/**
 * Reverse geocode via keyless geocode.maps.co. Used only to display the
 * GPS country in telemetry; not part of the block decision.
 */
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
