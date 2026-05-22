/**
 * VPN / datacenter / proxy detection.
 *
 * Verdict pipeline (any single source flagging = hard block):
 *   1. Cloudflare Radar (`cloudflare-ip-check` edge fn) — IP type / ASN.
 *   2. FingerprintJS Pro Smart Signals (`fingerprint-signals` edge fn) —
 *      vpn/proxy/tor/relay flags from the browser event.
 *   3. Local datacenter / VPN ASN substring blocklist (escalates only).
 *
 * Abstract API (`ip-intelligence` edge fn) is paused on disk as an
 * emergency fallback — no code path calls it. Re-enable by adding a third
 * branch to the merge below.
 *
 * Why: AddLogic's reward pool is region-priced. A user in a low-cost region
 * can otherwise spoof a high-CPM region (e.g. US/EU) via VPN and drain the
 * pool. Suspect IPs are hard-blocked app-wide by VpnGuard.
 *
 * Design rule: we never silently downgrade to a weaker keyless provider for
 * the block decision. If both authoritative sources are degraded we surface
 * an "unverified, retry" state — never auto-pass.
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

const VPN_HOSTS = [
  "nordvpn", "nord ", "expressvpn", "express vpn", "mullvad", "protonvpn", "proton ag",
  "surfshark", "private internet access", "pia ", "windscribe", "cyberghost",
  "tunnelbear", "ivpn", "azirevpn", "perfect privacy", "hide.me", "hidemyass",
  "purevpn", "vyprvpn", "torguard", "cloudflare warp", " warp ", "mysterium",
  "digitalocean", "ovh", "hetzner", "linode", "vultr", "leaseweb", "m247",
  "amazon", "aws", "google cloud", "microsoft azure", "alibaba", "tencent",
  "oracle cloud", "ibm cloud", "gcore", "g-core", "choopa", "datacamp", "psychz",
  "constant", "contabo", "scaleway", "hostwinds", "quadranet", "colocrossing",
  "worldstream", "serverius", "host europe", "hostinger", "namecheap", "godaddy",
  "kamatera", "upcloud", "fastly", "akamai", "stackpath", "limestone", "hivelocity",
  "pacificrack", "frantech", "buyvm", "bitlaunch", "racknerd",
];

const GENERIC_TOKENS = [
  "vpn", "proxy", "hosting", "datacenter", "data center", "data-center",
  "colocation", "colo ", "anonymizer", "tor exit", "exit node",
];

function applyLocalBlocklist(info: IpInfo): IpInfo {
  if (info.vpn_suspected) return info;
  const org = String(info.org ?? "").toLowerCase();
  const asn = String(info.asn ?? "").toLowerCase();
  const matchHost = VPN_HOSTS.find((h) => org.includes(h) || asn.includes(h));
  if (matchHost) {
    return { ...info, vpn_suspected: true, reason: `Datacenter / VPN ASN match: ${matchHost}` };
  }
  const matchGeneric = GENERIC_TOKENS.find((h) => org.includes(h));
  if (matchGeneric) {
    return { ...info, vpn_suspected: true, reason: `Non-residential network token: "${matchGeneric.trim()}"` };
  }
  return info;
}

type EdgePayload = Partial<IpInfo> & { error?: string; fallback?: boolean };

const UNVERIFIED_CACHE_MS = 90_000;
const CLIENT_TTL_MS = 5 * 60 * 1000;
const VPN_PROXY_BLOCK_MESSAGE = "VPN/Proxy traffic detected. Please deactivate your VPN to access the site.";

function transportBlocked(reason: string | null): boolean {
  const n = String(reason ?? "").toLowerCase();
  return (
    n.includes("failed to send a request to the edge function") ||
    n.includes("edge function unreachable") ||
    n.includes("network error")
  );
}

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
    return { info: applyLocalBlocklist(info), degraded: null };
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

export async function fetchIpVerdict(force = false): Promise<IpVerdict> {
  if (!force && cached) {
    const ttl = cached.verdict.status === "unverified" ? UNVERIFIED_CACHE_MS : CLIENT_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.verdict;
  }
  if (!force && inflight) return inflight;
  if (force) clearVisitorEventCache();

  inflight = (async () => {
    const [cf, fp] = await Promise.all([callCloudflare(), callFingerprint()]);

    // Hard blocks — any source flagging wins.
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

    // Transport-level failure on Cloudflare while we have nothing else
    // → treat as the friendly "VPN/proxy traffic detected" hard block, since
    // some VPNs aggressively block our edge endpoint.
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

    // Unverified — neither source could deliver a confident verdict.
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

    // Both sources happy (or one happy + the other degraded) → ok.
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
 * This does NOT make access-control decisions — VpnGuard owns that.
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
