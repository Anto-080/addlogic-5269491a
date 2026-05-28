/**
 * VPN / proxy detection — FingerprintJS Pro Smart Signals is the sole
 * authority that can return `blocked`. Cloudflare lookups still run to
 * surface IP/ASN/country metadata for UI and telemetry, but a Cloudflare
 * "vpn_suspected" flag no longer blocks on its own. MaxMind and the local
 * datacenter ASN keyword blocklist have been removed from the
 * access-control path entirely.
 *
 * Why: legacy IP heuristics produced sticky false-positives (a user who
 * briefly enabled a VPN stayed banned even after disabling it). The
 * Fingerprint Pro workspace rules are the user-controlled source of truth.
 */

import { supabase } from "@/integrations/supabase/client";
import { clearVisitorEventCache, getVisitorEvent } from "@/lib/fingerprint";

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
  vpn_suspected: boolean;
  reason: string | null;
};

export type VerdictStatus = "ok" | "blocked" | "unverified";

export type IpVerdict = {
  status: VerdictStatus;
  info: IpInfo | null;
  unverifiedReason?: string;
};



type EdgePayload = Partial<IpInfo> & { error?: string; fallback?: boolean };

const UNVERIFIED_CACHE_MS = 30_000;
// `ok` results may be cached. `blocked` results are NEVER cached so that
// a user who disables their VPN and hits "Re-check" gets a fresh lookup
// instead of being stuck behind a stale ban.
const CLIENT_TTL_MS = 60_000;


async function callCloudflare(): Promise<{ info: IpInfo | null; degraded: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("cloudflare-ip-check", { method: "GET" });
    if (error || !data) {
      return { info: null, degraded: error?.message ?? "edge function unreachable" };
    }
    const d = data as EdgePayload;
    if (d.fallback || d.error) {
      return { info: null, degraded: d.error ?? "cloudflare unavailable" };
    }
    const info: IpInfo = {
      ip: d.ip ?? "",
      country_code: d.country_code ?? null,
      country_name: d.country_name ?? null,
      asn: d.asn ?? null,
      org: d.org ?? null,
      vpn_suspected: !!d.vpn_suspected,
      reason: d.reason ?? null,
    };
    return { info, degraded: null };
  } catch (e) {
    return { info: null, degraded: e instanceof Error ? e.message : "network error" };
  }
}

type FpSignals = {
  vpn: boolean;
  proxy: boolean;
  proxyType?: string | null;
  tor: boolean;
  relay: boolean;
  incognito: boolean;
  ipFromFp?: string | null;
  fallback?: boolean;
  error?: string;
};


async function callFingerprint(): Promise<{ signals: FpSignals | null; degraded: string | null }> {
  try {
    const { requestId } = await getVisitorEvent();
    if (!requestId) {
      return { signals: null, degraded: "fingerprint requestId unavailable" };
    }
    const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
      method: "POST",
      body: { requestId },
    });
    if (error || !data) {
      return { signals: null, degraded: error?.message ?? "fingerprint edge unreachable" };
    }
    const d = data as FpSignals;
    if (d.fallback || d.error) {
      return { signals: null, degraded: d.error ?? "fingerprint unavailable" };
    }
    return { signals: d, degraded: null };
  } catch (e) {
    return { signals: null, degraded: e instanceof Error ? e.message : "network error" };
  }
}

/**
 * New block policy: only Public VPN, Tor, or Datacenter/Hosting-type proxy
 * trigger a block. Residential / mobile / ISP proxies and privacy relays
 * (e.g. iCloud Private Relay) are allowed — they're how real mobile users
 * appear on the network.
 *
 * Returns:
 *   { kind: "block", reason } → hard block
 *   { kind: "allow" }         → pass through
 *   { kind: "unverified", reason } → caller should treat as unverified
 */
type FpEvaluation =
  | { kind: "block"; reason: string }
  | { kind: "allow" }
  | { kind: "unverified"; reason: string };

const DATACENTER_PROXY_TYPES = new Set([
  "datacenter", "data_center", "data-center", "hosting", "server", "cloud",
]);
const RESIDENTIAL_PROXY_TYPES = new Set([
  "residential", "mobile", "isp", "cellular", "wireless", "broadband",
]);

export function evaluateFingerprint(s: FpSignals): FpEvaluation {
  if (s.vpn) return { kind: "block", reason: "FingerprintJS: Public VPN detected" };
  if (s.tor) return { kind: "block", reason: "FingerprintJS: Tor exit node" };
  if (s.proxy) {
    const t = (s.proxyType ?? "").toLowerCase();
    if (DATACENTER_PROXY_TYPES.has(t)) {
      return { kind: "block", reason: "FingerprintJS: Datacenter proxy detected" };
    }
    if (RESIDENTIAL_PROXY_TYPES.has(t)) {
      return { kind: "allow" };
    }
    // proxy=true with no type → don't auto-block residential users; surface as unverified
    if (!t) return { kind: "unverified", reason: "Proxy type not provided" };
    // any other unknown classification → allow rather than risk false-positive
    return { kind: "allow" };
  }
  // relay alone is not a block
  return { kind: "allow" };
}

function applyFpEvaluation(
  fp: { signals: FpSignals | null; degraded: string | null },
  cf: { info: IpInfo | null; degraded: string | null },
): IpVerdict {
  const baseInfo: IpInfo = cf.info ?? {
    ip: "", country_code: null, country_name: null, asn: null, org: null,
    vpn_suspected: false, reason: null,
  };
  if (!fp.signals) {
    return cacheVerdict({
      status: "unverified",
      info: cf.info,
      unverifiedReason: fp.degraded ?? "Fingerprint verification unavailable",
    });
  }
  const ev = evaluateFingerprint(fp.signals);
  if (ev.kind === "block") {
    return cacheVerdict({
      status: "blocked",
      info: { ...baseInfo, vpn_suspected: true, reason: ev.reason },
    });
  }
  if (ev.kind === "unverified") {
    return cacheVerdict({ status: "unverified", info: cf.info, unverifiedReason: ev.reason });
  }
  return cacheVerdict({ status: "ok", info: baseInfo });
}


let inflight: Promise<IpVerdict> | null = null;
let cached: { at: number; verdict: IpVerdict } | null = null;

function cacheVerdict(verdict: IpVerdict) {
  // Never cache a `blocked` verdict — re-checks after disabling a VPN
  // must always hit a fresh upstream lookup.
  if (verdict.status !== "blocked") {
    cached = { at: Date.now(), verdict };
  } else {
    cached = null;
  }
  inflight = null;
  return verdict;
}

export async function fetchIpVerdict(force = false): Promise<IpVerdict> {
  if (!force && cached) {
    const ttl = cached.verdict.status === "unverified" ? UNVERIFIED_CACHE_MS : CLIENT_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.verdict;
  }
  if (!force && inflight) return inflight;
  if (force) clearVisitorEventCache();

  inflight = (async () => {
    const [cf, fp] = await Promise.all([callCloudflare(), callFingerprint()]);
    return applyFpEvaluation(fp, cf);
  })();

  return inflight;
}



export async function fetchIpVerdictWithFingerprintEvent(
  event?: { visitorId?: string | null; requestId?: string | null } | null,
  force = false,
): Promise<IpVerdict> {
  if (!force && cached) {
    const ttl = cached.verdict.status === "unverified" ? UNVERIFIED_CACHE_MS : CLIENT_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.verdict;
  }
  if (!force && inflight) return inflight;
  if (force) clearVisitorEventCache();

  inflight = (async () => {
    const cloudflarePromise = callCloudflare();
    const requestId = event?.requestId?.trim();

    const fp = requestId
      ? await (async () => {
          try {
            const { data, error } = await supabase.functions.invoke("fingerprint-signals", {
              method: "POST",
              body: { requestId },
            });
            if (error || !data) {
              return { signals: null, degraded: error?.message ?? "fingerprint edge unreachable" };
            }
            const d = data as FpSignals;
            if (d.fallback || d.error) {
              return { signals: null, degraded: d.error ?? "fingerprint unavailable" };
            }
            return { signals: d, degraded: null };
          } catch (e) {
            return { signals: null, degraded: e instanceof Error ? e.message : "network error" };
          }
        })()
      : await callFingerprint();

    const cf = await cloudflarePromise;

    // FingerprintJS Pro is the sole authority for blocking.
    const fpReason = fp.signals ? fingerprintReason(fp.signals) : null;
    if (fpReason) {
      const baseInfo = cf.info ?? {
        ip: "", country_code: null, country_name: null, asn: null, org: null,
        vpn_suspected: false, reason: null,
      };
      return cacheVerdict({
        status: "blocked",
        info: { ...baseInfo, vpn_suspected: true, reason: fpReason },
      });
    }

    if (!fp.signals) {
      return cacheVerdict({
        status: "unverified",
        info: cf.info,
        unverifiedReason: fp.degraded ?? "Fingerprint verification unavailable",
      });
    }

    return cacheVerdict({
      status: "ok",
      info: cf.info ?? {
        ip: "", country_code: null, country_name: null, asn: null, org: null,
        vpn_suspected: false, reason: null,
      },
    });
  })();


  return inflight;
}

/**
 * Backwards-compatible helper for callers that just want the IpInfo
 * (e.g. the geo consent slide showing the user their detected country/ASN).
 * This does NOT make access-control decisions — ConnectionGate owns that.
 */
export async function fetchIpInfo(): Promise<IpInfo | null> {
  const v = await fetchIpVerdict();
  return v.info;
}

export function clearIpVerdictCache() {
  cached = null;
  inflight = null;
  clearVisitorEventCache();
}

/**
 * IP-branch fraud check used by the post-login entrance card. Uses
 * FingerprintJS Pro Smart Signals as the only authority — MaxMind and the
 * local datacenter ASN blocklist have been removed so users can no longer
 * be stuck behind stale IP heuristics after disabling a VPN.
 */
export async function verifyIpForApproximateLocation(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  clearVisitorEventCache();
  const fp = await callFingerprint();
  if (fp.signals) {
    const fpReason = fingerprintReason(fp.signals);
    if (fpReason) return { ok: false, reason: fpReason };
  }
  return { ok: true };
}


/**
 * Reverse geocode using keyless geocode.maps.co (free tier). Returns ISO
 * country code, used to cross-check against the IP-derived country.
 */
export async function reverseGeocodeCountry(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { Accept: "application/json" } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const cc = j?.address?.country_code;
    return cc ? String(cc).toUpperCase() : null;
  } catch {
    return null;
  }
}
