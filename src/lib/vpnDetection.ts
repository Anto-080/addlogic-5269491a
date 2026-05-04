/**
 * VPN / datacenter / proxy detection.
 *
 * Primary source: Abstract API IP Intelligence, proxied through our
 * `ip-intelligence` edge function (so the API key is never bundled).
 * Fallback: ipwho.is keyless lookup if the edge function is unreachable.
 *
 * Why: AddLogic's reward pool is region-priced. A user in a low-cost region
 * can otherwise spoof a high-CPM region (e.g. US/EU) via VPN and drain the
 * pool. Suspect IPs are hard-blocked app-wide by VpnGuard.
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

// Local secondary blocklist (substring match against ASN/org) — layered on
// top of Abstract's flags so a generic "datacenter" string still trips the
// gate even if the upstream provider misses it.
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
  "cloud", "server", "colocation", "colo ", "anonymizer", "tor exit", "exit node",
];

export type BlockEvaluation = {
  block: boolean;
  reason: string | null;
};

export function evaluateBlock(info: IpInfo | null): BlockEvaluation {
  if (!info) return { block: false, reason: null };
  if (info.vpn_suspected) {
    return { block: true, reason: info.reason ?? "VPN / datacenter / proxy connection" };
  }
  return { block: false, reason: null };
}

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

async function fetchFromAbstract(): Promise<IpInfo | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ip-intelligence", {
      method: "GET",
    });
    if (error || !data) return null;
    const d = data as Partial<IpInfo> & { error?: string; fallback?: boolean };
    // Edge function asked us to fall back (rate-limited, missing key, etc.)
    if (d.fallback || d.error) return null;
    const info: IpInfo = {
      ip: d.ip ?? "",
      country_code: d.country_code ?? null,
      country_name: d.country_name ?? null,
      asn: d.asn ?? null,
      org: d.org ?? null,
      vpn_suspected: !!d.vpn_suspected,
      reason: d.reason ?? null,
    };
    return applyLocalBlocklist(info);
  } catch {
    return null;
  }
}

async function fetchFromIpwho(): Promise<IpInfo | null> {
  try {
    const r = await fetch("https://ipwho.is/?fields=ip,success,country,country_code,connection,security", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (j?.success === false) return null;
    const info: IpInfo = {
      ip: String(j?.ip ?? ""),
      country_code: j?.country_code ?? null,
      country_name: j?.country ?? null,
      asn: String(j?.connection?.asn ?? ""),
      org: j?.connection?.org ?? j?.connection?.isp ?? null,
      vpn_suspected: false,
      reason: null,
    };
    return applyLocalBlocklist(info);
  } catch {
    return null;
  }
}

// Dedupe concurrent callers (VpnGuard + GeoConsentSlide both fire on first
// paint) and cache the result for 5 min so we stay well under the
// Abstract free-tier 1-req/sec limit.
let inflight: Promise<IpInfo | null> | null = null;
let cached: { at: number; info: IpInfo | null } | null = null;
const CLIENT_TTL_MS = 5 * 60 * 1000;

export async function fetchIpInfo(): Promise<IpInfo | null> {
  if (cached && Date.now() - cached.at < CLIENT_TTL_MS) return cached.info;
  if (inflight) return inflight;
  inflight = (async () => {
    const primary = await fetchFromAbstract();
    const result = primary ?? (await fetchFromIpwho());
    cached = { at: Date.now(), info: result };
    inflight = null;
    return result;
  })();
  return inflight;
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
