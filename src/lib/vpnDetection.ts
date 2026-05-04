/**
 * VPN / datacenter / proxy detection.
 *
 * Single source of truth: Abstract API IP Intelligence, proxied through our
 * `ip-intelligence` edge function (so the API key is never bundled).
 *
 * Why: AddLogic's reward pool is region-priced. A user in a low-cost region
 * can otherwise spoof a high-CPM region (e.g. US/EU) via VPN and drain the
 * pool. Suspect IPs are hard-blocked app-wide by VpnGuard.
 *
 * Design rule: this module ONLY uses Abstract for the access-control
 * verdict. We deliberately do not mix in weaker keyless providers
 * (e.g. ipwho.is) for the block decision — that would let attackers
 * downgrade to a provider that doesn't flag their VPN.
 */

import { supabase } from "@/integrations/supabase/client";

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
  // Only set when status === "unverified" — explains why we couldn't decide.
  unverifiedReason?: string;
};

// Local secondary blocklist (substring match against ASN/org) — layered on
// top of Abstract's flags so a generic "datacenter" string still trips the
// gate even if the upstream provider misses it. This NEVER unblocks; it
// can only escalate an Abstract "ok" to "blocked".
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

const UNVERIFIED_CACHE_MS = 8_000;

async function callAbstract(): Promise<{ info: IpInfo | null; degraded: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("ip-intelligence", { method: "GET" });
    if (error || !data) {
      return { info: null, degraded: error?.message ?? "edge function unreachable" };
    }
    const d = data as EdgePayload;
    if (d.fallback || d.error) {
      // Edge says it couldn't get a verdict from Abstract (rate limit,
      // missing key, upstream 5xx). We do NOT silently substitute another
      // provider — caller decides what to show.
      return { info: null, degraded: d.error ?? "abstract unavailable" };
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

// Dedupe concurrent callers (anything that needs the verdict) and cache the
// result for 5 min so we stay well under the Abstract free-tier 1-req/sec
// limit. Single shared check across the app.
let inflight: Promise<IpVerdict> | null = null;
let cached: { at: number; verdict: IpVerdict } | null = null;
const CLIENT_TTL_MS = 5 * 60 * 1000;

export async function fetchIpVerdict(force = false): Promise<IpVerdict> {
  if (!force && cached) {
    const ttl = cached.verdict.status === "unverified" ? UNVERIFIED_CACHE_MS : CLIENT_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.verdict;
  }
  if (!force && inflight) return inflight;

  inflight = (async () => {
    const { info, degraded } = await callAbstract();
    let verdict: IpVerdict;
    if (info) {
      verdict = { status: info.vpn_suspected ? "blocked" : "ok", info };
    } else {
      verdict = { status: "unverified", info: null, unverifiedReason: degraded ?? "verification failed" };
    }
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
