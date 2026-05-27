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
  tor: boolean;
  relay: boolean;
  incognito: boolean;
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

function fingerprintReason(s: FpSignals): string | null {
  if (s.vpn) return "FingerprintJS: VPN detected";
  if (s.proxy) return "FingerprintJS: Proxy detected";
  if (s.tor) return "FingerprintJS: Tor exit node";
  if (s.relay) return "FingerprintJS: Privacy relay (iCloud/etc.)";
  return null;
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

    // Fingerprint couldn't deliver a verdict at all → unverified, never auto-block.
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

    if (cf.info?.vpn_suspected) {
      const verdict: IpVerdict = { status: "blocked", info: cf.info };
      cached = { at: Date.now(), verdict };
      inflight = null;
      return verdict;
    }

    const fpReason = fp.signals ? fingerprintReason(fp.signals) : null;
    if (fpReason) {
      const baseInfo = cf.info ?? {
        ip: "", country_code: null, country_name: null, asn: null, org: null,
        vpn_suspected: false, reason: null,
      };
      const verdict: IpVerdict = {
        status: "blocked",
        info: { ...baseInfo, vpn_suspected: true, reason: fpReason },
      };
      cached = { at: Date.now(), verdict };
      inflight = null;
      return verdict;
    }

    if (!cf.info && transportBlocked(cf.degraded)) {
      const verdict: IpVerdict = {
        status: "blocked",
        info: {
          ip: "", country_code: null, country_name: null, asn: null, org: null,
          vpn_suspected: true, reason: VPN_PROXY_BLOCK_MESSAGE,
        },
      };
      cached = { at: Date.now(), verdict };
      inflight = null;
      return verdict;
    }

    if (!cf.info && !fp.signals) {
      const reason = cf.degraded?.toLowerCase().includes("cloudflare 401")
        ? "Cloudflare authentication needs to be refreshed."
        : cf.degraded?.toLowerCase().includes("cloudflare 429")
          ? "Cloudflare rate limit reached — retrying shortly."
          : (cf.degraded ?? fp.degraded ?? "verification failed");
      const verdict: IpVerdict = { status: "unverified", info: null, unverifiedReason: reason };
      cached = { at: Date.now(), verdict };
      inflight = null;
      return verdict;
    }

    const verdict: IpVerdict = {
      status: "ok",
      info: cf.info ?? {
        ip: "", country_code: null, country_name: null, asn: null, org: null,
        vpn_suspected: false, reason: null,
      },
    };
    cached = { at: Date.now(), verdict };
    inflight = null;
    return verdict;
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
 * IP-branch fraud check used by the post-login entrance card. Runs MaxMind
 * minFraud first (when configured) and falls back to FingerprintJS Pro
 * Smart Signals + the local datacenter ASN blocklist.
 */
export async function verifyIpForApproximateLocation(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  // 1. MaxMind minFraud (skipped silently if not configured server-side).
  try {
    const { data } = await supabase.functions.invoke("maxmind-minfraud", { method: "POST" });
    const d = data as {
      configured?: boolean;
      isVpn?: boolean;
      isHostingProvider?: boolean;
      isPublicProxy?: boolean;
      isTorExitNode?: boolean;
      riskScore?: number;
    } | null;
    if (d?.configured) {
      if (d.isVpn) return { ok: false, reason: "MaxMind: anonymous VPN" };
      if (d.isPublicProxy) return { ok: false, reason: "MaxMind: public proxy" };
      if (d.isTorExitNode) return { ok: false, reason: "MaxMind: Tor exit node" };
      if (d.isHostingProvider) return { ok: false, reason: "MaxMind: hosting provider / datacenter" };
      if ((d.riskScore ?? 0) >= 75) return { ok: false, reason: `MaxMind: high risk score ${d.riskScore}` };
    }
  } catch { /* fall through to fingerprint */ }

  // 2. FingerprintJS Pro Smart Signals.
  const fp = await callFingerprint();
  if (fp.signals) {
    const fpReason = fingerprintReason(fp.signals);
    if (fpReason) return { ok: false, reason: fpReason };
  }

  // 3. Local datacenter ASN blocklist via Cloudflare Radar.
  const cf = await callCloudflare();
  if (cf.info?.vpn_suspected) {
    return { ok: false, reason: cf.info.reason ?? "Datacenter / VPN ASN" };
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
