/**
 * VPN / datacenter / proxy detection from ipapi.co's free JSON endpoint.
 *
 * Why: AddLogic's reward pool is region-priced. A user in a low-cost region
 * can otherwise spoof a high-CPM region (e.g. US/EU) via VPN and drain the
 * pool. We refuse the GPS multiplier bonus when the IP looks non-residential
 * or when GPS country and IP country disagree.
 */

export type IpInfo = {
  ip: string;
  country_code: string | null;
  country_name: string | null;
  asn: string | null;
  org: string | null;
  vpn_suspected: boolean;
  reason: string | null;
};

// Named blocklist (substring match against ASN/org).
const VPN_HOSTS = [
  // Consumer VPNs
  "nordvpn", "nord ", "expressvpn", "express vpn", "mullvad", "protonvpn", "proton ag",
  "surfshark", "private internet access", "pia ", "windscribe", "cyberghost",
  "tunnelbear", "ivpn", "azirevpn", "perfect privacy", "hide.me", "hidemyass",
  "purevpn", "vyprvpn", "torguard", "cloudflare warp", " warp ", "mysterium",
  // Hosting / VPS / cloud
  "digitalocean", "ovh", "hetzner", "linode", "vultr", "leaseweb", "m247",
  "amazon", "aws", "google cloud", "microsoft azure", "alibaba", "tencent",
  "oracle cloud", "ibm cloud", "gcore", "g-core", "choopa", "datacamp", "psychz",
  "constant", "contabo", "scaleway", "hostwinds", "quadranet", "colocrossing",
  "worldstream", "serverius", "host europe", "hostinger", "namecheap", "godaddy",
  "kamatera", "upcloud", "fastly", "akamai", "stackpath", "limestone", "hivelocity",
  "psychz", "pacificrack", "frantech", "buyvm", "bitlaunch", "racknerd",
];

// Generic tokens — if an org/ASN string contains any of these, it's almost
// certainly hosting/datacenter/VPN, not a residential ISP.
const GENERIC_TOKENS = [
  "vpn", "proxy", "hosting", "datacenter", "data center", "data-center",
  "cloud", "server", "colocation", "colo ", "anonymizer", "tor exit", "exit node",
];

export type BlockEvaluation = {
  block: boolean;
  reason: string | null;
};

/**
 * Single source of truth for "is this connection allowed to use the app?".
 * Used by both the app-wide VpnGuard and the GPS consent slide.
 *
 * Network/lookup failures are NOT a block — we don't want to lock out users
 * with flaky connections or who happen to be offline at first paint.
 */
export function evaluateBlock(info: IpInfo | null): BlockEvaluation {
  if (!info) return { block: false, reason: null };
  if (info.vpn_suspected) {
    return { block: true, reason: info.reason ?? "VPN / datacenter / proxy connection" };
  }
  return { block: false, reason: null };
}

export async function fetchIpInfo(): Promise<IpInfo | null> {
  // Try ipwho.is first (no auth, returns connection.isp + asn + reliable type),
  // then fall back to ipapi.co.
  try {
    const r = await fetch("https://ipwho.is/?fields=ip,success,country,country_code,connection,security", {
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      if (j?.success !== false) {
        const org = String(j?.connection?.org ?? j?.connection?.isp ?? "").toLowerCase();
        const asn = String(j?.connection?.asn ?? "");
        const lcAsn = asn.toLowerCase();
        const matchHost = VPN_HOSTS.find((h) => org.includes(h) || lcAsn.includes(h));
        const matchGeneric = GENERIC_TOKENS.find((h) => org.includes(h));
        let reason: string | null = null;
        if (matchHost) reason = `Datacenter / VPN ASN match: ${matchHost}`;
        else if (matchGeneric) reason = `Non-residential network token: "${matchGeneric.trim()}"`;
        return {
          ip: String(j?.ip ?? ""),
          country_code: j?.country_code ?? null,
          country_name: j?.country ?? null,
          asn,
          org: j?.connection?.org ?? j?.connection?.isp ?? null,
          vpn_suspected: !!reason,
          reason,
        };
      }
    }
  } catch { /* fall through */ }

  try {
    const r = await fetch("https://ipapi.co/json/", { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    const org = String(j?.org ?? "").toLowerCase();
    const asn = String(j?.asn ?? "");
    const lcAsn = asn.toLowerCase();
    const matchHost = VPN_HOSTS.find((h) => org.includes(h) || lcAsn.includes(h));
    const matchGeneric = GENERIC_TOKENS.find((h) => org.includes(h));
    const flagProxy = j?.proxy === true;
    const flagHosting = j?.hosting === true;
    const flagVpn = j?.security?.vpn === true || j?.vpn === true;
    let reason: string | null = null;
    if (matchHost) reason = `Datacenter / VPN ASN match: ${matchHost}`;
    else if (matchGeneric) reason = `Non-residential network token: "${matchGeneric.trim()}"`;
    else if (flagVpn) reason = "VPN flag from IP intelligence";
    else if (flagProxy) reason = "Proxy flag from IP intelligence";
    else if (flagHosting) reason = "Hosting / datacenter IP";
    return {
      ip: String(j?.ip ?? ""),
      country_code: j?.country_code ?? null,
      country_name: j?.country_name ?? null,
      asn,
      org: j?.org ?? null,
      vpn_suspected: !!reason,
      reason,
    };
  } catch {
    return null;
  }
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
